#!/usr/bin/env bash
# Finish homelab CI/CD setup from the dev laptop (requires SSH to homelab server).
set -euo pipefail

REPO="${HOMELAB_REPO:-rinchenlama0075/homelab-app}"
SITE="${HOMELAB_SITE:-homelab-app}"
GIT_URL="git@github.com:${REPO}.git"
PORT="${HOMELAB_PORT:-3001}"
USER="${HOMELAB_USER:-rinchen}"

try_hosts() {
  local hosts=()
  [[ -n "${HOMELAB_HOST:-}" ]] && hosts+=("$HOMELAB_HOST")
  hosts+=("homelab" "192.168.1.156" "96.242.123.13")

  for h in "${hosts[@]}"; do
    echo "Trying SSH: ${USER}@${h} ..."
    if ssh -o BatchMode=yes -o ConnectTimeout=8 "${USER}@${h}" 'echo connected' &>/dev/null; then
      echo "$h"
      return 0
    fi
  done
  return 1
}

echo "== Homelab CI/CD finish setup =="

HOST="$(try_hosts)" || {
  echo "ERROR: Cannot reach homelab server via SSH."
  echo "Connect to your home network (or ensure port 22 is forwarded), then re-run:"
  echo "  bash scripts/finish-cicd-setup.sh"
  exit 1
}

echo "Using host: ${HOST}"

echo "-> Register site on server"
ssh "${USER}@${HOST}" "bash /srv/homelab/deploy/register-site.sh ${SITE} docker ${GIT_URL} ${PORT}"

echo "-> Add deploy key to GitHub"
TMP_PUB="$(mktemp)"
ssh "${USER}@${HOST}" 'cat ~/.ssh/homelab_github.pub' > "$TMP_PUB"
gh repo deploy-key add "$TMP_PUB" --title "homelab-server" --repo "$REPO" || true
rm -f "$TMP_PUB"

echo "-> Set DEPLOY_SSH_KEY secret"
TMP_KEY="$(mktemp)"
ssh "${USER}@${HOST}" 'cat ~/.ssh/homelab_ci' > "$TMP_KEY"
gh secret set DEPLOY_SSH_KEY --repo "$REPO" < "$TMP_KEY"
rm -f "$TMP_KEY"

echo "-> Ensure other secrets"
gh secret set DEPLOY_HOST --body "96.242.123.13" --repo "$REPO"
gh secret set DEPLOY_USER --body "$USER" --repo "$REPO"
gh secret set DEPLOY_SITE_NAME --body "$SITE" --repo "$REPO"

echo "-> Trigger deploy workflow"
gh workflow run deploy.yml --repo "$REPO" --ref main

echo "-> Waiting for workflow (30s)..."
sleep 30
gh run list --repo "$REPO" --limit 1

echo ""
echo "Done. Check: https://github.com/${REPO}/actions"
echo "Verify on server: ssh ${USER}@${HOST} 'docker ps && curl -s http://127.0.0.1:${PORT}/health'"
