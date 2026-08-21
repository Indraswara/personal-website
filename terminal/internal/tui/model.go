// Package tui is the Bubble Tea landing menu shown to every session — real
// SSH and the browser web-terminal both run this exact program (see
// internal/sshserver and internal/webbridge), so behaviour is identical on
// both paths.
package tui

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"egolab/terminal/internal/registry"
)

// Action is what the caller (the SSH/web session handler) should do once the
// program quits.
type Action int

const (
	ActionNone Action = iota
	ActionPlayground
	ActionOS
	ActionExit
)

var (
	titleStyle   = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("42"))
	subtleStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("245"))
	selectedItem = lipgloss.NewStyle().Foreground(lipgloss.Color("42")).Bold(true)
	normalItem   = lipgloss.NewStyle().Foreground(lipgloss.Color("252"))
	tagStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("39"))
	helpStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
	boxStyle     = lipgloss.NewStyle().Border(lipgloss.RoundedBorder()).BorderForeground(lipgloss.Color("240")).Padding(0, 1)
)

type screen int

const (
	screenMenu screen = iota
	screenAbout
	screenExperience
	screenEducation
	screenProjects
	screenCV
)

type menuEntry struct {
	label  string
	screen screen
	action Action
}

type Model struct {
	reg      *registry.Registry
	sshHost  string // e.g. "ssh.egolab.top" — shown in the scp instructions
	cur      screen
	cursor   int
	entries  []menuEntry
	width    int
	Action   Action
	quitting bool
}

func New(reg *registry.Registry, sshHost string, width int) Model {
	if width <= 0 {
		width = 78
	}
	return Model{
		reg:     reg,
		sshHost: sshHost,
		cur:     screenMenu,
		width:   width,
		entries: []menuEntry{
			{"About", screenAbout, ActionNone},
			{"Experience", screenExperience, ActionNone},
			{"Education", screenEducation, ActionNone},
			{"Projects", screenProjects, ActionNone},
			{"Download CV (scp)", screenCV, ActionNone},
			{"Enter playground", screenMenu, ActionPlayground},
			{"Launch OS (QEMU, boots fresh each time)", screenMenu, ActionOS},
			{"Exit", screenMenu, ActionExit},
		},
	}
}

func (m Model) Init() tea.Cmd { return nil }

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		if msg.Width > 20 {
			m.width = min(msg.Width-2, 96)
		}
		return m, nil
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			if m.cur != screenMenu {
				m.cur = screenMenu
				// Sub-screens vary in line count (Projects is taller than
				// About, etc.) — the default renderer only clears trailing
				// lines it remembers from the previous frame, so a shorter
				// redraw can leave stray lines from a taller one behind.
				// Force a full repaint instead of relying on that diff.
				return m, tea.ClearScreen
			}
			m.Action = ActionExit
			m.quitting = true
			return m, tea.Quit
		case "esc":
			if m.cur != screenMenu {
				m.cur = screenMenu
				return m, tea.ClearScreen
			}
			return m, nil
		case "up", "k":
			if m.cur == screenMenu && m.cursor > 0 {
				m.cursor--
			}
			return m, nil
		case "down", "j":
			if m.cur == screenMenu && m.cursor < len(m.entries)-1 {
				m.cursor++
			}
			return m, nil
		case "enter", " ":
			if m.cur != screenMenu {
				return m, nil
			}
			e := m.entries[m.cursor]
			if e.action != ActionNone {
				m.Action = e.action
				m.quitting = true
				return m, tea.Quit
			}
			m.cur = e.screen
			return m, nil
		}
	}
	return m, nil
}

