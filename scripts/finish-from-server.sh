#!/usr/bin/env bash
# Run this ON the homelab server (local shell or Cursor on the HP laptop).
set -euo pipefail

SITE="${1:-homelab-app}"
REPO="${2:-rinchenlama0075/homelab-app}"
GIT_URL="git@github.com:${REPO}.git"
PORT="${3:-3001}"

echo "== Register ${SITE} on homelab =="
bash /srv/homelab/deploy/register-site.sh "$SITE" docker "$GIT_URL" "$PORT"

echo ""
echo "== Site registry =="
cat /srv/homelab/deploy/sites.json

echo ""
echo "== Next: run on your DEV LAPTOP (with gh auth) =="
echo ""
echo "# 1. Add deploy key"
echo "gh repo deploy-key add <(ssh rinchen@localhost 'cat ~/.ssh/homelab_github.pub') \\"
echo "  --title homelab-server --repo ${REPO}"
echo ""
echo "# 2. Set CI SSH key secret"
echo "gh secret set DEPLOY_SSH_KEY --repo ${REPO} < <(cat ~/.ssh/homelab_ci)"
echo ""
echo "# 3. Trigger deploy"
echo "gh workflow run deploy.yml --repo ${REPO} --ref main"
echo ""
echo "Or from dev laptop project dir (when SSH to homelab works):"
echo "  bash scripts/finish-cicd-setup.sh"
