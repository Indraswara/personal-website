/* ============================================
   Configuration
   ============================================ */
const ROUTABLE_SECTIONS = new Set(["experience", "project", "education"])
const postTemplateCache = new Map()
let activePostCategory = "all"

/* ============================================
   Utilities
   ============================================ */
function navigateTo(route = "") {
  window.location.hash = `#/${route}`
}

function capitalize(str) {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDisplayDate(dateString) {
  if (!dateString) return ""
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) return dateString
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function updatePageTitle(section, detail) {
  const base = "Indraswara"
  if (!section) {
    document.title = base
    return
  }
  const title = detail || capitalize(section)
  document.title = `${title} — ${base}`
}

/* ============================================
   Navigation
   ============================================ */
function setActiveNav(route) {
  const section = route ? route.split("/")[0] : ""
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href").slice(2)
    if (href === section || (!section && href === "")) {
      link.classList.add("active")
    } else {
      link.classList.remove("active")
    }
  })
}

/* Mobile menu */
function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle")
  const navRight = document.querySelector(".nav-right")
  const overlay = document.querySelector(".nav-overlay")
  if (!toggle || !navRight) return

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false")
    navRight.classList.remove("open")
    if (overlay) overlay.classList.remove("open")
  }

  function toggleMenu() {
    const isOpen = toggle.getAttribute("aria-expanded") === "true"
    if (isOpen) {
      closeMenu()
    } else {
      toggle.setAttribute("aria-expanded", "true")
      navRight.classList.add("open")
      if (overlay) overlay.classList.add("open")
    }
  }

  toggle.addEventListener("click", toggleMenu)
  if (overlay) overlay.addEventListener("click", closeMenu)

  navRight.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", closeMenu)
  })
}

/* ============================================
   Dark Mode
   ============================================ */
function initTheme() {
  const saved = localStorage.getItem("theme")
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark")
  } else if (saved === "light") {
    document.documentElement.removeAttribute("data-theme")
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.setAttribute("data-theme", "dark")
  }

  const toggle = document.querySelector(".theme-toggle")
  if (toggle) {
    toggle.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark"
      if (isDark) {
        document.documentElement.removeAttribute("data-theme")
        localStorage.setItem("theme", "light")
      } else {
        document.documentElement.setAttribute("data-theme", "dark")
        localStorage.setItem("theme", "dark")
      }
    })
  }
}

/* ============================================
   Renderers
   ============================================ */
function renderHome() {
  const app = document.getElementById("app")
  const homeCopy = (window.HOME_CONTENT && Array.isArray(window.HOME_CONTENT.intro) && window.HOME_CONTENT.intro.length
    ? window.HOME_CONTENT.intro
    : ["Welcome to my personal website."])
  const introMarkup = homeCopy.map((text) => `<p>${text}</p>`).join("")
  const contactMarkup = renderContactLinks()
  app.innerHTML = `
    <div class="home">
      <div class="home-text">
        ${introMarkup}
        <div class="home-actions">
          <a class="btn" href="assets/cv/Indraswara-CV.pdf" target="_blank" rel="noopener noreferrer">
            &darr; Download CV
          </a>
        </div>
        ${contactMarkup}
      </div>
      <div class="home-terminal">
        <div class="terminal-chrome">
          <div class="terminal-chrome-dots">
            <span></span><span></span><span></span>
          </div>
          <div class="terminal-chrome-title">guest@egolab</div>
        </div>
        <div id="hero-terminal"></div>
      </div>
    </div>
  `
  updatePageTitle()
  initHeroTerminal()
}

function renderSection(sectionName) {
  const app = document.getElementById("app")
  const items = (SITE_DATA && SITE_DATA[sectionName]) || []
  const displayName = sectionName === "project" ? "Projects" : capitalize(sectionName)

  let html = `<div class="section"><h2 class="section-title">${displayName}</h2>`

  if (items.length === 0) {
    html += '<div class="empty-state">No items yet</div>'
  } else {
    html += '<div class="items-list">'
    items.forEach((item) => {
      html += `
        <div class="item">
          <div class="item-header">
            <div class="item-title">${item.title} ${sectionName === "project" ? renderLabBadge(item) : ""}</div>
            ${item.date ? `<div class="item-date">${item.date}</div>` : ""}
          </div>
          ${item.description ? `<div class="item-description">${item.description}</div>` : ""}
          ${renderTags(item.tags)}
          ${renderItemActions(sectionName, item)}
        </div>
      `
    })
    html += "</div>"
  }

  html += "</div>"
  app.innerHTML = html
  updatePageTitle(sectionName)
}

