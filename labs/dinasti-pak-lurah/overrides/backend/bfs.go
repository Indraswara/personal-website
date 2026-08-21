package main

import (
	"fmt"
	"log"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gocolly/colly/v2"
	"github.com/thalesfsp/go-common-types/safeorderedmap"
)

type emptyNFound struct {
	found bool
	empty bool
}

var (
	controlBFS = make(chan emptyNFound)
)

func BFS(start string, target string, path *safeorderedmap.SafeOrderedMap[[]string], queue *safeorderedmap.SafeOrderedMap[bool], depth *int32, visitCount *int32, searchAll bool, timer *time.Time) {
	var mutex sync.Mutex
	var inserter emptyNFound
	visits := safeorderedmap.New[bool]()

	// path := safeorderedmap.New[[]string]()
	queueChild := safeorderedmap.New[bool]()
	var found int32

	c := colly.NewCollector(
		colly.AllowedDomains("en.wikipedia.org"),
		colly.Async(true),
		// RAMKU MELEDAK KALAU BFS PAKE CACHE
		// colly.CacheDir("./cache"),
	)

	// Parallelism > 1 deadlocks: every OnScraped callback below sends exactly
	// one value on the unbuffered controlBFS channel, but the queueIteration
	// loop only receives once per pass while colly.Async(true) can fire many
	// OnScraped callbacks concurrently for the same batch of c.Visit() calls
	// — the extras block forever with nothing left to receive them, so a
	// crawl past the first page (which queues many links at once) hangs.
	// Serial visits keep the existing one-send-per-receive assumption true.
	c.Limit(&colly.LimitRule{DomainGlob: "*", Parallelism: 1, RandomDelay: 25 * time.Millisecond})

	c.OnRequest(func(r *colly.Request) {
		// fmt.Println("Visiting", r.URL)
	})

	c.OnError(func(r *colly.Response, err error) {
		// Pas error queuenya juga dihapus biar ngga ngeblock
		log.Println("Something went wrong:", err)
		mutex.Lock()
		queue.Delete(r.Request.URL.String())
		if queue.Size() == 0 && atomic.LoadInt32(&found) != 1 {
			queue, queueChild = queueChild, queue
			queueChild = safeorderedmap.New[bool]()
			atomic.AddInt32(depth, 1)
			fmt.Println("Searching at depth:", atomic.LoadInt32(depth))
		}
		mutex.Unlock()
	})

	c.OnResponse(func(r *colly.Response) {
		// I need to track how many links are fully visited
		//fmt.Println("Visited", r.Request.URL.String())
	})

	c.OnHTML("a[href]", func(h *colly.HTMLElement) {
		// time.Sleep(1 * time.Millisecond)
		link := h.Attr("href")
		// Wikipedia now emits article body links as absolute URLs
		// (https://en.wikipedia.org/wiki/X) rather than the relative
		// /wiki/X form this was written against — every filter/comparison
		// below assumes the relative form, so normalize first. Without
		// this, every single link on the page fails strings.HasPrefix
		// and the BFS/IDS queue for the next depth is always empty
		// (looks exactly like a hang: search "succeeds" for depth 0 —
		// the seed page — then the queue is empty and nothing further
		// ever gets visited).
		link = strings.TrimPrefix(link, "https://en.wikipedia.org")
		link = strings.TrimPrefix(link, "http://en.wikipedia.org")
		pathInserter, _ := path.Get(h.Request.AbsoluteURL(link))
		if link == "/wiki/"+target {
			// path.Set(h.Request.AbsoluteURL(link), h.Request.URL.String())
			*timer = time.Now()
			fmt.Println("Found target link at depth", atomic.LoadInt32(depth)+1, ":", link, time.Since(*timer))
			if linkNotInside(h.Request.AbsoluteURL(link), h.Request.URL.String(), path) {
				path.Add(h.Request.AbsoluteURL(link), append(pathInserter, h.Request.URL.String()))
			}
			atomic.AddInt32(&found, 1)
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
			link != "/wiki/Main_Page" &&
			h.Request.AbsoluteURL(link) != h.Request.URL.String() {
			mutex.Lock()
			visited, _ := visits.Get(h.Request.AbsoluteURL(link))
			if !visited {
				queueChild.Add(h.Request.AbsoluteURL(link), true)
			}
			mutex.Unlock()
			if linkNotInside(h.Request.AbsoluteURL(link), h.Request.URL.String(), path) {
				path.Add(h.Request.AbsoluteURL(link), append(pathInserter, h.Request.URL.String()))
			}
		}
	})

	c.OnScraped(func(r *colly.Response) {
		// fmt.Println("Finished", r.Request.URL)
		mutex.Lock()
		atomic.AddInt32(visitCount, 1)
		queue.Delete(r.Request.URL.String())
		// fmt.Println(queue.Size())
		if queue.Size() == 0 {
			inserter.empty = true
		} else {
			inserter.empty = false
		}
		if atomic.LoadInt32(&found) >= 1 {
			inserter.found = true
		} else {
			inserter.found = false
		}
		if queue.Size() == 0 && atomic.LoadInt32(&found) != 1 {
			queue, queueChild = queueChild, queue
			queueChild = safeorderedmap.New[bool]()
			atomic.AddInt32(depth, 1)
			fmt.Println("Searching at depth:", atomic.LoadInt32(depth))
		}
		mutex.Unlock()
		controlBFS <- inserter
	})

queueIteration:
	for {
		mutex.Lock()
		queue.Each(func(key string, value bool) {
			visits.Add(key, true)
			c.Visit(key)
		})
		mutex.Unlock()
		controller := <-controlBFS

		// fmt.Println("Periksa queue", queue.Len())
		if controller.empty && controller.found || (atomic.LoadInt32(&found) >= 1 && time.Since(*timer) > 500*time.Millisecond && !searchAll) || atomic.LoadInt32(depth) > 9 {
			// if controller.empty && controller.found {
			if controller.empty && controller.found {
				atomic.AddInt32(depth, -1)
			}
			c.AllowedDomains = []string{""}
			break queueIteration
		}
		// breaker:
		// 	break queueIteration
	}
}

func crawlerBFS(start string, target string, path *safeorderedmap.SafeOrderedMap[[]string], depth *int32, visitCount *int32, searchAll bool, timer time.Time) {
	var wg sync.WaitGroup
	callerTimer := timer
	queue := safeorderedmap.New[bool]()
	queue.Add("https://en.wikipedia.org/wiki/"+start, true)
	wg.Add(1)
	go func() {
		defer wg.Done()
		BFS(start, target, path, queue, depth, visitCount, searchAll, &callerTimer)
	}()
	wg.Wait()

	// Edge case nguawur
	_, targetInPath := path.Get("https://en.wikipedia.org/wiki/" + target)
	if atomic.LoadInt32(depth) == -1 && targetInPath {
		atomic.StoreInt32(depth, 1)
	}
}
