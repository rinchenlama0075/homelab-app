#!/usr/bin/env bash
# Validates the Caddyfile *before* touching the live process — a bad reload
# here takes down every site behind Caddy, not just one. Run with sudo, same
# as the previous ~/homelab-setup/scripts/reload-caddy.sh this replaces.
#
# NOTE for the Server agent: reconcile this with however Caddy is actually
# run on the box today (systemd unit vs. Docker container) if it differs —
# this assumes a systemd-managed `caddy` service.
set -euo pipefail

CADDYFILE="${CADDYFILE:-/srv/homelab/caddy/Caddyfile}"

if ! command -v caddy >/dev/null 2>&1; then
  echo "caddy binary not found on PATH" >&2
  exit 1
fi

validate_log="$(mktemp)"
trap 'rm -f "$validate_log"' EXIT

if ! caddy validate --config "$CADDYFILE" >"$validate_log" 2>&1; then
  echo "Caddyfile is INVALID — not reloading. Output:" >&2
  cat "$validate_log" >&2
  exit 1
fi

systemctl reload caddy
echo "Caddy config validated and reloaded."
