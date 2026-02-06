// ============================================
// Data Aggregator
// ============================================
// This file collects all content from the content/ folder into
// global objects used by app.js.
//
// To add a new section (e.g., certifications):
//   1. Create content/certifications.js with: window.CERTIFICATION_ITEMS = [...]
//   2. Add <script src="content/certifications.js"></script> in index.html (before data.js)
//   3. Register it in SITE_DATA below: certification: ensureArray(window.CERTIFICATION_ITEMS)
//   4. Add "certification" to ROUTABLE_SECTIONS in app.js
//   5. Add a <li><a href="#/certification" class="nav-link">Certifications</a></li> in index.html nav
//
// Item schema (for generic sections):
//   { title, date, description, tags: [], link (optional) }
//
// Post schema:
//   { slug, title, date, description, tags: [], category, contentPath }
//
// CTF schema (see content/ctf.js for full docs):
//   { event, date, url, writeups: [{ slug, title, category, contentPath }] }
// ============================================

;(function () {
  function ensureArray(value) {
    return Array.isArray(value) ? value : []
  }

  window.HOME_CONTENT = window.HOME_CONTENT || { intro: [] }
  window.CONTACT_LINKS = ensureArray(window.CONTACT_LINKS)

  window.SITE_DATA = {
    experience: ensureArray(window.EXPERIENCE_ITEMS),
    project: ensureArray(window.PROJECT_ITEMS),
    education: ensureArray(window.EDUCATION_ITEMS),
  }

  window.POSTS = ensureArray(window.POST_ENTRIES)
  window.CTF_DATA = ensureArray(window.CTF_ENTRIES)
  window.CONTACTS = window.CONTACT_LINKS
})()
