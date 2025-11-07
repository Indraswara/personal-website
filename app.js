// Data declaration
const DATA = {
  experience: [
    { title: "Job 1", date: "2018-2020", description: "Description of job 1", tags: ["tag1", "tag2"] },
    { title: "Job 2", date: "2020-2022", description: "Description of job 2", tags: ["tag3"] },
  ],
  project: [
    { title: "Project 1", date: "2019", description: "Description of project 1", tags: ["tag1"] },
    { title: "Project 2", date: "2021", description: "Description of project 2", tags: ["tag2", "tag3"] },
  ],
  post: [
    { title: "Post 1", date: "2020", description: "Description of post 1", tags: ["tag1"] },
    { title: "Post 2", date: "2022", description: "Description of post 2", tags: ["tag2"] },
  ],
  education: [
    { title: "Education 1", date: "2015-2018", description: "Description of education 1", tags: ["tag1"] },
    { title: "Education 2", date: "2018-2020", description: "Description of education 2", tags: ["tag2", "tag3"] },
  ],
}

// Router handler
function navigateTo(page) {
  window.location.hash = `#/${page}`
}

// Page renderer
function renderPage() {
  const hash = window.location.hash.slice(2) || ""
  const app = document.getElementById("app")

  // Update active nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active")
    const href = link.getAttribute("href").slice(2)
    if (href === hash) {
      link.classList.add("active")
    }
  })

  // Render content based on route
  if (hash === "" || hash === "/") {
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

// Render section with items
function renderSection(sectionName) {
  const app = document.getElementById("app")
  const items = DATA[sectionName] || []

  let html = `<h2 class="section-title">${capitalize(sectionName)}</h2>`

  if (items.length === 0) {
    html += '<div class="empty-state">No items yet</div>'
  } else {
    html += '<div class="items-list">'
    items.forEach((item) => {
      html += `
                <div class="item">
                    <div class="item-title">${item.title}</div>
                    ${item.date ? `<div class="item-meta">${item.date}</div>` : ""}
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

  app.innerHTML = html
}

// Utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Initialize router
window.addEventListener("hashchange", renderPage)
document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hash) {
    window.location.hash = "#/"
  }
  renderPage()
})
