// Package webbridge serves the browser-side terminal. It does NOT re-run the
// Bubble Tea program directly — instead it opens an SSH *client* connection
// to this same backend's own wish server over loopback and bridges that
// session to a WebSocket. That keeps SSH and the web terminal on the exact
// same code path (internal/sshserver), so behaviour never drifts between them.
package webbridge

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"golang.org/x/crypto/ssh"

	"egolab/terminal/internal/registry"
)

type Config struct {
	Addr           string // e.g. ":8080"
	SSHAddr        string // loopback address of our own wish server, e.g. "127.0.0.1:2022"
	AllowedWeb     map[string]int
	SandboxImage   string // for the one-off /api/htmlcheck sandbox, e.g. "egolab-sandbox:latest"
	SandboxNetwork string
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	// Public demo terminal embedded on our own site; no session cookies or
	// credentials ride on this connection, so a permissive origin check is
	// an acceptable tradeoff for a read/write PTY that's anonymous by design.
	CheckOrigin: func(r *http.Request) bool { return true },
}

func New(cfg Config, reg *registry.Registry) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWS(w, r, cfg.SSHAddr)
	})
	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		handleStatus(w, reg)
	})
	mux.HandleFunc("/api/htmlcheck", func(w http.ResponseWriter, r *http.Request) {
		handleHTMLCheck(w, r, cfg.SandboxImage, cfg.SandboxNetwork)
	})
	return mux
}

func parseSizeParam(v string, def int) int {
	n, err := strconv.Atoi(v)
	if err != nil || n <= 0 || n > 1000 {
		return def
	}
	return n
}

type controlMsg struct {
	Type string `json:"type"`
	Cols int    `json:"cols"`
	Rows int    `json:"rows"`
}

func handleWS(w http.ResponseWriter, r *http.Request, sshAddr string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("webbridge: upgrade: %v", err)
		return
	}
	defer conn.Close()

	client, err := ssh.Dial("tcp", sshAddr, &ssh.ClientConfig{
		User:            "guest",
		Auth:            []ssh.AuthMethod{ssh.Password("guest")},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // loopback-only, same host
		Timeout:         5 * time.Second,
	})
	if err != nil {
		log.Printf("webbridge: ssh dial: %v", err)
		conn.WriteMessage(websocket.TextMessage, []byte("\r\nlab backend unavailable, try again shortly\r\n"))
		return
	}
	defer client.Close()

	sess, err := client.NewSession()
	if err != nil {
		log.Printf("webbridge: ssh session: %v", err)
		return
	}
	defer sess.Close()

	// The client sends its already-fitted terminal size as query params so
	// the very first frame renders at the right size — waiting for a
	// post-connect resize message means the server renders once at a
	// fallback size and once more moments later, which can leave stray
	// leftover lines behind when the width actually changes between frames.
	cols, rows := parseSizeParam(r.URL.Query().Get("cols"), 80), parseSizeParam(r.URL.Query().Get("rows"), 24)
	if err := sess.RequestPty("xterm-256color", rows, cols, ssh.TerminalModes{
		ssh.ECHO:          1,
		ssh.TTY_OP_ISPEED: 14400,
		ssh.TTY_OP_OSPEED: 14400,
	}); err != nil {
		log.Printf("webbridge: request pty: %v", err)
		return
	}

	stdin, err := sess.StdinPipe()
	if err != nil {
		log.Printf("webbridge: stdin pipe: %v", err)
		return
	}
	out := &wsWriter{conn: conn}
	sess.Stdout = out
	sess.Stderr = out

	if err := sess.Shell(); err != nil {
		log.Printf("webbridge: shell: %v", err)
		return
	}

	waitDone := make(chan struct{})
	go func() {
		sess.Wait()
		close(waitDone)
		conn.Close()
	}()

	for {
		msgType, data, err := conn.ReadMessage()
		if err != nil {
			break
		}
		if msgType == websocket.TextMessage {
			var ctrl controlMsg
			if json.Unmarshal(data, &ctrl) == nil && ctrl.Type == "resize" && ctrl.Cols > 0 && ctrl.Rows > 0 {
				sess.WindowChange(ctrl.Rows, ctrl.Cols)
				continue
			}
		}
		if _, err := stdin.Write(data); err != nil {
			break
		}
	}
	<-waitDone
}

type wsWriter struct {
	conn *websocket.Conn
	mu   sync.Mutex
}

func (w *wsWriter) Write(p []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if err := w.conn.WriteMessage(websocket.BinaryMessage, p); err != nil {
		return 0, err
	}
	return len(p), nil
}

type statusEntry struct {
	Slug string `json:"slug"`
	Live bool   `json:"live"`
}

func handleStatus(w http.ResponseWriter, reg *registry.Registry) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	// Public, unauthenticated liveness data — the portfolio at egolab.top
	// polls this cross-origin to show live/down badges on project cards.
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if reg == nil {
		json.NewEncoder(w).Encode([]statusEntry{})
		return
	}
	var out []statusEntry
	for _, p := range reg.WithWeb() {
		out = append(out, statusEntry{Slug: p.Slug, Live: tcpAlive(p.Web.CheckHost, p.Web.CheckPort)})
	}
	json.NewEncoder(w).Encode(out)
}

// Dials the project's compose container_name on the shared egolab_edge
// Docker network, not 127.0.0.1 — this process runs inside its own container,
// so the host's loopback-bound published ports (cloudflared ingress targets)
// are a different, unreachable network namespace from here.
func tcpAlive(host string, port int) bool {
	if host == "" || port == 0 {
		return false
	}
	addr := net.JoinHostPort(host, strconv.Itoa(port))
	c, err := net.DialTimeout("tcp", addr, 300*time.Millisecond)
	if err != nil {
		return false
	}
	c.Close()
	return true
}
