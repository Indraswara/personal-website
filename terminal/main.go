package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"egolab/terminal/internal/registry"
	"egolab/terminal/internal/sandbox"
	"egolab/terminal/internal/sshserver"
	"egolab/terminal/internal/webbridge"
)

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	dataDir := env("DATA_DIR", "/data")
	registryPath := env("REGISTRY_PATH", "/data/registry.json")
	sandboxImage := env("SANDBOX_IMAGE", "egolab-sandbox:latest")
	sandboxNetwork := env("SANDBOX_NETWORK", "egolab_sandbox")
	sshAddr := env("SSH_ADDR", ":2022")
	webAddr := env("WEB_ADDR", ":8080")
	sshHost := env("SSH_HOST", "ssh.egolab.top")

	reg, err := registry.Load(registryPath)
	if err != nil {
		log.Printf("registry: %v (continuing with an empty project list)", err)
		reg = &registry.Registry{}
	}

	orch := sandbox.New(sandbox.DefaultConfig(sandboxImage, sandboxNetwork))

	sshSrv, err := sshserver.New(sshserver.Config{
		Addr:    sshAddr,
		HostKey: filepath.Join(dataDir, "ssh_host_ed25519_key"),
		SSHHost: sshHost,
		CVDir:   env("CV_DIR", "/data/cv"),
	}, reg, orch)
	if err != nil {
		log.Fatalf("ssh server: %v", err)
	}

	webHandler := webbridge.New(webbridge.Config{
		Addr:           webAddr,
		SSHAddr:        "127.0.0.1" + sshAddr,
		SandboxImage:   sandboxImage,
		SandboxNetwork: sandboxNetwork,
	}, reg)
	httpSrv := &http.Server{Addr: webAddr, Handler: webHandler}

	go func() {
		log.Printf("ssh listening on %s", sshAddr)
		if err := sshSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("ssh server: %v", err)
		}
	}()
	go func() {
		log.Printf("web terminal bridge listening on %s", webAddr)
		if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("web server: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	log.Println("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 10e9)
	defer cancel()
	httpSrv.Shutdown(ctx)
	sshSrv.Shutdown(ctx)
}
