// ============================================
// CTF Writeups
// ============================================
// Grouped by CTF event. Events are auto-grouped by year in the UI.
//
// To add a new CTF writeup:
//   1. Create an HTML file in ctf/ (copy ctf/ctf-writeup-template.html)
//   2. Add or find the event entry below
//   3. Add a writeup to the event's writeups array
//
// Event schema:
//   {
//     event: "CTF Event Name",                 // Name of the CTF competition
//     date: "YYYY-MM-DD",                      // Date of the event (used for year grouping)
//     url: "https://ctftime.org/event/...",     // Optional link to CTF event page
//     writeups: [
//       {
//         slug: "event-challenge-name",                   // URL-friendly identifier
//         title: "Challenge Name",                        // Display title
//         category: "Web",                                // Web / Pwn / Crypto / Rev / Forensics / Misc
//         contentPath: "ctf/event-challenge-name.html"    // Path to HTML writeup
//       }
//     ]
//   }
// ============================================

window.CTF_ENTRIES = [
  {
    event: "Example CTF 2025",
    date: "2025-06-15",
    url: "https://ctftime.org/event/...",
    writeups: [
      {
        slug: "example-ctf-web-challenge",
        title: "Web Challenge Name",
        category: "Web",
        contentPath: "ctf/example-ctf-web-challenge.html",
      },
    ],
  },
]
