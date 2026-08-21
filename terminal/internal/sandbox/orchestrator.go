// Package sandbox spawns and attaches to the ephemeral, hardened "playground"
// container per SSH/web-terminal session. The terminal backend is the only
// thing holding the Docker socket — the sandbox itself never sees it.
package sandbox

import (
	"context"
	"fmt"
	"io"
	"log"
	"os/exec"
	"regexp"
	"sync/atomic"
	"time"

	"github.com/creack/pty"
)

// Winsize is a terminal size change, forwarded from the caller's PTY into the
// sandbox container's PTY.
type Winsize struct {
	Cols int
	Rows int
}

// Config holds the concerns shared across every program the orchestrator can
// run: which Docker network isolates them, and the global session-count
// limiter. What actually runs — image, argv, resource caps — is a Program.
type Config struct {
	Network       string
	MaxConcurrent int
	PerIPMax      int
	PerIPWindow   time.Duration
}

func DefaultConfig(network string) Config {
	return Config{
		Network:       network,
		MaxConcurrent: 8,
		PerIPMax:      4,
		PerIPWindow:   10 * time.Minute,
	}
}

// Program is one thing the orchestrator can run in an ephemeral container:
// its image, the argv appended after the image (empty = run the image's own
// CMD), and its resource profile. Name must be unique among programs that
// can run concurrently in the same SSH session — it's part of the container
// name, so two programs sharing a Name would collide mid-session.
type Program struct {
	Name        string
	Image       string
	Argv        []string
	Memory      string // e.g. "128m", passed straight to `docker run --memory`
	CPUs        string // e.g. "0.5"
	PidsLimit   int
	TmpfsSize   string // size of the /home/guest tmpfs, e.g. "64m"
	SessionCap  time.Duration
	IdleTimeout time.Duration
}

// PlaygroundProgram is the original single-profile playground: a plain
// shell in the sandbox image, values unchanged from before this type existed.
func PlaygroundProgram(image string) Program {
	return Program{
		Name:        "playground",
		Image:       image,
		Memory:      "128m",
		CPUs:        "0.5",
		PidsLimit:   64,
		TmpfsSize:   "64m",
		SessionCap:  10 * time.Minute,
		IdleTimeout: 3 * time.Minute,
	}
}

// OSProgram boots the ephemeral hobby-OS instance under QEMU (TCG, no
// /dev/kvm — slower than KVM but keeps the same no-extra-devices isolation
// as every other program here). Memory/CPU are higher than the plain shell
// playground because QEMU itself, not just the guest OS, needs headroom.
// SessionCap is deliberately much shorter than the playground's — QEMU pegs
// a full CPU core even idling (measured via `docker stats`), too heavy on
// this box to let run for a full 10 minutes per session.
func OSProgram(image string) Program {
	return Program{
		Name:        "os",
		Image:       image,
		Memory:      "256m",
		CPUs:        "1.0",
		PidsLimit:   96,
		TmpfsSize:   "48m",
		SessionCap:  1 * time.Minute,
		IdleTimeout: 1 * time.Minute,
	}
}

var nameSanitizer = regexp.MustCompile(`[^a-zA-Z0-9_.-]`)

// Orchestrator runs sandbox containers under Config's limits.
type Orchestrator struct {
	cfg     Config
	limiter *Limiter
}

func New(cfg Config) *Orchestrator {
	return &Orchestrator{
		cfg:     cfg,
		limiter: NewLimiter(cfg.MaxConcurrent, cfg.PerIPMax, cfg.PerIPWindow),
	}
}