function renderPostList() {
  const app = document.getElementById("app")

  // Collect unique categories from all posts
  const categories = ["all"]
  const seen = new Set()
  POSTS.forEach((post) => {
    const cat = post.category || "article"
    if (!seen.has(cat)) {
      seen.add(cat)
      categories.push(cat)
    }
  })

  // Filter posts by active category
  const filteredPosts = activePostCategory === "all"
    ? POSTS
    : POSTS.filter((p) => (p.category || "article") === activePostCategory)

  let html = '<div class="section"><h2 class="section-title">Posts</h2>'

  // Show filter tabs only when multiple categories exist
  if (categories.length > 2) {
    html += '<div class="post-filters">'
    categories.forEach((cat) => {
      const active = cat === activePostCategory ? " active" : ""
      const label = cat === "all" ? "All" : capitalize(cat) + "s"
      html += `<button class="filter-btn${active}" data-category="${cat}">${label}</button>`
    })
    html += "</div>"
  }

  if (filteredPosts.length === 0) {
    html += '<div class="empty-state">No posts yet</div>'
  } else {
    html += '<div class="items-list">'
    filteredPosts.forEach((post) => {
      const dateMarkup = post.date ? `<div class="item-date">${formatDisplayDate(post.date)}</div>` : ""
      html += `
        <div class="item post-excerpt">
          <div class="item-header">
            <div class="item-title">${post.title}</div>
            ${dateMarkup}
          </div>
          ${post.description ? `<div class="item-description">${post.description}</div>` : ""}
          ${renderTags(post.tags)}
          <div class="item-actions">
            <button class="btn" data-route="post/${post.slug}">Read More</button>
          </div>
        </div>
      `
    })
    html += "</div>"
  }

  html += "</div>"
  app.innerHTML = html
  updatePageTitle("post")
}

async function renderPostDetail(slug) {
  const app = document.getElementById("app")
  const post = POSTS.find((entry) => entry.slug === slug)

  if (!post) {
    renderNotFound("Post not found")
    return
  }

  app.innerHTML = `
    <div class="section post-detail">
      <div class="post-header">
        <h2 class="section-title">${post.title}</h2>
        <div class="post-meta">
          ${post.date ? `<span>${formatDisplayDate(post.date)}</span>` : ""}
          ${post.date && post.tags && post.tags.length ? " &middot; " : ""}
          ${post.tags && post.tags.length ? `<span>${post.tags.join(", ")}</span>` : ""}
        </div>
      </div>
      <article class="post-content">Loading...</article>
      <div class="post-actions">
        <button class="btn secondary" data-route="post">&larr; Back to posts</button>
      </div>
    </div>
  `

  updatePageTitle("post", post.title)

  const postContentElement = app.querySelector(".post-content")
  try {
    const content = await loadPostContent(post)
    postContentElement.innerHTML = content
  } catch (error) {
    postContentElement.innerHTML = '<p class="empty-state">Unable to load this post right now.</p>'
    console.error(error)
  }
}

function loadPostContent(post) {
  if (!post || !post.contentPath) {
    return Promise.reject(new Error("Post has no content path"))
  }

  if (postTemplateCache.has(post.slug)) {
    return Promise.resolve(postTemplateCache.get(post.slug))
  }

  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.setAttribute("aria-hidden", "true")
    iframe.src = post.contentPath

    const cleanup = () => iframe.remove()

    iframe.onload = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document
        const articleHtml = (doc && doc.body) ? doc.body.innerHTML.trim() : ""
        if (!articleHtml) throw new Error("Post template is empty")
        postTemplateCache.set(post.slug, articleHtml)
        cleanup()
        resolve(articleHtml)
      } catch (err) {
        cleanup()
        reject(err)
      }
    }

    iframe.onerror = () => {
      cleanup()
      reject(new Error(`Unable to load template: ${post.contentPath}`))
    }

    document.body.appendChild(iframe)
  })
}

