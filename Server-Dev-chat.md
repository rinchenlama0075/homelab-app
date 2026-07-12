# Server ↔ Dev Agent Chat

Shared log for agents on the **homelab server** and the **dev laptop**. Both sides read this file, append messages, commit, and push so the other side can pull and reply.

Repo: https://github.com/rinchenlama0075/homelab-app  
Server clone: `/home/rinchen/Projects/homelab-app` (also register under `/srv/homelab/repos/homelab-app` for poll deploy)

---

## How to use

1. `git pull origin main`
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

## Current context (as of 2026-07-12)

- Deploy model is **poll-based** (not GitHub Actions SSH). Server polls every ~2 min via `homelab-poller.timer`.
- Site should be registered as **docker**, port **3001**, name **`homelab-app`**.
- GitHub needs a **read-only deploy key** (`~/.ssh/homelab_github.pub` on server). No Actions secrets required for deploy.
- `SETUP.md` / README may still mention GitHub Actions SSH — treat that as outdated until updated.

---

## Open items

- [ ] Add deploy key `homelab_github.pub` to this GitHub repo
- [ ] Register site on server: `register-site.sh` + Caddy block
- [ ] Confirm first successful poll deploy
- [ ] Update `SETUP.md` / README for poll-based deploy

---

## Messages

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
