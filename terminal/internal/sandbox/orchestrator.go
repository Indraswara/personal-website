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

type Config struct {
	Image         string
	Network       string
	SessionCap    time.Duration // hard ceiling on a single playground session
	IdleTimeout   time.Duration // kill if no I/O activity for this long
	MaxConcurrent int
	PerIPMax      int
	PerIPWindow   time.Duration
}

func DefaultConfig(image, network string) Config {
	return Config{
		Image:         image,
		Network:       network,
		SessionCap:    10 * time.Minute,
		IdleTimeout:   3 * time.Minute,
		MaxConcurrent: 8,
		PerIPMax:      4,
		PerIPWindow:   10 * time.Minute,
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

// Attach runs one sandbox container with stdio wired to rw, and blocks until
// the session ends (container exits, the hard cap fires, or it goes idle).
// remoteIP and sessionID are used for rate limiting and container naming.
// resize (optional, may be nil) delivers terminal size changes for the
// container's own PTY.
func (o *Orchestrator) Attach(ctx context.Context, rw io.ReadWriter, wantPTY bool, term string, resize <-chan Winsize, remoteIP, sessionID string) error {
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
	ctx, cancel := context.WithTimeout(base, o.cfg.SessionCap)
	defer cancel()

	activity := &activityIO{ReadWriter: rw}
	activity.touch()

	containerName := "egolab-sbx-" + nameSanitizer.ReplaceAllString(sessionID, "")

	args := []string{"run", "--rm", "-i"}
	if wantPTY {
		args = append(args, "-t")
	}
	args = append(args,
		"--network", o.cfg.Network,
		"--read-only",
		"--tmpfs", "/home/guest:rw,uid=1000,mode=0700,size=64m",
		"--memory=128m",
		"--cpus=0.5",
		"--pids-limit=64",
		"--cap-drop=ALL",
		"--security-opt", "no-new-privileges",
		"--name", containerName,
		"--label", "egolab.sandbox=1",
	)
	if term != "" {
		args = append(args, "-e", "TERM="+term)
	}
	args = append(args, o.cfg.Image)

	cmd := exec.CommandContext(ctx, "docker", args...)

	// Belt-and-suspenders teardown: exec.CommandContext only kills the
	// `docker run` client on cancellation, which does not reliably stop the
	// container it's attached to. Watch for idle/hard-cap/ctx-done and force
	// `docker kill` the container directly; --rm then reaps it.
	done := make(chan struct{})
	defer close(done)
	go o.watchdog(ctx, done, activity, containerName)

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

func (o *Orchestrator) watchdog(ctx context.Context, done chan struct{}, activity *activityIO, containerName string) {
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
			if time.Since(activity.lastActivity()) > o.cfg.IdleTimeout {
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
