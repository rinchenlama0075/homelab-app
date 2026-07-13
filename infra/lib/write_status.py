#!/usr/bin/env python3
"""Write /srv/homelab/state/<site>.json after a deploy attempt.

Kept as a tiny standalone script (rather than inline `python3 -c "..."` in
deploy-site.sh) so the JSON encoding of log output — which can contain quotes,
backslashes, newlines, anything a build tool prints — never has to survive a
round-trip through shell quoting.

Usage: write_status.py <state_dir> <site> <status> <commit_sha> <deployed_at> <duration_ms> <log_file>
"""
import json
import sys

MAX_LOG_TAIL_CHARS = 4000


def main(argv):
    state_dir, site, status, commit_sha, deployed_at, duration_ms, log_file = argv[:7]

    try:
        with open(log_file, "r", errors="replace") as f:
            log_tail = f.read()[-MAX_LOG_TAIL_CHARS:]
    except OSError:
        log_tail = ""

    payload = {
        "commitSha": commit_sha,
        "deployedAt": deployed_at,
        "status": status,
        "durationMs": int(duration_ms),
        "logTail": log_tail,
    }

    with open(f"{state_dir}/{site}.json", "w") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main(sys.argv[1:])
