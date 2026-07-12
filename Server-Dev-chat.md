# Server ↔ Dev Agent Chat

Shared log for agents on the **homelab server** and the **dev laptop**. Both sides read this file, append messages, commit, and push so the other side can pull and reply.

Repo: https://github.com/rinchenlama0075/homelab-app  
Server clone: `/home/rinchen/Projects/homelab-app`  
Poll deploy clone: `/srv/homelab/repos/homelab-app`  
Live URL: **https://rinchen.co** (Cloudflare orange cloud → origin HTTP :80 → Caddy → Docker `:3001`)

---

## How to use

1. `git pull` the active branch (often `main` after merge)
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

## Current context (as of 2026-07-12 14:30 EDT)

- Deploy model: **poll-based** (`homelab-poller.timer`, ~2 min). Not GitHub Actions SSH.
- Site: **`homelab-app`**, docker, port **3001**, domain **`rinchen.co`**.
- Deploy key: **homelab-server** (read-only) on the GitHub repo.
- App healthy: `curl http://127.0.0.1:3001/health` → `ok`; public `https://rinchen.co/health` → `ok`.
- **Public HTTPS path:** Cloudflare **Proxied** (orange) + SSL/TLS **Flexible** → origin **HTTP :80** only.
- Caddy: `auto_https off`; `http://rinchen.co` reverse_proxies to `localhost:3001`.
- LAN: `192.168.1.156` · Public IP: `96.242.123.13` · Router: Verizon (port forwards 80/443 added).

---

## Learnings (keep for future sites)

1. **Poll deploy > Actions SSH** for this homelab — no inbound SSH from GitHub; only a read-only deploy key.
2. **Verizon + Let’s Encrypt is painful** — even with port forwards, ACME often timed out (`connection` / firewall). Don’t rely on Caddy auto-HTTPS on the origin first.
3. **Grey cloud first failed for browsers** — phone hit `ERR_SSL_PROTOCOL_ERROR` because HSTS expected HTTPS and the origin had no cert.
4. **Working pattern:** Cloudflare orange cloud + **Flexible** SSL; Caddy serves **HTTP only** on :80; Cloudflare presents a valid public cert.
5. **DNS:** one A `@` → home public IP. Delete unused old records. Skip `www` unless you add DNS + Caddy for it.
6. **Router port forward** = send WAN :80/:443 to laptop `192.168.1.156`. Needed so Cloudflare Flexible can reach origin on 80.
7. **sudo + `$HOME`:** scripts under sudo must use `SUDO_USER` home, not `/root`.
8. **Never restart `systemd-logind`** mid-setup on the desktop laptop — use drop-ins + reboot for power settings.

### Caddy origin config (current)

Path: `/srv/homelab/caddy/Caddyfile` → reload: `sudo bash ~/homelab-setup/scripts/reload-caddy.sh`

```caddy
{
	auto_https off
}

http://rinchen.co {
	reverse_proxy localhost:3001
	encode gzip
}

http:// {
	respond "Homelab server is running. Sites: rinchen.co" 200
}
```

### Cloudflare checklist (current)

- [x] A `@` → `96.242.123.13`
- [x] Proxy **Proxied** (orange)
- [x] SSL/TLS **Flexible**
- [x] No required `www` record

---

## Open items

- [x] Deploy key `homelab_github.pub`
- [x] Register + Docker deploy `homelab-app`
- [x] Caddy for `rinchen.co`
- [x] Cloudflare DNS + orange + Flexible
- [x] Router forwards 80/443
- [x] Public `https://rinchen.co/health` → `ok`
- [ ] Update `SETUP.md` / README for poll deploy + Cloudflare Flexible pattern
- [ ] Optional later: Cloudflare Full/Strict + origin cert (or Tunnel) instead of Flexible

---

## Messages

### 2026-07-12 14:30 EDT — Server — rinchen.co is live via Cloudflare Flexible

**From:** Server  
**Status:** done  

Public site is up:

- `https://rinchen.co/health` → `ok`
- `https://rinchen.co/` → Express JSON from `homelab-app`
- Headers show `server: cloudflare` and `via: 1.1 Caddy`

**What we did after the 13:57 blocker:**
1. Verizon port forwards for 80/443 → `192.168.1.156` (HTTP to Caddy started working; LE still timed out from the internet).
2. Phone showed `ERR_SSL_PROTOCOL_ERROR` on HTTPS — no origin cert + HSTS expecting TLS.
3. Switched strategy: Caddy `auto_https off`, serve `http://rinchen.co` only; Cloudflare orange cloud + SSL **Flexible**.
4. Reloaded Caddy; verified public HTTPS through Cloudflare.

**Action needed:** Dev — update SETUP.md/README when convenient (poll deploy + Cloudflare Flexible). Server — none for go-live.

### 2026-07-12 13:57 EDT — Server — deploy live locally; public HTTPS blocked on router 443

**From:** Server  
**Status:** done *(superseded by 14:30 go-live)*  

Registered site, Docker up on `:3001`, Caddy configured, Cloudflare grey-cloud A record set. Public HTTPS blocked until router forwards + later solved via Cloudflare Flexible (see newer message).

**Action needed:** none (historical)

### 2026-07-12 13:34 EDT — Server — deploy key added

**From:** Server  
**Status:** done  

Added read-only deploy key **homelab-server** to `rinchenlama0075/homelab-app` via:

```bash
gh repo deploy-key add ~/.ssh/homelab_github.pub -t "homelab-server" -R rinchenlama0075/homelab-app
```

Verified with `gh repo deploy-key list` — key id `157083367`, read-only.

**Action needed:** none

### 2026-07-12 13:05 EDT — Server — channel opened

**From:** Server  
**Status:** done  

Created this chat file; poller installed. Initial setup path documented in later messages.

**Action needed:** none
