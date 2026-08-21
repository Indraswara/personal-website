// homelab-status is a small read-only sidecar: it's the only container that
// joins the homelab's own internal Docker network to TCP-check each
// self-hosted service. Internal container hostnames and ports never leave
// this process — only a public subdomain + online bool. No published port;
// only other containers on egolab_edge can reach it.
package main

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"strconv"
	"sync"
	"time"
)

// service is one self-hosted app reverse-proxied by this box's Nginx Proxy
// Manager, tailnet-only (no public port) — reached here over the homelab's
// own `homelab_db` Docker network by container name, the same way this
// repo's own postgres-backed projects already do.
type service struct {
	Subdomain string
	Host      string
	Port      int
}

// Cross-referenced against `docker ps` on 2026-08-21, not just NPM's saved
// config — two stale entries (vault.egolab.top -> vaultwarden, n8n.egolab.top
// -> n8n) had no running container behind them and were dropped.
// npm-admin.egolab.top (NPM's own admin UI) is deliberately excluded too —
// not something to publicize. All ten live on NPM's own `npm_proxy` Docker
// network, not the shared homelab_db one this repo's other projects use.
var services = []service{
	{"bin.egolab.top", "privatebin", 8080},
	{"tools.egolab.top", "it-tools", 80},
	{"pdf.egolab.top", "stirling-pdf", 8080},
	{"links.egolab.top", "linkding", 9090},
	{"obsidian.egolab.top", "obsidian-couchdb", 5984},
	{"db.egolab.top", "adminer", 8080},
	{"s3.egolab.top", "minio", 9001},
	{"nocodb.egolab.top", "nocodb", 8080},
	{"memos.egolab.top", "memos", 5230},
	{"portainer.egolab.top", "portainer", 9000},
	{"gitea.egolab.top", "gitea", 3000},
}

type serviceStatus struct {
	Subdomain string `json:"subdomain"`
	Online    bool   `json:"online"`
}

func tcpAlive(host string, port int) bool {
	c, err := net.DialTimeout("tcp", net.JoinHostPort(host, strconv.Itoa(port)), 800*time.Millisecond)
	if err != nil {
		return false
	}
	c.Close()
	return true
}

func fetchServices() []serviceStatus {
	out := make([]serviceStatus, len(services))
	var wg sync.WaitGroup
	for i, s := range services {
		wg.Add(1)
		go func(i int, s service) {
			defer wg.Done()
			out[i] = serviceStatus{Subdomain: s.Subdomain, Online: tcpAlive(s.Host, s.Port)}
		}(i, s)
	}
	wg.Wait()
	return out
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("/services", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		json.NewEncoder(w).Encode(fetchServices())
	})

	log.Println("homelab-status listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
