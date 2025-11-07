// Data declaration
const DATA = {
  experience: [
    {
      title: "Senior Developer",
      date: "2022 - Present",
      description: "Building scalable web applications and leading development teams.",
      tags: ["JavaScript", "React", "Node.js"],
    },
    {
      title: "Full Stack Developer",
      date: "2020 - 2022",
      description: "Developed web applications using modern tech stack.",
      tags: ["JavaScript", "Python", "PostgreSQL"],
    },
  ],
  project: [
    {
      title: "Personal Website",
      date: "2024",
      description: "A simple, plain text personal website with easy content management.",
      tags: ["HTML", "CSS", "JavaScript", "Docker"],
    },
    {
      title: "Open Source Contribution",
      date: "2023",
      description: "Contributed to various open source projects.",
      tags: ["GitHub", "JavaScript"],
    },
  ],
  post: [
    {
      title: "Getting Started with Docker",
      date: "2024-01-15",
      description: "A beginner's guide to containerizing your applications with Docker.",
      tags: ["Docker", "DevOps", "Tutorial"],
    },
    {
      title: "Understanding REST APIs",
      date: "2024-01-10",
      description: "Learn the fundamentals of REST API design and best practices.",
      tags: ["API", "Backend", "Education"],
    },
  ],
  education: [
    {
      title: "Bachelor of Computer Science",
      date: "2016 - 2020",
      description: "Graduated from XYZ University with focus on software engineering.",
      tags: ["Computer Science", "University"],
    },
    {
      title: "Web Development Bootcamp",
      date: "2016",
      description: "Intensive bootcamp focusing on full-stack web development.",
      tags: ["Bootcamp", "Web Development"],
    },
  ],
}

// Router handler
function navigateTo(page) {
  window.location.hash = `#/${page}`
}

// Utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Render section with items
function renderSection(sectionName) {
  const app = document.getElementById("app")
  const items = DATA[sectionName] || []

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
          ${
            item.tags && item.tags.length > 0
              ? `
              <div class="item-tags">
                ${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
              </div>
            `
              : ""
          }
        </div>
      `
    })
    html += "</div>"
  }

  html += "</div>"
  app.innerHTML = html
}

// Page renderer
function renderPage() {
  const hash = window.location.hash.slice(2) || ""
  console.log("[v0] Current hash:", hash)
  const app = document.getElementById("app")

  // Update active nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active")
    const href = link.getAttribute("href").slice(2)
    if (href === hash) {
      link.classList.add("active")
    }
  })

  if (hash === "" || hash === "") {
    app.innerHTML = `
      <div class="home">
        <div class="home-text">
          <p>Hello, you just came to my personal website, My name is Indraswara, you can call me indra</p>
        </div>
      </div>
    `
  } else if (hash === "experience") {
    renderSection("experience")
  } else if (hash === "project") {
    renderSection("project")
  } else if (hash === "post") {
    renderSection("post")
  } else if (hash === "education") {
    renderSection("education")
  } else {
    app.innerHTML = '<div class="empty-state">Page not found</div>'
  }
}

// Initialize router
window.addEventListener("hashchange", renderPage)
document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hash) {
    window.location.hash = "#/"
  }
  renderPage()
})
