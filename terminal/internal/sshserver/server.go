// Package sshserver wires up the wish SSH server: anonymous auth, the Bubble
// Tea landing menu, scp (for CV download), and handoff into the sandbox
// playground. The web-terminal bridge (internal/webbridge) drives this same
// server as an SSH *client* over loopback, so this is the one true code path.
package sshserver

import (
	"fmt"
	"log"
	"net"
	"strconv"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/ssh"
	"github.com/charmbracelet/wish"

	"egolab/terminal/internal/registry"
	"egolab/terminal/internal/sandbox"
	"egolab/terminal/internal/tui"
)

type Config struct {
	Addr         string // e.g. ":2022"
	HostKey      string // path to the persisted host key (created on first boot)
	SSHHost      string // public hostname shown in the CV/scp instructions
	CVDir        string // directory containing the CV PDF served over scp
	SandboxImage string // plain shell playground image
	OSImage      string // ephemeral hobby-OS (QEMU) image
}

func New(cfg Config, reg *registry.Registry, orch, osOrch *sandbox.Orchestrator) (*ssh.Server, error) {
	menu := menuMiddleware(reg, cfg.SSHHost, orch, osOrch, cfg.SandboxImage, cfg.OSImage)
	dl := cvHandler{dir: cfg.CVDir}

	s, err := wish.NewServer(
		wish.WithAddress(cfg.Addr),
		wish.WithHostKeyPath(cfg.HostKey),
		// Public, anonymous playground: accept any key or password.
		wish.WithPublicKeyAuth(func(ctx ssh.Context, key ssh.PublicKey) bool { return true }),
		wish.WithPasswordAuth(func(ctx ssh.Context, password string) bool { return true }),
		wish.WithMiddleware(
			menu,
			scpMiddleware(dl),
		),
	)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func menuMiddleware(reg *registry.Registry, sshHost string, orch, osOrch *sandbox.Orchestrator, sandboxImage, osImage string) wish.Middleware {
	return func(next ssh.Handler) ssh.Handler {
		return func(sess ssh.Session) {
			pty, winCh, isPty := sess.Pty()
			if !isPty {
				fmt.Fprintln(sess, "this shell needs a pty — try `ssh -t` (or use the web terminal at https://egolab.top)")
				next(sess)
				return
			}

			remoteIP := remoteHost(sess.RemoteAddr())
			sessionID := sessionIDOf(sess)
			router := newInputRouter(sess)

			for {
				w, h := pty.Window.Width, pty.Window.Height
				if w == 0 || h == 0 {
					// Some clients report a 0x0 initial pty-req size and rely
					// on a later SIGWINCH that may never come — fall back to
					// a sane default so the menu still renders.
					w, h = 80, 24
				}
				menuCh, unsubMenu := router.subscribe()
				m := tui.New(reg, sshHost, w)
				p := tea.NewProgram(m,
					tea.WithInput(&chanReader{ch: menuCh}),
					tea.WithOutput(sess),
					tea.WithAltScreen(),
					tea.WithoutSignalHandler(),
				)

				// p.Send blocks until the program's event loop is reading
				// from its message channel, which only happens once p.Run
				// has started — so resize forwarding must run concurrently
				// with, never before, the p.Run() call below. This goroutine
				// is intentionally not waited on: winCh only closes when the
				// whole SSH session ends, which may be long after (or never,
				// relative to) this particular tea.Program quitting, so
				// blocking on its exit here would hang every hand-off to the
				// sandbox. p.Send is a safe no-op once p has shut down.
				resizeStop := make(chan struct{})
				go func() {
					for {
						select {
						case w, ok := <-winCh:
							if !ok {
								return
							}
							p.Send(tea.WindowSizeMsg{Width: w.Width, Height: w.Height})
						case <-resizeStop:
							return
						}
					}
				}()

				final, err := p.Run()
				close(resizeStop)
				unsubMenu()
				if err != nil {
					log.Printf("tui: %v", err)
					next(sess)
					return
				}

				fm, ok := final.(tui.Model)
				if !ok {
					next(sess)
					return
				}

				var prog sandbox.Program
				runOrch := orch
				switch fm.Action {
				case tui.ActionPlayground:
					prog = sandbox.PlaygroundProgram(sandboxImage)
				case tui.ActionOS:
					prog = sandbox.OSProgram(osImage)
					// QEMU pegs a full CPU core even idling (TCG has no
					// interrupt-driven halt the way KVM does) — measured
					// ~100% on this box's cores. The shared limiter allows
					// 8 concurrent programs, fine for near-idle shells but
					// enough QEMU instances to saturate a small VPS. Route
					// OS through its own tighter-capped orchestrator instead.
					runOrch = osOrch
					// QEMU's curses UI reads keystrokes straight into the
					// guest's PS/2 keyboard, so the OS itself has no "exit"
					// command — leaving means switching to QEMU's own
					// monitor console first. Verified empirically: curses
					// does not answer the `-nographic`-style Ctrl-a escapes,
					// only Alt+2 (ESC '2').
					fmt.Fprintf(sess, "\r\n[os] booting a real x86 OS in QEMU — this takes a few seconds\r\n[os] to leave: press Alt+2 for the QEMU monitor, then type quit + Enter\r\n[os] auto-stops after 1 minute either way (QEMU is heavy on this box)\r\n\r\n")
				default:
					next(sess)
					return
				}

				resizeCh := make(chan sandbox.Winsize, 1)
				stopResize := make(chan struct{})
				go func() {
					defer close(resizeCh)
					for {
						select {
						case w, ok := <-winCh:
							if !ok {
								return
							}
							select {
							case resizeCh <- sandbox.Winsize{Cols: w.Width, Rows: w.Height}:
							case <-stopResize:
								return
							}
						case <-stopResize:
							return
						}
					}
				}()
				sbxCh, unsubSbx := router.subscribe()
				sbxRW := routedRW{Reader: &chanReader{ch: sbxCh}, Writer: sess}
				if err := runOrch.Attach(sess.Context(), sbxRW, true, pty.Term, resizeCh, remoteIP, sessionID, prog); err != nil {
					log.Printf("sandbox: %v", err)
				}
				unsubSbx()
				close(stopResize)
				continue // back to the menu
			}
		}
	}
}

func remoteHost(addr net.Addr) string {
	host, _, err := net.SplitHostPort(addr.String())
	if err != nil {
		return addr.String()
	}
	return host
}

func sessionIDOf(sess ssh.Session) string {
	if ctx, ok := sess.Context().Value(ssh.ContextKeySessionID).(string); ok && ctx != "" {
		return ctx
	}
	return strconv.FormatInt(time.Now().UnixNano(), 36)
}
