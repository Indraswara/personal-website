package sshserver

import (
	"io"
	"sync"

	"github.com/charmbracelet/ssh"
)

// inputRouter owns the single goroutine that reads from an ssh.Session for
// the session's whole lifetime, and hands each chunk read to whichever
// consumer is currently subscribed (the TUI menu, then the sandbox
// playground, back and forth).
//
// This exists because of a subtle bubbletea/cancelreader interaction: when a
// tea.Program's input isn't an *os.File, it falls back to a reader that
// cannot interrupt an in-flight blocking Read — Cancel() only takes effect
// on the *next* Read call. So right after a tea.Program quits, its internal
// read loop can still be blocked inside sess.Read(), and if it "wins" the
// race for the very next chunk of client input, that chunk gets silently
// discarded (the cancel check after the read throws it away) instead of
// ever reaching the sandbox that just took over. Routing all reads through
// one owner and only ever handing new chunks to the *current* subscriber
// means a stale/orphaned reader simply blocks forever on an abandoned
// channel instead of stealing live input — a small leaked goroutine per
// hand-off instead of lost keystrokes.
type inputRouter struct {
	mu      sync.Mutex
	current chan []byte
}

func newInputRouter(sess ssh.Session) *inputRouter {
	ir := &inputRouter{}
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := sess.Read(buf)
			if n > 0 {
				chunk := make([]byte, n)
				copy(chunk, buf[:n])
				ir.mu.Lock()
				ch := ir.current
				ir.mu.Unlock()
				if ch != nil {
					select {
					case ch <- chunk:
					case <-sess.Context().Done():
						return
					}
				}
			}
			if err != nil {
				return
			}
		}
	}()
	return ir
}

// subscribe makes ch the target for future reads and returns it along with
// an unsubscribe func to call once the caller is done (e.g. tea.Program has
// quit, or the sandbox session ended).
func (ir *inputRouter) subscribe() (<-chan []byte, func()) {
	ch := make(chan []byte, 32)
	ir.mu.Lock()
	ir.current = ch
	ir.mu.Unlock()
	return ch, func() {
		ir.mu.Lock()
		if ir.current == ch {
			ir.current = nil
		}
		ir.mu.Unlock()
	}
}

// chanReader adapts a <-chan []byte to io.Reader.
type chanReader struct {
	ch  <-chan []byte
	buf []byte
}

func (r *chanReader) Read(p []byte) (int, error) {
	if len(r.buf) == 0 {
		chunk, ok := <-r.ch
		if !ok {
			return 0, io.EOF
		}
		r.buf = chunk
	}
	n := copy(p, r.buf)
	r.buf = r.buf[n:]
	return n, nil
}

// routedRW pairs a router-fed Reader with a session's Writer, so callers get
// an io.ReadWriter without ever calling sess.Read directly.
type routedRW struct {
	io.Reader
	io.Writer
}
