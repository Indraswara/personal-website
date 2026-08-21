# egolab.top

A personal website turned into an SSH-able interactive lab: browse the portfolio, drop into a real
(hardened, disposable) terminal from your browser or a real SSH client, poke around live project demos,
and grab the CV — all without an account.

## Accessing the lab

### The website

**https://egolab.top** — the portfolio itself, with a live terminal embedded right on the home page (runs
in your browser, no install needed). Press **Ctrl+K** anywhere on the site for a command palette (jump to
any section, copy the SSH command, toggle dark mode, …).

**https://egolab.top/#/html-checker** — paste HTML and validate it with a Pushdown Automaton, live, in a
mini terminal. Runs the real CLI tool in the same sandbox described below.

### Real SSH

No ports are open on the server — SSH goes out through a Cloudflare Tunnel instead. Install
[`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
once, then:

```bash
ssh -o ProxyCommand="cloudflared access tcp --hostname ssh.egolab.top" guest@ssh.egolab.top
```

Any username/password is accepted (it's an anonymous public demo). You'll land in a menu: About,
Experience, Education, Projects, Download CV, and **Enter playground**.

### Downloading the CV

From the SSH menu, or directly via `scp` (`-O` is required — modern OpenSSH defaults to SFTP, which this
lab doesn't speak):

```bash
scp -O -o ProxyCommand="cloudflared access tcp --hostname ssh.egolab.top" guest@ssh.egolab.top:cv.pdf .
```

Or just click "Download CV" on the website — it's a plain static file there.

### The playground (sandbox)

Selecting **Enter playground** (from SSH or the web terminal) drops you into an ephemeral, non-root,
no-internet-egress Docker container — auto-killed after ~10 minutes or 3 minutes idle, whichever comes
first. Nothing you do there persists. From inside:

| Command | What it is |
|---|---|
| `sepotipai` | Spotify-like playlist/queue manager (C). Type `START`, then `LIST` / `PLAY` / `QUEUE` / `HELP`. |
| `burbir` | Twitter-like social app (C, hand-rolled ADTs). Every input needs a trailing `;` — just `;` to load, then `DAFTAR;` to register, `KICAU;` to post. |
| `htmlcheck <file>` | Same HTML validator as the on-site checker. Run with no args to see sample files. |
| `citra edge <img> <op>` | Edge detection (`sobel`\|`prewitt`\|`roberts`\|`laplace`\|`log`) on sample images. |
| `ngr` | Farming-sim CLI game (C++20). At the state prompt, type `1` for a fresh game or `2` then `example/state.txt` to load the seeded save. |
| `labs` | Show this menu again |
| `ls /srv/projects` | Browse the read-only source of every project |
| `cat ~/README` | Quick reference, same as this table |
| `exit` | Leave the playground, back to the SSH menu |

### The OS (QEMU)

Selecting **Launch OS** from the top-level menu boots
[`os-2024-lostonesweeping`](https://github.com/Indraswara/os-2024-lostonesweeping) — a real bare-metal
x86 OS (bootloader, kernel, FAT32 filesystem, userspace shell) — for real, under `qemu-system-i386`
(software emulation, no `/dev/kvm`), in its own ephemeral container with the same hardening as the
playground plus a tighter concurrency cap (QEMU holds a full CPU core even idling, unlike a plain shell).
Fresh disk every boot; nothing persists once you leave.

The OS itself has no exit command, so leaving means talking to QEMU directly: press **Alt+2** to switch to
the QEMU monitor, then type `quit` and Enter. You're dropped back at the SSH menu, same as playground `exit`.

### The web projects

Six full projects, each deployed live on its own subdomain (own container, own database where relevant):

| Subdomain | What it is | Login |
|---|---|---|
| **https://wbd.egolab.top** | Job board / LinkedIn-style hiring platform (PHP + PostgreSQL) | Register your own account, or just browse without one |
| **https://algeo.egolab.top** | Content-based image retrieval — upload an image, find visually similar ones (Node/TS + `canvas`) | None needed |
| **https://dinasti.egolab.top** | "WikiRace" solver — finds a link path between two Wikipedia articles via BFS or IDS (Go, scrapes Wikipedia live) | None needed |
| **https://linkedin.egolab.top** | LinkedIn-style clone with feed, chat (WebSocket), and push notifications (React + Node + PostgreSQL) | 30 seeded demo users, all with password `Aku123_` (any seeded username/email works as the login identifier), or register your own |
| **https://riilcert.egolab.top** | Blockchain certificate issuance/verification on a Sepolia smart contract — wallet-signed auth, SHA-256 hashing, AES encryption (Next.js + ethers.js) | Connect a browser wallet (MetaMask/Rabby) with Sepolia testnet ETH — no account needed |
| **https://sigmachat.egolab.top** | End-to-end encrypted chat — ECC P-256 signatures over WebSockets (React + Express + PostgreSQL) | Register your own account |

Each is also listed on the site's **Projects** page (`egolab.top/#/project`) with a live/down status badge
and a direct link.

### How it's wired (short version)

- **Terminal backend** (`terminal/`, Go): one `wish`/`bubbletea` SSH server is the single source of truth —
  the web terminal is literally an SSH *client* dialing that same server over loopback and bridging it to a
  WebSocket, so real SSH and the browser terminal can never drift apart in behavior.
- **Sandbox** (`sandbox/`): one Docker image with all the CLI labs baked in; every playground session and
  every one-off `htmlcheck` run spins up a fresh, hardened, disposable container from it
  (`--read-only`, dropped capabilities, no new privileges, memory/CPU/pids limits, non-root).
- **Web projects** (`labs/<slug>/`): each is the cloned upstream repo (`projects/<slug>/`, not checked in)
  with a small `overrides/` layer of fixes applied on top at build time, containerized as a static
  build + small API service pair, and reverse-proxied by `nginx`.
- **Cloudflare Tunnel**: a single tunnel (already running as a host service, not part of this repo's
  `docker compose`) routes every `*.egolab.top` hostname to the right local container by port — see
  `scripts/sync-cloudflared-ingress.sh`.
- **Project registry** (`content/registry.json`): the single source of truth for what projects exist, read
  by the website, the terminal's TUI, and deploy scripts alike. Adding a new project is meant to be one
  registry entry + one `labs/<slug>/` folder.

## Project Layout

```
├── index.html                  # Shell page that loads everything
├── app.js                      # Router + renderer
├── data.js                     # Glues together data from the content folder
├── style.css                   # Styles (including post + button rules)
├── content/
│   ├── home.js                 # Intro paragraphs for the home view
│   ├── experience.js           # Timeline items for Experience
│   ├── projects.js             # Project cards + links
│   ├── education.js            # Education timeline
│   ├── contact.js              # Social/icon links
│   └── posts.js                # Metadata for blog posts
├── assets/
│   └── icons/                  # SVG badges used by the contact row
└── posts/
    ├── images/                 # SVG/PNG assets referenced by posts
    ├── post-template.html      # Boilerplate for new posts
    └── *.html                  # One file per post (article markup only)
```

`index.html` loads every `content/*.js` file, then `data.js` converts those globals into `SITE_DATA`,
`POSTS`, and `HOME_CONTENT` objects that `app.js` uses when rendering.

## Running Locally

Open `index.html` straight in a browser for a quick preview. For a closer-to-prod setup, start any static
server inside the project directory (examples: `python3 -m http.server 4173`, `npx serve .`). When using the
Docker image, rebuild with `docker compose up --build` so the updated `content/` and `posts/` folders are
copied into Nginx.

## Editing The Home Section

1. Open `content/home.js`.
2. Update the `intro` array with one or more strings. Each string renders as a `<p>` in the hero area.
3. Save and refresh – no other wiring is required.

Example:
```js
window.HOME_CONTENT = {
  intro: [
    "Hello, you just came to my personal website. My name is Indraswara, you can call me Indra.",
    "I enjoy building lightweight tools and writing about the process.",
  ],
}
```

## Managing Contact Links

1. Open `content/contact.js`.
2. Each entry in `window.CONTACT_LINKS` represents one icon in the “Connect” row on the home page.

```js
{
  id: "github",
  label: "GitHub",
  url: "https://github.com/indraswara",
  iconPath: "assets/icons/github.svg", // optional custom SVG
}
```

- Use `iconPath` to point at any SVG in `assets/icons/` (add more files as needed).
- Leave out an entry to hide that platform entirely.

## Updating Experience / Education

- Experience items live in `content/experience.js` as `window.EXPERIENCE_ITEMS`.
- Education items live in `content/education.js` as `window.EDUCATION_ITEMS`.

Each item supports `title`, `date`, `description`, and `tags`:
```js
{
  title: "Senior Developer",
  date: "2022 - Present",
  description: "Building scalable web applications and leading development teams.",
  tags: ["JavaScript", "React", "Node.js"],
}
```
Add/remove objects to taste and reload the page.

## Managing Projects

The Projects page merges two sources at load time (see `loadLabRegistry()` in `app.js`):

- **`content/registry.json`** — the lab/subdomain projects (see "Accessing the lab" above). This is also
  read by the terminal backend's TUI and by deploy scripts, so it's the canonical source for anything that
  has a live demo. Each entry can carry a `web: { subdomain, port }` (live subdomain link + status badge),
  a `lab: { kind, cmd, blurb }` (playground CLI hint), and/or a `site: "<route>"` (on-site feature link, e.g.
  html-checker) — set whichever apply. Adding a new demo project = one entry here + a `labs/<slug>/` folder
  with its Dockerfile/overrides; see `labs/if3110-tubes/` for a worked example.
- **`content/projects.js`** — plain portfolio entries with no live demo, under `window.PROJECT_ITEMS`. Each
  entry can expose a `link`, which turns on a "View Project" button under that card.

```js
{
  title: "Personal Website",
  date: "2024",
  description: "A simple, plain text personal website with easy content management.",
  tags: ["HTML", "CSS", "JavaScript", "Docker"],
  link: "https://github.com/indraswara/personal-website",
}
```
Leave `link` undefined to hide the button. Registry-sourced entries are listed first, followed by
`content/projects.js` entries.

## Adding Or Editing Posts

1. **Create the article file**
   - Duplicate `posts/post-template.html` and rename it to `posts/<slug>.html`.
   - Keep only the `<article>…</article>` block; everything inside becomes the rendered post body.
   - Use standard HTML plus optional figures:
     ```html
     <figure class="post-figure">
       <img src="posts/images/example.svg" alt="Alt text" />
       <figcaption>Your caption here.</figcaption>
     </figure>
     ```

2. **Add the metadata**
   - Open `content/posts.js` and append a new object to `window.POST_ENTRIES`:
     ```js
     {
       slug: "my-new-post",
       title: "My New Post",
       date: "2024-03-10",
       description: "Short teaser shown in the post list.",
       tags: ["JavaScript", "Tips"],
       contentPath: "posts/my-new-post.html",
     }
     ```
   - The `slug` becomes the route (`#/post/my-new-post`), so keep it lowercase with dashes.

3. **Add images (optional)**
   - Drop SVG/PNG assets into `posts/images/` and reference them with `src="posts/images/<file>.svg"`.

4. **Verify**
   - Reload the site, go to `#/post`, and click “Read Post” to confirm the article loads and any images
     render.

## Deploying

On the VPS: `./deploy.sh` — pulls, re-clones/updates every `projects/<slug>/` from
`content/registry.json` (`scripts/clone-projects.sh`), rebuilds the sandbox image, and runs
`docker compose up -d --build` for the whole stack (portfolio, terminal backend, and every web project).
It does **not** touch cloudflared ingress or DNS by itself — run `scripts/sync-cloudflared-ingress.sh`
separately after adding a project's subdomain to the registry (it diffs before applying, and needs `sudo`
to write `/etc/cloudflared/config.yml` and restart the service).

After deploying, smoke-test:
- `#/` pulls the new home copy and the hero terminal still connects.
- `#/experience`, `#/education`, `#/project` show updated entries.
- `#/post` lists new posts and detail views fetch the corresponding HTML.
- Any web project you touched still responds on its subdomain (`docker compose ps` for container status).

## Troubleshooting

- **Seeing the home page inside a post?** Ensure `nginx.conf` (or your static host) serves `/posts/` files
  directly instead of falling back to `index.html`.
- **New copy not showing?** Hard-refresh (`Ctrl+Shift+R`) to bypass cached JS files.
- **Images missing?** Confirm the file exists in `posts/images/` and was deployed to the server.

Happy publishing!