function renderNotFound(message = "Page not found") {
  const app = document.getElementById("app")
  app.innerHTML = `<div class="empty-state">${message}</div>`
  updatePageTitle("", "Not Found")
}

/* ============================================
   HTML Checker — on-site interactive feature.
   Runs the exact same htmlcheck CLI the SSH/web playground offers, in the
   same hardened one-shot sandbox container, via terminal/internal/webbridge's
   POST /api/htmlcheck. No separate implementation to keep in sync.
   ============================================ */
let htmlCheckTerm = null
const HTMLCHECK_SAMPLE_VALID = `<html>\n  <head><title>Sample</title></head>\n  <body><p>Hello, world!</p></body>\n</html>`
const HTMLCHECK_SAMPLE_INVALID = `<html>\n  <head><body><p>Missing closing tags`

function htmlCheckAPIURL() {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1"
  return isLocal ? `http://${location.hostname}:8091/api/htmlcheck` : "https://term.egolab.top/api/htmlcheck"
}

function renderHtmlChecker() {
  const app = document.getElementById("app")
  app.innerHTML = `
    <div class="section">
      <h2 class="section-title">HTML Checker</h2>
      <p class="htmlcheck-intro">
        Validates HTML syntax with a Pushdown Automaton derived from a context-free grammar
        (a Theory of Computation project). Paste HTML below — this runs the actual CLI tool,
        in the same hardened, ephemeral, no-egress sandbox the SSH/web playground uses.
      </p>
      <textarea id="htmlcheck-input" class="htmlcheck-input" spellcheck="false"
        placeholder="<html>...</html>">${HTMLCHECK_SAMPLE_VALID}</textarea>
      <div class="htmlcheck-actions">
        <button id="htmlcheck-run" class="btn">Check</button>
        <button id="htmlcheck-sample-valid" class="btn secondary" type="button">Valid sample</button>
        <button id="htmlcheck-sample-invalid" class="btn secondary" type="button">Invalid sample</button>
      </div>
      <div class="home-terminal htmlcheck-terminal">
        <div class="terminal-chrome">
          <div class="terminal-chrome-dots"><span></span><span></span><span></span></div>
          <div class="terminal-chrome-title">htmlcheck</div>
        </div>
        <div id="htmlcheck-output"></div>
      </div>
    </div>
  `
  updatePageTitle("html-checker", "HTML Checker")
  initHtmlChecker()
}

function initHtmlChecker() {
  const el = document.getElementById("htmlcheck-output")
  if (!el || typeof Terminal === "undefined") return
  if (htmlCheckTerm) {
    htmlCheckTerm.dispose()
  }
  const term = new Terminal({
    convertEol: true,
    disableStdin: true,
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    theme: { background: "#0d1117", foreground: "#c9d1d9" },
  })
  term.open(el)
  term.write("paste some HTML and hit Check\r\n")
  htmlCheckTerm = term

  const input = document.getElementById("htmlcheck-input")
  const runBtn = document.getElementById("htmlcheck-run")

  const run = async () => {
    const html = input.value.trim()
    if (!html) return
    runBtn.disabled = true
    runBtn.textContent = "Checking…"
    term.reset()
    term.write("running…\r\n")
    try {
      const res = await fetch(htmlCheckAPIURL(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      })
      const data = await res.json()
      term.reset()
      if (data.error) {
        term.write(`error: ${data.error}\r\n`)
      } else {
        term.write(data.output.replace(/\n/g, "\r\n"))
      }
    } catch (err) {
      term.reset()
      term.write("error: could not reach the checker — try again shortly\r\n")
    } finally {
      runBtn.disabled = false
      runBtn.textContent = "Check"
    }
  }

  runBtn.addEventListener("click", run)
  document.getElementById("htmlcheck-sample-valid").addEventListener("click", () => {
    input.value = HTMLCHECK_SAMPLE_VALID
  })
  document.getElementById("htmlcheck-sample-invalid").addEventListener("click", () => {
    input.value = HTMLCHECK_SAMPLE_INVALID
  })
}

