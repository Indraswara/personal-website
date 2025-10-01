// IntersectionObserver animations
const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) if (entry.isIntersecting) entry.target.classList.add("animated")
}, observerOptions)
document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el))

// Smooth scrolling for anchors
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const target = document.querySelector(anchor.getAttribute("href"))
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: "smooth", block: "start" })
    // close mobile menu after navigating
    if (window.innerWidth <= 768) {
      primaryNav.dataset.open = "false"
      menuToggle.setAttribute("aria-expanded", "false")
    }
  })
})

// Scroll progress bar + nav background + active section
const progressEl = document.getElementById("progress")
const nav = document.querySelector("nav")
const sections = [...document.querySelectorAll("section[id]")]
const navLinks = [...document.querySelectorAll("nav a")]
const sectionById = Object.fromEntries(sections.map((s) => [s.id, s]))

function setActiveLink(activeId) {
  navLinks.forEach((a) => {
    const isActive = a.getAttribute("href") === `#${activeId}`
    a.classList.toggle("active", isActive)
  })
}

window.addEventListener("scroll", () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
  progressEl.style.width = `${progress}%`

  // sticky nav background intensity
  nav.style.background = scrollTop > 100 ? "rgba(10, 10, 10, 0.95)" : "rgba(10, 10, 10, 0.75)"

  // compute active section
  const offset = 96
  let currentId = "hero"
  for (const s of sections) {
    const rect = s.getBoundingClientRect()
    if (rect.top <= offset && rect.bottom >= offset) {
      currentId = s.id
      break
    }
  }
  setActiveLink(currentId)
})

// Theme toggle with localStorage
const root = document.documentElement
const themeToggle = document.getElementById("theme-toggle")
const THEME_KEY = "portfolio-theme"
function applyTheme(theme) {
  if (theme === "light") root.setAttribute("data-theme", "light")
  else root.removeAttribute("data-theme")
}
applyTheme(localStorage.getItem(THEME_KEY))
themeToggle?.addEventListener("click", () => {
  const isLight = root.getAttribute("data-theme") === "light"
  const next = isLight ? "dark" : "light"
  applyTheme(next)
  localStorage.setItem(THEME_KEY, next)
})

// Mobile menu toggle
const menuToggle = document.getElementById("menu-toggle")
const primaryNav = document.getElementById("primary-nav")
menuToggle?.addEventListener("click", () => {
  const opened = primaryNav.dataset.open === "true"
  primaryNav.dataset.open = opened ? "false" : "true"
  menuToggle.setAttribute("aria-expanded", (!opened).toString())
})

// Projects search/filter
const searchInput = document.getElementById("project-search")
const projectCards = [...document.querySelectorAll(".project-card")]
function normalize(s) {
  return (s || "").toLowerCase()
}
searchInput?.addEventListener("input", () => {
  const q = normalize(searchInput.value)
  projectCards.forEach((card) => {
    const text = normalize(card.textContent)
    card.style.display = text.includes(q) ? "" : "none"
  })
})
// Keyboard shortcut "/" to focus search
window.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== searchInput) {
    e.preventDefault()
    searchInput?.focus()
  }
})

// Modal for quick project details
const modal = document.getElementById("project-modal")
const modalTitle = document.getElementById("modal-title")
const modalDesc = document.getElementById("modal-desc")
const modalClose = document.getElementById("modal-close")

function openModal(title, desc) {
  modalTitle.textContent = title
  modalDesc.textContent = desc
  modal.setAttribute("open", "true")
  modal.setAttribute("aria-hidden", "false")
}
function closeModal() {
  modal.removeAttribute("open")
  modal.setAttribute("aria-hidden", "true")
}

document.querySelectorAll(".details-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    openModal(btn.dataset.title || "Project", btn.dataset.desc || "")
  })
})
modalClose?.addEventListener("click", closeModal)
modal?.addEventListener("click", (e) => {
  const closeTarget = e.target
  if (closeTarget instanceof HTMLElement && closeTarget.dataset.close === "true") closeModal()
})
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal()
})

// Extra keyboard shortcuts: g h (home), g p (projects)
let gPressed = false
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "g") {
    gPressed = true
    return
  }
  if (!gPressed) return
  if (e.key.toLowerCase() === "h") {
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })
  } else if (e.key.toLowerCase() === "p") {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
  }
  gPressed = false
})
window.addEventListener("keyup", (e) => {
  if (e.key.toLowerCase() === "g") gPressed = false
})
