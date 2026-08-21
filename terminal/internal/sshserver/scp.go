package sshserver

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"time"

	"github.com/charmbracelet/ssh"
	"github.com/charmbracelet/wish"
	"github.com/charmbracelet/wish/scp"
)

// cvHandler serves exactly one file over scp: the CV PDF found in dir,
// presented to the client as "cv.pdf" regardless of its real filename.
type cvHandler struct {
	dir string
}

func (h cvHandler) pdfPath() (string, error) {
	entries, err := os.ReadDir(h.dir)
	if err != nil {
		return "", err
	}
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".pdf" {
			return filepath.Join(h.dir, e.Name()), nil
		}
	}
	return "", fmt.Errorf("no CV PDF found in %s", h.dir)
}

func (h cvHandler) Glob(_ ssh.Session, pattern string) ([]string, error) {
	if pattern == "cv.pdf" || pattern == "*" || pattern == "*.pdf" {
		return []string{"cv.pdf"}, nil
	}
	return nil, fmt.Errorf("not found: %s", pattern)
}

func (h cvHandler) WalkDir(_ ssh.Session, _ string, _ fs.WalkDirFunc) error {
	return fmt.Errorf("directory download is not supported")
}

func (h cvHandler) NewDirEntry(_ ssh.Session, _ string) (*scp.DirEntry, error) {
	return nil, fmt.Errorf("directory download is not supported")
}

func (h cvHandler) NewFileEntry(_ ssh.Session, path string) (*scp.FileEntry, func() error, error) {
	if path != "cv.pdf" {
		return nil, nil, fmt.Errorf("no such file: %s", path)
	}
	real, err := h.pdfPath()
	if err != nil {
		return nil, nil, err
	}
	f, err := os.Open(real)
	if err != nil {
		return nil, nil, err
	}
	info, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, nil, err
	}
	return &scp.FileEntry{
		Name:     "cv.pdf",
		Filepath: "cv.pdf",
		Mode:     0o644,
		Size:     info.Size(),
		Mtime:    info.ModTime().Unix(),
		Atime:    time.Now().Unix(),
		Reader:   f,
	}, f.Close, nil
}

// uploadRejected refuses any `scp <local> user@host:` upload — this is a
// download-only, read-only demo endpoint.
type uploadRejected struct{}

func (uploadRejected) Mkdir(_ ssh.Session, _ *scp.DirEntry) error {
	return fmt.Errorf("uploads are not accepted")
}

func (uploadRejected) Write(_ ssh.Session, _ *scp.FileEntry) (int64, error) {
	return 0, fmt.Errorf("uploads are not accepted")
}

func scpMiddleware(h cvHandler) wish.Middleware {
	return scp.Middleware(h, uploadRejected{})
}
