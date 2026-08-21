package webbridge

import (
	"bytes"
	"context"
	"encoding/json"
	"net"
	"net/http"
	"os/exec"
	"time"

	"egolab/terminal/internal/sandbox"
)

// htmlCheckLimiter guards the on-site "paste your HTML" checker
// (POST /api/htmlcheck) — separate from the interactive playground's own
// limiter so a burst of one-off checks can't starve real playground
// sessions, or vice versa.
var htmlCheckLimiter = sandbox.NewLimiter(4, 10, time.Minute)

const maxHTMLCheckBytes = 100 * 1024 // 100KB — this is a syntax demo, not a file host

type htmlCheckRequest struct {
	HTML string `json:"html"`
}

type htmlCheckResponse struct {
	Output string `json:"output,omitempty"`
	Error  string `json:"error,omitempty"`
}

func remoteHostFromAddr(addr string) string {
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		return addr
	}
	return host
}

func handleHTMLCheck(w http.ResponseWriter, r *http.Request, image, network string) {
	// egolab.top calls this cross-origin (the site is served by a different
	// container than the one this endpoint lives on) with a JSON body, which
	// makes the browser preflight with OPTIONS — Allow-Origin alone isn't
	// enough, the preflight also checks Allow-Headers/Allow-Methods.
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(htmlCheckResponse{Error: "POST only"})
		return
	}

	remoteIP := remoteHostFromAddr(r.RemoteAddr)
	release, ok, reason := htmlCheckLimiter.Acquire(remoteIP)
	if !ok {
		w.WriteHeader(http.StatusTooManyRequests)
		json.NewEncoder(w).Encode(htmlCheckResponse{Error: reason})
		return
	}
	defer release()

	var req htmlCheckRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxHTMLCheckBytes+4096)).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(htmlCheckResponse{Error: "invalid request body"})
		return
	}
	if len(req.HTML) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(htmlCheckResponse{Error: "html is required"})
		return
	}
	if len(req.HTML) > maxHTMLCheckBytes {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(htmlCheckResponse{Error: "html too large (100KB max)"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	out, err := runHTMLCheck(ctx, image, network, req.HTML)
	if err != nil && out == "" {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(htmlCheckResponse{Error: "checker failed to run"})
		return
	}
	json.NewEncoder(w).Encode(htmlCheckResponse{Output: out})
}

// runHTMLCheck runs the same hardened, ephemeral, no-egress sandbox the
// interactive playground uses, but as a single one-shot command instead of
// an attached session — piping the submitted HTML to htmlcheck-stdin and
// capturing its (ANSI-colored) stdout+stderr.
func runHTMLCheck(ctx context.Context, image, network, html string) (string, error) {
	args := []string{
		"run", "--rm", "-i",
		"--network", network,
		"--read-only",
		"--tmpfs", "/home/guest:rw,uid=1000,mode=0700,size=16m",
		"--memory=64m",
		"--cpus=0.25",
		"--pids-limit=32",
		"--cap-drop=ALL",
		"--security-opt", "no-new-privileges",
		"--user", "1000:1000",
		image, "htmlcheck-stdin",
	}
	cmd := exec.CommandContext(ctx, "docker", args...)
	cmd.Stdin = bytes.NewBufferString(html)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	err := cmd.Run()
	return out.String(), err
}
