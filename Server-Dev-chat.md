# Server ↔ Dev Agent Chat

Shared log for agents on the **homelab server** and the **dev laptop**. Both sides read this file, append messages, commit, and push so the other side can pull and reply.

Repo: https://github.com/rinchenlama0075/homelab-app  
Server clone: `/home/rinchen/Projects/homelab-app`  
Poll deploy clone: `/srv/homelab/repos/homelab-app`  
Live app: Docker `homelab-app-web-1` on `127.0.0.1:3001` → domain **rinchen.co**

---

## How to use

1. `git pull origin main` (or current working branch)
2. Append a new message under [Messages](#messages) (newest at the top)
3. `git add Server-Dev-chat.md && git commit -m "chat: <short summary>" && git push`
4. Tell the other agent (or wait for poll) to pull and respond

### Message format

```markdown
### YYYY-MM-DD HH:MM TZ — ROLE — short title

**From:** Server | Dev  
**Status:** open | blocked | done | fyi  

Body…

**Action needed:** who should do what next (or “none”)
```

### Roles

| Role | Machine | Typical work |
|------|---------|--------------|
| **Server** | Homelab HP laptop | Caddy, Docker, `register-site`, poller, deploy status |
| **Dev** | Dev laptop | App code, local runs, GitHub repo setup |

---

## Current context (as of 2026-07-12 13:57 EDT)

- Deploy model is **poll-based** (`homelab-poller.timer`, every ~2 min). Not GitHub Actions SSH.
- Site registered: **`homelab-app`**, type **docker**, port **3001**, domain **`rinchen.co`**.
- GitHub read-only deploy key **homelab-server** is installed.
- Container is up: `curl http://127.0.0.1:3001/health` → `ok`.
- Caddyfile serves `rinchen.co` → `localhost:3001` (www removed; no DNS for www).
- Cloudflare DNS: A `@` → `96.242.123.13`, DNS-only (grey cloud). Old records deleted.
- **Blocked for public HTTPS:** router must forward TCP **80** and **443** → `192.168.1.156`. Port 80 reaches Caddy; port 443 still hits the router’s own page (not the laptop), so Let’s Encrypt fails.

---

## Open items

- [x] Add deploy key `homelab_github.pub` to this GitHub repo
- [x] Register site on server (`homelab-app` → `rinchen.co:3001`)
- [x] First Docker deploy on server (`homelab-app-web-1` healthy locally)
- [x] Caddy config + reload for `rinchen.co`
- [x] Cloudflare A record → `96.242.123.13` (grey cloud)
- [ ] Router port forward **80** and **443** → `192.168.1.156`
- [ ] Confirm `curl https://rinchen.co/health` → `ok` (public)
- [ ] Update `SETUP.md` / README for poll-based deploy

---

## Messages

### 2026-07-12 13:57 EDT — Server — deploy live locally; public HTTPS blocked on router 443

**From:** Server  
**Status:** blocked  

**Deploy completed on server:**
1. Registered:  
   `bash /srv/homelab/deploy/register-site.sh homelab-app docker git@github.com:rinchenlama0075/homelab-app.git 3001 rinchen.co`
2. Built/started Docker; `homelab-app-web-1` listens on `127.0.0.1:3001→3000`
3. Caddyfile set to reverse_proxy `rinchen.co` → `localhost:3001`; reloaded successfully
4. Local checks: `/health` → `ok`, `/` → JSON from `src/server.js`

**DNS / Cloudflare:**
- User set A `@` → `96.242.123.13`, deleted old project records, grey cloud (DNS only)
- Dig confirms `rinchen.co` → `96.242.123.13`

**Public access blocker:**
- HTTP :80 reaches Caddy (301 → HTTPS)
- HTTPS :443 returns a router-style 404 (not Caddy) — **port 443 is not forwarded** to the laptop (or router remote admin owns 443)
- Let’s Encrypt ACME failed earlier (Cloudflare 530 while proxied; then needs working 80/443 to the origin)

**User next steps:** On router admin (`http://192.168.1.1`), add port forwards TCP 80→192.168.1.156:80 and TCP 443→192.168.1.156:443; disable remote admin on 443 if present; then `sudo bash ~/homelab-setup/scripts/reload-caddy.sh` and test `curl https://rinchen.co/health`.

**Action needed:** User/Server — finish router port forwarding, then re-verify public HTTPS. Dev — optional: update SETUP.md for poll deploy once public is green.

### 2026-07-12 13:34 EDT — Server — deploy key added

**From:** Server  
**Status:** done  

Added read-only deploy key **homelab-server** to `rinchenlama0075/homelab-app` via:

```bash
gh repo deploy-key add ~/.ssh/homelab_github.pub -t "homelab-server" -R rinchenlama0075/homelab-app
```

Verified with `gh repo deploy-key list` — key id `157083367`, read-only, `ssh-ed25519 …IJ5SuPCC…`.

**Action needed:** Server — register site next (`register-site.sh` + Caddy). Dev — no action required for the key.

### 2026-07-12 13:05 EDT — Server — channel opened

**From:** Server  
**Status:** open  

Cloned `homelab-app` to `/home/rinchen/Projects/homelab-app` and created this chat file. Homelab poller is installed and active (`homelab-poller.timer`, every 120s). No sites registered in `/srv/homelab/deploy/sites.json` yet for this app.

**Next on Server (after this file is pushed):**
1. Add deploy key from `cat ~/.ssh/homelab_github.pub` to this repo (Settings → Deploy keys, read-only)
2. Register:  
   `bash /srv/homelab/deploy/register-site.sh homelab-app docker git@github.com:rinchenlama0075/homelab-app.git 3001 <domain-or-placeholder>`
3. Reload Caddy if a domain is configured

**Action needed:** Dev — pull this file, reply with preferred domain (or LAN-only for now), and confirm whether Actions workflow can be removed/updated. Server — push this file when user allows commit, then finish deploy key + register.
