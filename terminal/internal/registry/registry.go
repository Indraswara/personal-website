// Package registry loads content/registry.json — the single source of truth
// for projects, shared with the website (fetched directly) and shell scripts
// (read via jq). See scripts/lib/registry.sh for the shell-side reader.
package registry

import (
	"encoding/json"
	"os"
)

type Web struct {
	Subdomain string `json:"subdomain"`
	Port      int    `json:"port"`
}

type Lab struct {
	Kind  string `json:"kind"` // "cli" (interactive/one-shot binary in the sandbox)
	Cmd   string `json:"cmd"`
	Blurb string `json:"blurb"`
}

type Project struct {
	Slug        string   `json:"slug"`
	Title       string   `json:"title"`
	Date        string   `json:"date"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	Repo        string   `json:"repo"`
	Web         *Web     `json:"web,omitempty"`
	Lab         *Lab     `json:"lab,omitempty"`
	Site        string   `json:"site,omitempty"`
}

type Registry struct {
	Projects []Project `json:"projects"`
}

func Load(path string) (*Registry, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var r Registry
	if err := json.Unmarshal(data, &r); err != nil {
		return nil, err
	}
	return &r, nil
}

// WithLab returns projects that have a sandbox lab demo, in registry order.
func (r *Registry) WithLab() []Project {
	var out []Project
	for _, p := range r.Projects {
		if p.Lab != nil {
			out = append(out, p)
		}
	}
	return out
}

// WithWeb returns projects hosted as their own subdomain, in registry order.
func (r *Registry) WithWeb() []Project {
	var out []Project
	for _, p := range r.Projects {
		if p.Web != nil {
			out = append(out, p)
		}
	}
	return out
}
