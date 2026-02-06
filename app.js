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
          <a class="btn" href="https://cv.indraswara.me" target="_blank" rel="noopener noreferrer">
            &darr; Download CV
          </a>
        </div>
        ${contactMarkup}
      </div>
    </div>
  `
  updatePageTitle()
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
            <div class="item-title">${item.title}</div>
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
  if (sectionName !== "project" || !item.link) return ""
  return `
    <div class="item-actions">
      <a class="btn" href="${item.link}" target="_blank" rel="noopener noreferrer">View Project</a>
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

document.addEventListener("DOMContentLoaded", () => {
  initTheme()
  initMobileMenu()
  if (!window.location.hash) {
    window.location.hash = "#/"
  }
  renderPage()
})
