# Bodhicharya Foundation website

Static rebuild of [bodhicharyafoundation.org](https://www.bodhicharyafoundation.org/), migrated
off WordPress onto this homelab. Plain multi-page HTML/CSS/JS served by nginx — no build step, no
database, no PHP. This is a completely independent site from every other site in this repo (see
[`../personal`](../personal)): its own container, its own port, its own domain, no shared code or
branding.

## Layout

```
sites/bodhicharya/
  Dockerfile          # nginx:alpine, copies public/ as-is (no build stage)
  docker-compose.yml   # single `web` service, 127.0.0.1:3002 -> 80
  nginx.conf            # static file serving + /health + 404 fallback
  public/
    index.html, about.html, programs.html, blogs.html, donate.html, 404.html
    css/style.css
    js/main.js
    assets/            # drop real logo/photos/PDFs here (see below)
```

## Local development

No build tooling required — just serve the `public/` directory, or use Docker to match
production exactly:

```bash
cd sites/bodhicharya
docker compose up --build
# http://127.0.0.1:3002
```

## Content status

The current pages are a placeholder rebuild of the live site's content (hero, "what we do",
"about us", "our mission", plus "coming soon" placeholders for Blogs and Donate, matching what's
live today). The site owner is expected to:

1. Drop real photos/logo/PDFs into `public/assets/` (currently just a placeholder favicon —
   there are no real brand assets in the repo yet).
2. Update copy in the HTML files directly (no CMS/database — edit and redeploy).
3. Replace the SVG icon placeholders in the "What we do" / "Programs" cards with real
   photography once available, if desired.

## Deployment

Registered in [`../../infra/sites.json`](../../infra/sites.json) as `bodhicharya`, port `3002`,
domain `bodhicharyafoundation.org`. Routed by [`../../infra/caddy/Caddyfile`](../../infra/caddy/Caddyfile)
for both the apex domain and `www`. See the root [`README.md`](../../README.md) for the general
deploy model and [`Server-Dev-chat.md`](../../Server-Dev-chat.md) for the DNS cutover checklist
(GoDaddy -> Cloudflare) for this domain specifically.