// Attach runs one program's container with stdio wired to rw, and blocks
// until the session ends (container exits, the hard cap fires, or it goes
// idle). remoteIP and sessionID are used for rate limiting and container
// naming. resize (optional, may be nil) delivers terminal size changes for
// the container's own PTY.
func (o *Orchestrator) Attach(ctx context.Context, rw io.ReadWriter, wantPTY bool, term string, resize <-chan Winsize, remoteIP, sessionID string, prog Program) error {
	release, ok, reason := o.limiter.Acquire(remoteIP)
	if !ok {
		fmt.Fprintf(rw, "\r\n[playground] %s\r\n", reason)
		return nil
	}
	defer release()

	// charmbracelet/ssh cancels a session's context on any net.Error from the
	// underlying connection (see its serverConn Read/Write wrapper) — this can
	// fire spuriously (e.g. on client-side terminal quirks) even though the
	// session is still very much alive, right at the moment a Bubble Tea
	// program hands off control. Trusting a pre-canceled ctx here would mean
	// never starting the sandbox at all. Fall back to a fresh base so a stale
	// cancellation can't prevent the session from starting; a genuinely dead
	// connection will still surface immediately as an I/O error on rw once
	// docker run tries to read/write it.
	base := ctx
	if base.Err() != nil {
		base = context.Background()
	}
	ctx, cancel := context.WithTimeout(base, prog.SessionCap)
	defer cancel()

	activity := &activityIO{ReadWriter: rw}
	activity.touch()

	containerName := "egolab-sbx-" + prog.Name + "-" + nameSanitizer.ReplaceAllString(sessionID, "")

	args := []string{"run", "--rm", "-i"}
	if wantPTY {
		args = append(args, "-t")
	}
	args = append(args,
		"--network", o.cfg.Network,
		"--read-only",
		"--tmpfs", fmt.Sprintf("/home/guest:rw,uid=1000,mode=0700,size=%s", prog.TmpfsSize),
		"--memory="+prog.Memory,
		"--cpus="+prog.CPUs,
		fmt.Sprintf("--pids-limit=%d", prog.PidsLimit),
		"--cap-drop=ALL",
		"--security-opt", "no-new-privileges",
		"--name", containerName,
		"--label", "egolab.sandbox=1",
	)
	if term != "" {
		args = append(args, "-e", "TERM="+term)
	}
	args = append(args, prog.Image)
	args = append(args, prog.Argv...)

	cmd := exec.CommandContext(ctx, "docker", args...)

	// Belt-and-suspenders teardown: exec.CommandContext only kills the
	// `docker run` client on cancellation, which does not reliably stop the
	// container it's attached to. Watch for idle/hard-cap/ctx-done and force
	// `docker kill` the container directly; --rm then reaps it.
	done := make(chan struct{})
	defer close(done)
	go o.watchdog(ctx, done, activity, containerName, prog.IdleTimeout)

	var runErr error
	if wantPTY {
		// `docker run -t` requires the docker CLI's own stdin to be a real
		// TTY (it refuses with "the input device is not a TTY" otherwise) —
		// but our stdin is a remote SSH session, not a local terminal. Give
		// the docker CLI a genuine local PTY and bridge it to rw ourselves,
		// the same way a real terminal would be attached.
		ptmx, err := pty.Start(cmd)
		if err != nil {
			return fmt.Errorf("starting sandbox: %w", err)
		}
		defer ptmx.Close()

		if resize != nil {
			go func() {
				for {
					select {
					case w, ok := <-resize:
						if !ok {
							return
						}
						_ = pty.Setsize(ptmx, &pty.Winsize{Cols: uint16(w.Cols), Rows: uint16(w.Rows)})
					case <-done:
						return
					}
				}
			}()
		}

		copyDone := make(chan struct{}, 2)
		go func() {
			io.Copy(activity, ptmx) //nolint:errcheck
			copyDone <- struct{}{}
		}()
		go func() {
			io.Copy(ptmx, activity) //nolint:errcheck
			copyDone <- struct{}{}
		}()

		runErr = cmd.Wait()
		<-copyDone // one direction always ends when the container exits
	} else {
		cmd.Stdin = activity
		cmd.Stdout = activity
		cmd.Stderr = activity
		if err := cmd.Start(); err != nil {
			return fmt.Errorf("starting sandbox: %w", err)
		}
		runErr = cmd.Wait()
	}

	if ctx.Err() != nil {
		fmt.Fprintf(rw, "\r\n[playground] sesi berakhir (timeout).\r\n")
		return nil
	}
	return runErr
}

func (o *Orchestrator) watchdog(ctx context.Context, done chan struct{}, activity *activityIO, containerName string, idleTimeout time.Duration) {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-done:
			return
		case <-ctx.Done():
			killContainer(containerName)
			return
		case <-ticker.C:
			if time.Since(activity.lastActivity()) > idleTimeout {
				killContainer(containerName)
				return
			}
		}
	}
}

func killContainer(name string) {
	if err := exec.Command("docker", "kill", name).Run(); err != nil {
		log.Printf("sandbox: docker kill %s: %v", name, err)
	}
}

// activityIO wraps a session's ReadWriter to track the last time any byte
// moved in either direction, for idle-timeout purposes.
type activityIO struct {
	io.ReadWriter
	last atomic.Int64
}

func (a *activityIO) touch() { a.last.Store(time.Now().UnixNano()) }

func (a *activityIO) lastActivity() time.Time {
	return time.Unix(0, a.last.Load())
}

func (a *activityIO) Read(p []byte) (int, error) {
	n, err := a.ReadWriter.Read(p)
	if n > 0 {
		a.touch()
	}
	return n, err
}

func (a *activityIO) Write(p []byte) (int, error) {
	n, err := a.ReadWriter.Write(p)
	if n > 0 {
		a.touch()
	}
	return n, err
}
