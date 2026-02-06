// ============================================
// Blog Posts
// ============================================
// To add a new blog post:
//   1. Create an HTML file in posts/ (copy post-template.html)
//   2. Add an entry below with a unique slug matching the filename
//
// For CTF writeups, use content/ctf.js instead.
//
// Schema:
//   {
//     slug: "my-post-slug",                    // URL-friendly identifier (matches HTML filename)
//     title: "My Post Title",                  // Display title
//     date: "YYYY-MM-DD",                      // Publication date
//     description: "Short summary",            // Shown in post list
//     tags: ["Tag1", "Tag2"],                  // Topic tags
//     category: "article",                     // Optional category for filtering
//     contentPath: "posts/my-post-slug.html"   // Path to the HTML content file
//   }
// ============================================

window.POST_ENTRIES = [
  {
    slug: "getting-started-with-docker",
    title: "Getting Started with Docker",
    date: "2025-11-07",
    description: "A beginner's guide to containerizing your applications with Docker.",
    tags: ["Docker", "DevOps", "Tutorial"],
    category: "article",
    contentPath: "posts/getting-started-with-docker.html",
  },
]
