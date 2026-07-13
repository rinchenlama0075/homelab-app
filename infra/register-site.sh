#!/usr/bin/env bash
# Registers (or re-registers) a site in infra/sites.json and prints the Caddy
# block to add for it. Doesn't touch Caddy itself — see infra/scripts/reload-caddy.sh.
#
# Usage: register-site.sh <site> <domain> <port> [git_url] [branch]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

site="${1:?usage: register-site.sh <site> <domain> <port> [git_url] [branch]}"
domain="${2:?usage: register-site.sh <site> <domain> <port> [git_url] [branch]}"
port="${3:?usage: register-site.sh <site> <domain> <port> [git_url] [branch]}"
git_url="${4:-git@github.com:rinchenlama0075/homelab-app.git}"
branch="${5:-main}"
compose_dir="sites/$site"

python3 "$SCRIPT_DIR/lib/sites.py" set "$site" "$domain" "$port" "$compose_dir" "$git_url" "$branch"

cat <<EOF

Registered '$site' -> $compose_dir (port $port, domain $domain) in infra/sites.json.

Add this block to infra/caddy/Caddyfile, then run infra/scripts/reload-caddy.sh:

http://$domain {
	reverse_proxy localhost:$port
	encode gzip
}

Don't forget the Cloudflare DNS side (A/CNAME -> this server, Proxied) if this
is a brand-new domain.
EOF