/* ============================================
   CTF Renderers
   ============================================ */
function renderCtfList() {
  const app = document.getElementById("app")
  const events = window.CTF_DATA || []

  if (events.length === 0) {
    app.innerHTML = '<div class="section"><h2 class="section-title">CTF Writeups</h2><div class="empty-state">No writeups yet</div></div>'
    updatePageTitle("ctf", "CTF Writeups")
    return
  }

  // Group events by year
  const byYear = {}
  events.forEach((event) => {
    const year = event.date ? new Date(event.date).getFullYear() : "Other"
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(event)
  })

  // Sort years descending
  const sortedYears = Object.keys(byYear).sort((a, b) => b - a)

  let html = '<div class="section"><h2 class="section-title">CTF Writeups</h2>'

  sortedYears.forEach((year) => {
    html += '<div class="ctf-year-group">'
    html += `<div class="ctf-year">${year}</div>`

    // Sort events within year by date descending
    const yearEvents = byYear[year].sort((a, b) => new Date(b.date) - new Date(a.date))

    yearEvents.forEach((event) => {
      const dateStr = event.date ? formatDisplayDate(event.date) : ""
      const eventName = event.url
        ? `<a href="${event.url}" target="_blank" rel="noopener noreferrer" class="ctf-event-link">${event.event}</a>`
        : `<span>${event.event}</span>`

      html += '<div class="ctf-event">'
      html += '<div class="ctf-event-header">'
      html += `<div class="ctf-event-name">${eventName}</div>`
      html += `<div class="item-date">${dateStr}</div>`
      html += "</div>"

      if (event.writeups && event.writeups.length) {
        html += '<div class="ctf-challenges">'
        event.writeups.forEach((wu, i) => {
          const isLast = i === event.writeups.length - 1
          const branch = isLast ? "└─" : "├─"
          html += `<div class="ctf-challenge" data-route="ctf/${wu.slug}">`
          html += `<span class="ctf-branch">${branch}</span>`
          html += `<span class="ctf-challenge-title">${wu.title}</span>`
          if (wu.category) {
            html += `<span class="tag">${wu.category}</span>`
          }
          html += "</div>"
        })
        html += "</div>"
      }

      html += "</div>"
    })

    html += "</div>"
  })

  html += "</div>"
  app.innerHTML = html
  updatePageTitle("ctf", "CTF Writeups")
}

function findCtfWriteup(slug) {
  const events = window.CTF_DATA || []
  for (const event of events) {
    if (!event.writeups) continue
    const wu = event.writeups.find((w) => w.slug === slug)
    if (wu) return { ...wu, event: event.event, eventDate: event.date }
  }
  return null
}

async function renderCtfDetail(slug) {
  const app = document.getElementById("app")
  const writeup = findCtfWriteup(slug)

  if (!writeup) {
    renderNotFound("Writeup not found")
    return
  }

  app.innerHTML = `
    <div class="section post-detail">
      <div class="post-header">
        <h2 class="section-title">${writeup.title}</h2>
        <div class="post-meta">
          <span>${writeup.event}</span>
          ${writeup.category ? " &middot; <span>" + writeup.category + "</span>" : ""}
        </div>
      </div>
      <article class="post-content">Loading...</article>
      <div class="post-actions">
        <button class="btn secondary" data-route="ctf">&larr; Back to writeups</button>
      </div>
    </div>
  `

  updatePageTitle("ctf", writeup.title)

  const postContentElement = app.querySelector(".post-content")
  try {
    const content = await loadPostContent(writeup)
    postContentElement.innerHTML = content
  } catch (error) {
    postContentElement.innerHTML = '<p class="empty-state">Unable to load this writeup.</p>'
    console.error(error)
  }
}

/* ============================================
   Shared Components
   ============================================ */
function renderTags(tags = []) {
  if (!tags || tags.length === 0) return ""
  return `
    <div class="item-tags">
      ${tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
    </div>
  `
}

