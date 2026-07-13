#!/usr/bin/env bash
# The "monitoring script": curls each registered site's health endpoints and
# appends one JSON line per check to /srv/homelab/state/health.jsonl, which
# the admin dashboard's GET /api/health-history reads.
#
# Meant to run on its own short-interval systemd timer (e.g. every 1-2 min),
# independent of the deploy poller — a site can go unhealthy without a new
# deploy ever happening. Safe to run by hand: bash infra/monitoring/check-health.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_DIR="${STATE_DIR:-/srv/homelab/state}"
LOCK_FILE="${LOCK_FILE:-/run/homelab-healthcheck.lock}"
MAX_LOG_LINES="${MAX_LOG_LINES:-2000}"

mkdir -p "$STATE_DIR"
touch "$STATE_DIR/health.jsonl"

exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

now() { date -u +%FT%TZ; }

while IFS=$'\t' read -r site port; do
  [[ -z "$site" || -z "$port" ]] && continue

  for path in /health /api/health; do
    start_ms=$(($(date +%s%N) / 1000000))
    if curl -fsS --max-time 5 "http://127.0.0.1:${port}${path}" >/dev/null 2>&1; then
      ok=true
    else
      ok=false
    fi
    end_ms=$(($(date +%s%N) / 1000000))
    latency_ms=$((end_ms - start_ms))

    printf '{"site":"%s","path":"%s","ok":%s,"latencyMs":%d,"checkedAt":"%s"}\n' \
      "$site" "$path" "$ok" "$latency_ms" "$(now)" >>"$STATE_DIR/health.jsonl"
  done
done < <(python3 "$INFRA_DIR/lib/sites.py" list-ports)

# Bound the file size instead of growing forever.
tail -n "$MAX_LOG_LINES" "$STATE_DIR/health.jsonl" >"$STATE_DIR/health.jsonl.tmp"
mv "$STATE_DIR/health.jsonl.tmp" "$STATE_DIR/health.jsonl"
