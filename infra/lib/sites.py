#!/usr/bin/env python3
"""Small helper CLI around infra/sites.json.

The poller and deploy scripts shell out to this instead of hand-rolling JSON
parsing in bash — bash reading JSON line-by-line was the source of a real bug
in this project before (see Server-Dev-chat.md's "Learnings": a `python |
while read` pipeline ran the loop body in a subshell under `set -u`, so
`poll_enabled` looked like an unbound variable). Every command here is safe
to run by hand too, e.g. `python3 infra/lib/sites.py list-enabled`.
"""
import json
import sys
from pathlib import Path

SITES_JSON = Path(__file__).resolve().parent.parent / "sites.json"


def load():
    if not SITES_JSON.exists():
        return {}
    with open(SITES_JSON) as f:
        return json.load(f)


def save(data):
    with open(SITES_JSON, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def cmd_list_enabled():
    """site<TAB>compose_dir, one per line, for every poll_enabled site."""
    for name, cfg in load().items():
        if cfg.get("poll_enabled", True):
            print(f"{name}\t{cfg.get('compose_dir', '')}")


def cmd_list_ports():
    """site<TAB>port, one per line, for every poll_enabled site with a port."""
    for name, cfg in load().items():
        if cfg.get("poll_enabled", True) and cfg.get("port"):
            print(f"{name}\t{cfg['port']}")


def cmd_get(site, field):
    value = load()[site][field]
    print(value)


def cmd_set(site, domain, port, compose_dir, git_url, branch):
    data = load()
    data[site] = {
        "type": "docker",
        "git_url": git_url,
        "domain": domain,
        "port": int(port),
        "compose_dir": compose_dir,
        "branch": branch,
        "poll_enabled": True,
    }
    save(data)


def main(argv):
    if not argv:
        raise SystemExit("usage: sites.py <list-enabled|list-ports|get|set> [...]")

    cmd, rest = argv[0], argv[1:]
    if cmd == "list-enabled":
        cmd_list_enabled()
    elif cmd == "list-ports":
        cmd_list_ports()
    elif cmd == "get":
        cmd_get(*rest)
    elif cmd == "set":
        cmd_set(*rest)
    else:
        raise SystemExit(f"unknown command: {cmd}")


if __name__ == "__main__":
    main(sys.argv[1:])