function renderContactLinks() {
  const contacts = (window.CONTACTS || window.CONTACT_LINKS || []).filter((c) => c && c.url)
  if (contacts.length === 0) return ""

  const linksMarkup = contacts
    .map((contact) => {
      const target = contact.url.startsWith("mailto:") ? "_self" : "_blank"
      const relAttr = target === "_blank" ? ' rel="noopener noreferrer"' : ""
      const label = contact.label || contact.id || "Contact"
      const iconMarkup = contact.iconPath
        ? `<img src="${contact.iconPath}" alt="" aria-hidden="true" />`
        : `<span class="contact-icon" aria-hidden="true">${(contact.label || "?").charAt(0)}</span>`
      return `
        <a class="contact-link" href="${contact.url}" target="${target}"${relAttr} aria-label="${label}">
          ${iconMarkup}
          <span class="sr-only">${label}</span>
        </a>
      `
    })
    .join("")

  return `
    <div class="contact-links">
      <div class="contact-title">Connect</div>
      <div class="contact-list">${linksMarkup}</div>
    </div>
  `
}

function renderItemActions(sectionName, item = {}) {
  if (sectionName !== "project") return ""
  const viewBtn = item.link
    ? `<a class="btn" href="${item.link}" target="_blank" rel="noopener noreferrer">View Project</a>`
    : ""
  const labAction = renderLabAction(item)
  if (!viewBtn && !labAction) return ""
  return `
    <div class="item-actions">
      ${viewBtn}
      ${labAction}
    </div>
  `
}

/* ============================================
   Router
   ============================================ */
async function renderPage() {
  const rawHash = window.location.hash.startsWith("#/") ? window.location.hash.slice(2) : ""
  const segments = rawHash.split("/").filter(Boolean)
  const section = segments[0] || ""
  const slug = segments[1]

  setActiveNav(section)

  if (!section) {
    renderHome()
    return
  }
  disposeHeroTerminal()
  if (section !== "html-checker" && htmlCheckTerm) {
    htmlCheckTerm.dispose()
    htmlCheckTerm = null
  }

  if (ROUTABLE_SECTIONS.has(section)) {
    renderSection(section)
    return
  }

  if (section === "post") {
    if (slug) {
      await renderPostDetail(slug)
    } else {
      renderPostList()
    }
    return
  }

  if (section === "ctf") {
    if (slug) {
      await renderCtfDetail(slug)
    } else {
      renderCtfList()
    }
    return
  }

  if (section === "html-checker") {
    renderHtmlChecker()
    return
  }

  renderNotFound()
}

/* ============================================
   Event Listeners
   ============================================ */
document.addEventListener("click", (event) => {
  // Post category filter
  const categoryBtn = event.target.closest("[data-category]")
  if (categoryBtn) {
    event.preventDefault()
    activePostCategory = categoryBtn.dataset.category
    renderPostList()
    return
  }

  // Route navigation
  const routeTarget = event.target.closest("[data-route]")
  if (routeTarget) {
    event.preventDefault()
    const route = routeTarget.getAttribute("data-route")
    if (route !== null) {
      navigateTo(route)
    }
  }
})

window.addEventListener("hashchange", () => {
  // Reset post filter when navigating away from posts
  const section = window.location.hash.startsWith("#/") ? window.location.hash.slice(2).split("/")[0] : ""
  if (section !== "post") {
    activePostCategory = "all"
  }
  renderPage()
  window.scrollTo({ top: 0, behavior: "smooth" })
})

document.addEventListener("DOMContentLoaded", async () => {
  initTheme()
  initMobileMenu()
  initCommandPalette()
  if (!window.location.hash) {
    window.location.hash = "#/"
  }
  await loadLabRegistry()
  renderPage()
  pollLabStatus()
  setInterval(pollLabStatus, 15000)
})

/* ============================================
   Lab registry — the interactive projects behind
   egolab.top's SSH/web terminal (see terminal/).
   Merged into the existing project list rather than
   replacing it, so hand-written portfolio entries in
   content/projects.js are kept as-is.
   ============================================ */
const LAB_STATUS_ORIGIN = "https://term.egolab.top"
let labStatusBySlug = {}

