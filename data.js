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
  window.CONTACTS = window.CONTACT_LINKS
})()
