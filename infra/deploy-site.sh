#!/usr/bin/env bash
# Deploys one registered site via `docker compose`, and always records what
# happened to /srv/homelab/state/<site>.json — success or failure — so the
# admin dashboard (sites/personal/admin) can show it.
#
# Safe to run by hand for debugging, exactly as the poller runs it:
#   ssh homelab
#   bash /srv/homelab/repos/homelab-app/infra/deploy-site.sh personal
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_DIR="${STATE_DIR:-/srv/homelab/state}"

site="${1:?usage: deploy-site.sh <site>}"

mkdir -p "$STATE_DIR"
log() { printf '%s [deploy:%s] %s\n' "$(date -u +%FT%TZ)" "$site" "$*" >&2; }

compose_dir="$(python3 "$SCRIPT_DIR/lib/sites.py" get "$site" compose_dir)"
if [[ -z "$compose_dir" ]]; then
  log "no compose_dir configured for '$site' in $SCRIPT_DIR/sites.json"
  exit 1
fi

cd "$REPO_DIR"
commit_sha="$(git rev-parse HEAD)"
started_at="$(date -u +%FT%TZ)"
start_ms=$(($(date +%s%N) / 1000000))

log_file="$(mktemp)"
trap 'rm -f "$log_file"' EXIT

status="success"
if ! docker compose \
  --project-directory "$compose_dir" \
  --project-name "$site" \
  up -d --build >"$log_file" 2>&1; then
  status="failed"
fi

cat "$log_file" >&2

end_ms=$(($(date +%s%N) / 1000000))
duration_ms=$((end_ms - start_ms))

python3 "$SCRIPT_DIR/lib/write_status.py" \
  "$STATE_DIR" "$site" "$status" "$commit_sha" "$started_at" "$duration_ms" "$log_file"

log "status=$status duration=${duration_ms}ms sha=${commit_sha:0:7}"

[[ "$status" == "success" ]]