async function loadLabRegistry() {
  try {
    const res = await fetch("content/registry.json", { cache: "no-store" })
    if (!res.ok) return
    const data = await res.json()
    const projects = Array.isArray(data.projects) ? data.projects : []
    const labItems = projects.map((p) => ({
      title: p.title,
      date: p.date,
      description: p.description,
      tags: p.tags || [],
      link: p.repo,
      slug: p.slug,
      web: p.web,
      lab: p.lab,
      site: p.site,
    }))
    window.PROJECT_ITEMS = labItems.concat(window.PROJECT_ITEMS || [])
    if (window.SITE_DATA) window.SITE_DATA.project = window.PROJECT_ITEMS
  } catch (err) {
    console.warn("lab registry unavailable, showing static project list only", err)
  }
}

async function pollLabStatus() {
  try {
    const res = await fetch(`${LAB_STATUS_ORIGIN}/api/status`, { cache: "no-store" })
    if (!res.ok) return
    const entries = await res.json()
    labStatusBySlug = Object.fromEntries((entries || []).map((e) => [e.slug, e.live]))
  } catch (err) {
    return // term.egolab.top unreachable — badges just stay hidden
  }
  const section = window.location.hash.startsWith("#/") ? window.location.hash.slice(2).split("/")[0] : ""
  if (section === "project") renderSection("project")
}

function renderLabBadge(item) {
  if (!item.web) return ""
  const live = labStatusBySlug[item.slug]
  if (live === undefined) return ""
  return live
    ? `<span class="lab-badge lab-badge-live">● live</span>`
    : `<span class="lab-badge lab-badge-down">● down</span>`
}

/* ============================================
   Command palette (Ctrl+K / Cmd+K)
   ============================================ */
function cmdkCommands() {
  return [
    { label: "Home", hint: "go", action: () => navigateTo("") },
    { label: "Experience", hint: "go", action: () => navigateTo("experience") },
    { label: "Projects", hint: "go", action: () => navigateTo("project") },
    { label: "Posts", hint: "go", action: () => navigateTo("post") },
    { label: "CTF Writeups", hint: "go", action: () => navigateTo("ctf") },
    { label: "Education", hint: "go", action: () => navigateTo("education") },
    { label: "Download CV", hint: "open", action: () => window.open("assets/cv/Indraswara-CV.pdf", "_blank") },
    { label: "SSH into the lab", hint: "copy", action: () => cmdkCopy("ssh -o ProxyCommand=\"cloudflared access tcp --hostname ssh.egolab.top\" guest@ssh.egolab.top") },
    { label: "Toggle dark mode", hint: "do", action: () => document.querySelector(".theme-toggle")?.click() },
    { label: "GitHub", hint: "open", action: () => window.open("https://github.com/indraswara", "_blank") },
  ]
}

function cmdkCopy(text) {
  navigator.clipboard?.writeText(text).catch(() => {})
}

let cmdkSelected = 0
let cmdkFiltered = []

function cmdkOpen() {
  const overlay = document.getElementById("cmdk-overlay")
  const input = document.getElementById("cmdk-input")
  if (!overlay || !input) return
  overlay.hidden = false
  input.value = ""
  cmdkSelected = 0
  cmdkRender("")
  input.focus()
}

function cmdkClose() {
  const overlay = document.getElementById("cmdk-overlay")
  if (overlay) overlay.hidden = true
}

function cmdkRender(query) {
  const list = document.getElementById("cmdk-list")
  if (!list) return
  const q = query.trim().toLowerCase()
  cmdkFiltered = cmdkCommands().filter((c) => c.label.toLowerCase().includes(q))
  cmdkSelected = Math.min(cmdkSelected, Math.max(cmdkFiltered.length - 1, 0))
  list.innerHTML = cmdkFiltered
    .map((c, i) => `<li class="cmdk-item${i === cmdkSelected ? " active" : ""}" data-index="${i}"><span>${c.label}</span><span class="cmdk-hint">${c.hint}</span></li>`)
    .join("")
}