func (m Model) View() string {
	if m.quitting {
		return ""
	}
	switch m.cur {
	case screenAbout:
		return m.renderDetail("About", aboutText())
	case screenExperience:
		return m.renderDetail("Experience", listText([]listItem{
			{"Security Engineer", "06/2025 - 08/2025", "Mobile scraper development and reverse-engineering tasks."},
			{"Laboratory Assistant, SISTER ITB", "08/2024 - present", "Networking, OS, virtualization, distributed systems."},
			{"Backend Engineer (outsourced)", "05/2024 - 08/2024", "TypeScript scrapers, DB schema design, React + Strapi."},
			{"IT Staff", "08/2023 - 08/2024", "Built Gen-Finder (NIM search); managed The Gestalt Project."},
		}))
	case screenEducation:
		return m.renderDetail("Education", listText([]listItem{
			{"Bandung Institute of Technology (ITB)", "2022 - 2026", "B.Sc. Computer Science."},
		}))
	case screenProjects:
		return m.renderDetail("Projects", m.projectsText())
	case screenCV:
		return m.renderDetail("Download CV", cvText(m.sshHost))
	default:
		return m.renderMenu()
	}
}

func (m Model) renderMenu() string {
	var b strings.Builder
	b.WriteString(titleStyle.Render("indraswara@egolab") + subtleStyle.Render(" — welcome to the lab") + "\n")
	b.WriteString(subtleStyle.Render(strings.Repeat("─", min(m.width, 60))) + "\n\n")
	for i, e := range m.entries {
		cursor := "  "
		style := normalItem
		if i == m.cursor {
			cursor = "> "
			style = selectedItem
		}
		b.WriteString(cursor + style.Render(e.label) + "\n")
	}
	b.WriteString("\n" + helpStyle.Render("↑/↓ move · enter select · q quit"))
	return b.String()
}

func (m Model) renderDetail(title, body string) string {
	content := titleStyle.Render(title) + "\n\n" + body
	return boxStyle.Width(m.width-4).Render(content) + "\n" + helpStyle.Render("esc back · q menu")
}

func aboutText() string {
	return "Computer Science student at ITB, security engineer, and developer.\n" +
		"I like breaking things to understand them, then building better ones.\n\n" +
		"This whole site runs as a Docker sandbox you're inside right now —\n" +
		"select \"Enter playground\" from the menu to explore my projects live."
}

type listItem struct{ title, date, desc string }

func listText(items []listItem) string {
	var b strings.Builder
	for i, it := range items {
		b.WriteString(selectedItem.Render(it.title) + "  " + tagStyle.Render(it.date) + "\n")
		b.WriteString(normalItem.Render(it.desc) + "\n")
		if i < len(items)-1 {
			b.WriteString("\n")
		}
	}
	return b.String()
}

func (m Model) projectsText() string {
	if m.reg == nil {
		return "No projects loaded."
	}
	var b strings.Builder
	for i, p := range m.reg.Projects {
		b.WriteString(selectedItem.Render(p.Title) + "  " + tagStyle.Render(p.Date) + "\n")
		b.WriteString(normalItem.Render(p.Description) + "\n")
		switch {
		case p.Web != nil:
			b.WriteString(subtleStyle.Render(fmt.Sprintf("  -> https://%s.egolab.top", p.Web.Subdomain)) + "\n")
		case p.Lab != nil:
			b.WriteString(subtleStyle.Render(fmt.Sprintf("  -> run `%s` from the playground", p.Lab.Cmd)) + "\n")
		}
		if i < len(m.reg.Projects)-1 {
			b.WriteString("\n")
		}
	}
	return b.String()
}

func cvText(sshHost string) string {
	host := sshHost
	if host == "" {
		host = "ssh.egolab.top"
	}
	return "Grab the PDF straight from this session:\n\n" +
		tagStyle.Render(fmt.Sprintf("  scp -O -o ProxyCommand=\"cloudflared access tcp --hostname %s\" \\\n"+
			"      guest@%s:cv.pdf .", host, host)) +
		"\n\n(-O forces the legacy scp protocol — recent OpenSSH defaults to sftp,\n" +
		"which this lab doesn't speak.)\n\n" +
		"Or from the playground shell: cat ~/cv.txt for a plain-text version."
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
