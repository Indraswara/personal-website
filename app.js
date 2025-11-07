const ROUTABLE_SECTIONS = new Set(["experience", "project", "education"])
const postTemplateCache = new Map()

function navigateTo(route = "") {
  window.location.hash = `#/${route}`
}

function capitalize(str) {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDisplayDate(dateString) {
  if (!dateString) {
    return ""
  }
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) {
    return dateString
  }
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function setActiveNav(route) {
  const normalizedRoute = route || ""
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href").slice(2)
    if (href === normalizedRoute || (!normalizedRoute && href === "")) {
      link.classList.add("active")
    } else if (normalizedRoute === "post" && href === "post") {
      link.classList.add("active")
    } else {
      link.classList.remove("active")
    }
  })
}

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
        ${contactMarkup}
      </div>
    </div>
  `
}

function renderSection(sectionName) {
  const app = document.getElementById("app")
  const items = (SITE_DATA && SITE_DATA[sectionName]) || []

  let html = `<div class="section"><h2 class="section-title">${capitalize(sectionName)}</h2>`

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
}

function renderPostList() {
  const app = document.getElementById("app")
  let html = '<div class="section"><h2 class="section-title">Posts</h2>'

  if (!POSTS || POSTS.length === 0) {
    html += '<div class="empty-state">No posts yet</div>'
  } else {
    html += '<div class="items-list">'
    POSTS.forEach((post) => {
      const dateMarkup = post.date ? `<div class="item-date">${formatDisplayDate(post.date)}</div>` : ""
      html += `
        <div class="item post-excerpt">
          <div class="item-header">
            <div class="item-title">${post.title}</div>
            ${dateMarkup}
          </div>
          ${post.description ? `<div class="item-description">${post.description}</div>` : ""}
          ${renderTags(post.tags)}
          <div>
            <button class="btn" data-route="post/${post.slug}">Read Post</button>
          </div>
        </div>
      `
    })
    html += "</div>"
  }

  html += "</div>"
  app.innerHTML = html
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
          ${post.date && post.tags && post.tags.length ? "<span>•</span>" : ""}
          ${post.tags && post.tags.length ? `<span>${post.tags.join(", ")}</span>` : ""}
        </div>
      </div>
      <article class="post-content">Loading post...</article>
      <div class="post-actions">
        <button class="btn secondary" data-route="post">← Back to posts</button>
      </div>
    </div>
  `

  const postContentElement = app.querySelector(".post-content")

  try {
    const content = await loadPostContent(post)
    postContentElement.innerHTML = content
  } catch (error) {
    postContentElement.innerHTML = '<p class="empty-state">Unable to load this post right now. Please try again later.</p>'
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

    const cleanup = () => {
      iframe.remove()
    }

    iframe.onload = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document
        const articleHtml = (doc && doc.body) ? doc.body.innerHTML.trim() : ""
        if (!articleHtml) {
          throw new Error("Post template is empty")
        }
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
}

function renderTags(tags = []) {
  if (!tags || tags.length === 0) {
    return ""
  }
  return `
    <div class="item-tags">
      ${tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
    </div>
  `
}

function renderContactLinks() {
  const contacts = ((window.CONTACTS || window.CONTACT_LINKS || [])).filter((contact) => contact && contact.url)
  if (contacts.length === 0) {
    return ""
  }

  const linksMarkup = contacts
    .map((contact) => {
      const target = contact.url.startsWith("mailto:") ? "_self" : "_blank"
      const relAttr = target === "_blank" ? ' rel="noopener noreferrer"' : ""
      const label = contact.label || contact.id || "Contact"
      const iconText = contact.icon || (contact.label ? contact.label.charAt(0) : "")
      const iconMarkup = contact.iconPath
        ? `<img src="${contact.iconPath}" alt="" aria-hidden="true" />`
        : `<span class="contact-icon" aria-hidden="true">${iconText}</span>`
      return `
        <a class="contact-link" href="${contact.url}" target="${target}"${relAttr} aria-label="${label}">
          ${iconMarkup}
          <span class="sr-only">${contact.label}</span>
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
  if (sectionName !== "project" || !item.link) {
    return ""
  }

  const safeLink = item.link
  return `
    <div class="item-actions">
      <a class="btn" href="${safeLink}" target="_blank" rel="noopener noreferrer">View Project</a>
    </div>
  `
}

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

  renderNotFound()
}

document.addEventListener("click", (event) => {
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
  renderPage()
})

document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hash) {
    window.location.hash = "#/"
  }
  renderPage()
})
