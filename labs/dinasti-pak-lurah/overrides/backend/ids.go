package main

import (
	// "encoding/json"
	"fmt"
	"log"
	"strings"
	"sync/atomic"
	"time"

	"github.com/gocolly/colly/v2"
	"github.com/thalesfsp/go-common-types/safeorderedmap"
)

type pairChan struct {
	found int
	done  bool
}

var (
	controlIDS = make(chan pairChan)
)

func crawlerDLS(start string, target string, depth int, visitCount *int32, linkFound *int32, path *safeorderedmap.SafeOrderedMap[[]string], visited *safeorderedmap.SafeOrderedMap[bool], timer *time.Time) {
	var inserter pairChan
	time.Sleep(500 * time.Millisecond)
	c := colly.NewCollector(
		colly.AllowedDomains("en.wikipedia.org"),
		colly.MaxDepth(depth+1),
		colly.AllowURLRevisit(),
		colly.Async(true),
		// DELETE CACHE SETIAP KALI MAU SEARCH BARU,
		// PENCEGAHAN RACE CONDITION & RAM MELEDAK
		// colly.CacheDir("./cache"),
	)

	// Parallelism > 1 deadlocks: same issue as bfs.go — every completion
	// sends once on the unbuffered controlIDS channel, but the control loop
	// only receives once per pass, and colly.Async(true) fires many
	// completions concurrently once more than one page is in flight. Serial
	// visits keep that one-send-per-receive assumption true.
	c.Limit(&colly.LimitRule{DomainGlob: "*", Parallelism: 1, Delay: 500 * time.Millisecond})

	c.OnRequest(func(r *colly.Request) {
		// fmt.Println("Visiting", r.URL)
	})

	c.OnError(func(_ *colly.Response, err error) {
		log.Println("Something went wrong:", err)
	})

	c.OnResponse(func(r *colly.Response) {
		fmt.Println("Visited", r.Request.URL)
		hasVisited, _ := visited.Get(r.Request.URL.String())
		if !hasVisited {
			visited.Add(r.Request.URL.String(), true)
			atomic.StoreInt32(visitCount, atomic.LoadInt32(visitCount)+1)
		}
	})

	c.OnHTML("a[href]", func(e *colly.HTMLElement) {
		// By Default, this is already Depth-Limited Search LMAOOOOO
		// Sprinkle some async + increment the depth :D
		link := e.Attr("href")
		// Wikipedia now emits article body links as absolute URLs
		// (https://en.wikipedia.org/wiki/X), not the relative /wiki/X form
		// this filter assumes — see the matching comment in bfs.go.
		link = strings.TrimPrefix(link, "https://en.wikipedia.org")
		link = strings.TrimPrefix(link, "http://en.wikipedia.org")
		pathInserter, _ := path.Get(e.Request.AbsoluteURL(link))

		if link == "/wiki/"+target {
			*timer = time.Now()
			fmt.Println("Found target link at depth", depth+1, ":", link, time.Since(*timer))
			if linkNotInside(e.Request.AbsoluteURL(link), e.Request.URL.String(), path) {
				path.Add(e.Request.AbsoluteURL(link), append(pathInserter, e.Request.URL.String()))
			}
			atomic.AddInt32(linkFound, 1)
			inserter.done = true
			inserter.found = depth
			controlIDS <- inserter
			return
		}
		if strings.HasPrefix(link, "/wiki/") &&
			!strings.Contains(link, "File:") &&
			!strings.Contains(link, "Help:") &&
			!strings.Contains(link, "Category:") &&
			!strings.Contains(link, "Wikipedia:") &&
			!strings.Contains(link, "Talk:") &&
			!strings.Contains(link, "Special:") &&
			!strings.Contains(link, "Portal:") &&
			!strings.Contains(link, "Template:") &&
			!strings.Contains(link, "MediaWiki:") &&
			!strings.Contains(link, "User:") &&
			!strings.Contains(link, "_talk:") &&
			e.Request.AbsoluteURL(link) != e.Request.URL.String() &&
			link != "/wiki/Main_Page" {
			if linkNotInside(e.Request.AbsoluteURL(link), e.Request.URL.String(), path) {
				path.Add(e.Request.AbsoluteURL(link), append(pathInserter, e.Request.URL.String()))
			}
			e.Request.Visit(link)
		}
	})

	c.OnScraped(func(r *colly.Response) {
		// fmt.Println("Finished", r.Request.URL)
	})

	c.Visit("https://en.wikipedia.org/wiki/" + start)
	c.Wait()
	inserter.found = -1
	inserter.done = true
	controlIDS <- inserter
}

func crawlerIDS(start, target string, path *safeorderedmap.SafeOrderedMap[[]string], depth *int32, visitCount *int32, searchAll bool, timer time.Time) {
	// os.RemoveAll("./cache")
	var linkFound int32
	callerTimer := timer
	visited := safeorderedmap.New[bool]()
	i := 0
incrementLoop:
	for {
		fmt.Println("Searching at depth:", i)
		go crawlerDLS(start, target, i, visitCount, &linkFound, path, visited, &callerTimer)
		controlFlow := <-controlIDS
		if controlFlow.found != -1 && controlFlow.found < i && controlFlow.done || (atomic.LoadInt32(&linkFound) >= 1 && time.Since(callerTimer) > 500*time.Millisecond && !searchAll) || atomic.LoadInt32(depth) > 9 {
			if controlFlow.found != -1 && controlFlow.found < i && controlFlow.done {
				atomic.AddInt32(depth, -1)
			}
			break incrementLoop
		}
		if controlFlow.done && controlFlow.found == -1 {
			i++
			atomic.StoreInt32(depth, int32(i))
		}
	}
}