function initCommandPalette() {
  const overlay = document.getElementById("cmdk-overlay")
  const input = document.getElementById("cmdk-input")
  const list = document.getElementById("cmdk-list")
  if (!overlay || !input || !list) return

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      overlay.hidden ? cmdkOpen() : cmdkClose()
      return
    }
    if (overlay.hidden) return
    if (e.key === "Escape") {
      cmdkClose()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      cmdkSelected = Math.min(cmdkSelected + 1, cmdkFiltered.length - 1)
      cmdkRender(input.value)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      cmdkSelected = Math.max(cmdkSelected - 1, 0)
      cmdkRender(input.value)
    } else if (e.key === "Enter") {
      e.preventDefault()
      const cmd = cmdkFiltered[cmdkSelected]
      if (cmd) {
        cmdkClose()
        cmd.action()
      }
    }
  })

  input.addEventListener("input", () => cmdkRender(input.value))
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cmdkClose()
  })
  list.addEventListener("click", (e) => {
    const item = e.target.closest(".cmdk-item")
    if (!item) return
    const cmd = cmdkFiltered[Number(item.dataset.index)]
    if (cmd) {
      cmdkClose()
      cmd.action()
    }
  })
}

/* ============================================
   Hero terminal — a live xterm.js session wired to
   the same wish/bubbletea backend real SSH clients get
   (see terminal/internal/webbridge). One session per
   page view; torn down when navigating away from home.
   ============================================ */
let heroTerm = null
let heroWs = null
let heroFit = null
let heroResizeHandler = null

function heroWsURL(cols, rows) {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1"
  const base = isLocal ? `ws://${location.hostname}:8091/ws` : "wss://term.egolab.top/ws"
  return `${base}?cols=${cols}&rows=${rows}`
}

function disposeHeroTerminal() {
  if (heroResizeHandler) {
    window.removeEventListener("resize", heroResizeHandler)
    heroResizeHandler = null
  }
  if (heroWs) {
    heroWs.onclose = null
    heroWs.close()
    heroWs = null
  }
  if (heroTerm) {
    heroTerm.dispose()
    heroTerm = null
  }
  heroFit = null
}

function initHeroTerminal() {
  disposeHeroTerminal()
  const el = document.getElementById("hero-terminal")
  if (!el || typeof Terminal === "undefined") return

  const term = new Terminal({
    convertEol: true,
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    theme: { background: "#0d1117", foreground: "#c9d1d9", cursor: "#3fb950" },
  })
  const fit = new FitAddon.FitAddon()
  term.loadAddon(fit)
  term.open(el)
  fit.fit()
  heroTerm = term
  heroFit = fit

  let ws
  try {
    // The terminal is already fitted to its final size at this point, so
    // its size rides along in the connect URL — the server's very first
    // frame renders at the right size instead of a fallback that gets
    // resized (and re-rendered) moments later.
    ws = new WebSocket(heroWsURL(term.cols, term.rows))
  } catch (err) {
    term.write("\r\nlab terminal unavailable\r\n")
    return
  }
  ws.binaryType = "arraybuffer"
  heroWs = ws
  ws.onmessage = (event) => {
    const data = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data
    term.write(data)
  }
  ws.onclose = () => {
    term.write("\r\n\r\n[connection closed]\r\n")
  }
  ws.onerror = () => {
    term.write("\r\nlab terminal unavailable — try again shortly\r\n")
  }

  term.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data)
  })

  heroResizeHandler = () => {
    const prevCols = term.cols
    const prevRows = term.rows
    fit.fit()
    if ((term.cols !== prevCols || term.rows !== prevRows) && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }))
      term.clear() // avoid a stray leftover line from the pre-resize frame
    }
  }
  window.addEventListener("resize", heroResizeHandler)
}

function renderLabAction(item) {
  const parts = []
  if (item.web) {
    parts.push(`<a class="btn secondary" href="https://${item.web.subdomain}.egolab.top" target="_blank" rel="noopener noreferrer">Try it live &rarr;</a>`)
  }
  if (item.site) {
    parts.push(`<a class="btn secondary" data-route="${item.site}">Try it on this page &rarr;</a>`)
  }
  if (item.lab) {
    parts.push(`<span class="lab-hint">run <code>${item.lab.cmd}</code> in the <a href="https://egolab.top" target="_blank" rel="noopener noreferrer">playground</a></span>`)
  }
  return parts.join(" ")
}
