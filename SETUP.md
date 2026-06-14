# One-time CI/CD setup — homelab-app

Complete these steps **in order**. The repo and workflow are already in place; you finish GitHub secrets and server registration.

## Checklist

```
Site name: homelab-app
Type: docker
Port: 3001
GitHub repo: https://github.com/rinchenlama0075/homelab-app

Dev laptop (done):
- [x] GitHub repo created and pushed
- [x] DEPLOY_HOST, DEPLOY_USER, DEPLOY_SITE_NAME secrets set
- [x] finish-cicd-setup.sh script added

Server (on homelab — SSH from home network):
- [ ] register-site.sh
- [ ] Caddy block + reload (when you have a domain)

GitHub (needs server SSH keys):
- [ ] Deploy key (homelab_github.pub, read-only)
- [ ] DEPLOY_SSH_KEY secret (homelab_ci private key)

Verify:
- [ ] Actions workflow succeeds on push to main
- [ ] curl http://127.0.0.1:3001/health on server (after deploy)
```

### Finish in one command (dev laptop, on home network)

```bash
cd ~/Desktop/Projects/homelab-app
bash scripts/finish-cicd-setup.sh
```

---

## Step 1 — Dev laptop: GitHub CLI (one time)

```bash
gh auth login
# GitHub.com → SSH → login as rinchenlama0075
gh auth status
```

Add homelab SSH alias (if not already in `~/.ssh/config`):

```
Host homelab
  HostName 192.168.1.156
  User rinchen
  IdentityFile ~/.ssh/homelab_personal
```

Use LAN IP when on your home network; use `96.242.123.13` when away (if port 22 is forwarded).

---

## Step 2 — Create GitHub repo and push

From this directory:

```bash
cd ~/Desktop/Projects/homelab-app
git init
git add .
git commit -m "Initial homelab Docker app with CI/CD workflow"
gh repo create homelab-app --public --source=. --remote=origin --push
```

If the repo already exists on GitHub:

```bash
git remote add origin git@github.com:rinchenlama0075/homelab-app.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Register site on homelab server

SSH into the server (from home network):

```bash
ssh homelab
bash /srv/homelab/deploy/register-site.sh \
  homelab-app docker \
  git@github.com:rinchenlama0075/homelab-app.git \
  3001
```

When you have a domain later, add the printed Caddy block to `/srv/homelab/caddy/Caddyfile` and reload:

```bash
sudo bash ~/homelab-setup/scripts/reload-caddy.sh
```

Until DNS is ready, verify on the server after deploy:

```bash
curl -s http://127.0.0.1:3001/health
```

---

## Step 4 — Deploy key (server → GitHub, read-only)

On the **server**:

```bash
cat ~/.ssh/homelab_github.pub
```

In GitHub → **homelab-app → Settings → Deploy keys → Add deploy key**:

- Title: `homelab-server`
- Key: paste public key
- Allow write access: **OFF**

---

## Step 5 — GitHub Actions secrets

On the **server**, get the CI private key (never commit this):

```bash
cat ~/.ssh/homelab_ci
```

In GitHub → **homelab-app → Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | `96.242.123.13` |
| `DEPLOY_USER` | `rinchen` |
| `DEPLOY_SITE_NAME` | `homelab-app` |
| `DEPLOY_SSH_KEY` | entire `homelab_ci` private key (including BEGIN/END lines) |

Or via CLI (after `gh auth login`):

```bash
gh secret set DEPLOY_HOST --body "96.242.123.13" --repo rinchenlama0075/homelab-app
gh secret set DEPLOY_USER --body "rinchen" --repo rinchenlama0075/homelab-app
gh secret set DEPLOY_SITE_NAME --body "homelab-app" --repo rinchenlama0075/homelab-app
# DEPLOY_SSH_KEY: paste from server — do not store in shell history
gh secret set DEPLOY_SSH_KEY --repo rinchenlama0075/homelab-app
```

---

## Step 6 — Trigger deploy

```bash
git push origin main
```

Or: GitHub → **Actions** → **Deploy to homelab** → **Run workflow**.

Success means the workflow completes and on the server:

```bash
ssh homelab 'docker ps'
ssh homelab 'curl -s http://127.0.0.1:3001/'
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Connection refused` on SSH in Actions | Router forwards port 22 → `192.168.1.156`; server online |
| `Permission denied (publickey)` | Re-copy full `homelab_ci` into `DEPLOY_SSH_KEY` |
| Deploy script fails | `ssh homelab 'bash /srv/homelab/deploy/deploy-site.sh homelab-app'` |
| 502 / no response | `docker ps` — container on `127.0.0.1:3001` |

See the HomeLab project: `DEV-LAPTOP-SETUP.md` and `.cursor/skills/homelab-dev/`.
