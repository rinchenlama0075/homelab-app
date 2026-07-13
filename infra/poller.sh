#!/usr/bin/env bash
# Periodic entry point, invoked fresh (as a new process) by the outside-repo
# poller-bootstrap.sh stub on every systemd timer tick — see infra/README.md
# for why that split exists and how a fix to this file reaches production.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${STATE_DIR:-/srv/homelab/state}"
LOCK_FILE="${LOCK_FILE:-/run/homelab-poller.lock}"

mkdir -p "$STATE_DIR"

log() {
  printf '%s [poller] %s\n' "$(date -u +%FT%TZ)" "$*" | tee -a "$STATE_DIR/poller.log" >&2
}

# Refuse to run two poll cycles at once. Without this, a slow deploy from one
# tick could still be running when the *next* tick's `git reset --hard`
# rewrites the working tree underneath it.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "another poller run is already in progress, skipping this tick"
  exit 0
fi

sites_json="$SCRIPT_DIR/sites.json"
if [[ ! -f "$sites_json" ]]; then
  log "no $sites_json found, nothing to do"
  exit 0
fi

deploy_script="$SCRIPT_DIR/deploy-site.sh"

# A syntax error in a pushed script should abort loudly for *that* tick, not
# half-execute garbage or take down every future cycle.
if ! bash -n "$deploy_script"; then
  log "ABORT: $deploy_script has a syntax error — not deploying anything this cycle"
  exit 1
fi

any_failed=0
while IFS=$'\t' read -r site compose_dir; do
  [[ -z "$site" ]] && continue
  log "deploying $site ($compose_dir)"
  if bash "$deploy_script" "$site"; then
    log "$site: deployed OK"
  else
    log "$site: deploy FAILED — see $STATE_DIR/$site.json and $STATE_DIR/poller.log"
    any_failed=1
  fi
done < <(python3 "$SCRIPT_DIR/lib/sites.py" list-enabled)

exit "$any_failed"
