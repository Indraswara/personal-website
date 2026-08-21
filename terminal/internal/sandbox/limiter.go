package sandbox

import (
	"sync"
	"time"
)

// Limiter caps how many sandboxes can run at once (global) and how often a
// single remote IP can start a new one (abuse guard on a public anonymous
// shell). It is intentionally simple — no external deps.
type Limiter struct {
	maxConcurrent int
	perIPWindow   time.Duration
	perIPMax      int

	mu     sync.Mutex
	active int
	starts map[string][]time.Time // remote IP -> recent session-start timestamps
}

func NewLimiter(maxConcurrent, perIPMax int, perIPWindow time.Duration) *Limiter {
	return &Limiter{
		maxConcurrent: maxConcurrent,
		perIPWindow:   perIPWindow,
		perIPMax:      perIPMax,
		starts:        make(map[string][]time.Time),
	}
}

// Acquire tries to reserve one sandbox slot for ip. On success it returns a
// release func the caller must call exactly once when the sandbox exits.
func (l *Limiter) Acquire(ip string) (release func(), ok bool, reason string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	if l.active >= l.maxConcurrent {
		return nil, false, "playground penuh, coba lagi sebentar lagi"
	}

	now := time.Now()
	cutoff := now.Add(-l.perIPWindow)
	recent := l.starts[ip][:0]
	for _, t := range l.starts[ip] {
		if t.After(cutoff) {
			recent = append(recent, t)
		}
	}
	if len(recent) >= l.perIPMax {
		l.starts[ip] = recent
		return nil, false, "terlalu banyak sesi dari IP ini, coba lagi nanti"
	}

	l.starts[ip] = append(recent, now)
	l.active++
	released := false
	return func() {
		l.mu.Lock()
		defer l.mu.Unlock()
		if released {
			return
		}
		released = true
		l.active--
	}, true, ""
}
