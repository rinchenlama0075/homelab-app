# Tap Tunes — NFC jukebox

Customers tap an NFC tag on a table, land on a per-venue ordering page, buy a bundle of song
credits, and queue up songs. A physical kiosk device at the bar streams the actual audio through
Spotify Connect. See the full plan in the repo's `.cursor/plans/` (or wherever it was saved) for the
architecture rationale — this README is the practical "how do I run/deploy this" doc.

## Layout

```
sites/tap-tunes/
  src/, public/, package.json      # customer PWA + kiosk player + owner dashboard (one CRA app)
  Dockerfile, nginx.conf           # web container: build the SPA, serve it, proxy /api + /socket.io
  server/                          # Express + Socket.IO + better-sqlite3 API
    db.js                          # schema
    lib/playback/                  # PlaybackProvider abstraction + Spotify implementation
    lib/queue.js                   # the request queue / now-playing ledger
    lib/stripe.js                  # token-bundle Checkout Sessions, webhook handling, payouts
    lib/tokens.js                  # session + song-credit bookkeeping, cooldowns
    routes/                        # public (customer), player (kiosk), owner, oauth, webhooks
    jobs/payout.js                 # run weekly: batches each venue's 3% payout into one Transfer
  docker-compose.yml
```

## Local development (no Docker)

```bash
# terminal 1 — API
cd sites/tap-tunes/server
npm install
PORT=4100 DATA_DIR=./data node index.js

# terminal 2 — web app (CRA dev server proxies /api and /socket.io via package.json "proxy")
cd sites/tap-tunes
npm install
npm start   # http://localhost:3000
```

Seed a venue + owner for local testing:

```bash
cd sites/tap-tunes/server
DATA_DIR=./data node -e "
const { db, randomToken } = require('./db');
const bcrypt = require('bcryptjs');
const v = db.prepare(\"INSERT INTO venues (slug, name, kiosk_token, status) VALUES (?, ?, ?, 'active')\")
  .run('the-tap-room', 'The Tap Room', randomToken(8));
db.prepare('INSERT INTO owner_users (venue_id, email, password_hash) VALUES (?, ?, ?)')
  .run(v.lastInsertRowid, 'owner@example.com', bcrypt.hashSync('password123', 10));
"
```

Then visit `http://localhost:3000/v/the-tap-room` (customer) and `http://localhost:3000/owner/login`
(owner: `owner@example.com` / `password123`).

## Required environment variables (server)

| Variable | Purpose |
|---|---|
| `OWNER_JWT_SECRET` | Signs the owner-dashboard session cookie |
| `PUBLIC_BASE_URL` | Used to build Stripe Checkout success/cancel URLs |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | From a Spotify Developer app (below) |
| `SPOTIFY_REDIRECT_URI` | e.g. `https://taptunes.rinchen.co/api/oauth/spotify/callback` |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | From the Stripe webhook endpoint for `checkout.session.completed` |

These need to be added as Cursor Dashboard secrets (for CI/build) and as a server-side `.env` (or
docker secrets) consumed by `docker-compose.yml` — never commit real values.

## One-time manual setup this repo can't do for you

1. **Spotify Developer app** — create one at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard),
   add `SPOTIFY_REDIRECT_URI` as a redirect URI, copy the client id/secret into env vars above.
   Each venue then connects *its own* Spotify **Premium** account once, from
   `/owner/connections` — Tap Tunes (the platform) should budget for that Premium subscription
   per venue as a cost of doing business, since the pitch is "no subscription fees" for the bar.
2. **Stripe account** — create a Stripe account, get the secret key, and add a webhook endpoint
   (`https://<domain>/api/webhooks/stripe`) subscribed to `checkout.session.completed`, then copy
   its signing secret into `STRIPE_WEBHOOK_SECRET`. Stripe Connect (Express) is used for venue
   payouts — no separate setup needed beyond the secret key; onboarding links are generated
   per-venue from `/owner/connections`.
3. **Register + deploy on the homelab server**:
   ```bash
   ssh homelab
   bash /srv/homelab/repos/homelab-app/infra/register-site.sh tap-tunes taptunes.rinchen.co 3003
   # add the printed Caddy block (already added to infra/caddy/Caddyfile in this repo) if not present
   bash infra/scripts/reload-caddy.sh
   ```
   Then in Cloudflare: add `taptunes` CNAME/A record, Proxied. **Before accepting real payments**,
   harden this domain beyond the fleet's current Cloudflare "Flexible" mode — prefer a
   **Cloudflare Tunnel** over "Full (strict) + Let's Encrypt", since `Server-Dev-chat.md`'s
   Learnings note Let's Encrypt HTTP-01 has been unreliable on this Verizon connection (that's the
   documented reason Flexible was chosen fleet-wide). See the note in `infra/caddy/Caddyfile`.
4. **Weekly payout job** — schedule `node jobs/payout.js` (or
   `docker compose --project-directory sites/tap-tunes --project-name tap-tunes run --rm api node jobs/payout.js`)
   on a systemd timer, e.g. weekly on a slow night.

## Kiosk hardware setup (per venue)

1. Any small always-on box with Chromium: a Raspberry Pi 4/5 (recommended — cheap, low power,
   fanless) or a repurposed mini-PC/old laptop.
2. Install Raspberry Pi OS (or any Linux) with Chromium, and audio out via 3.5mm jack (or a USB
   audio adapter for cleaner sound) into an open channel on the venue's existing amp/mixer.
3. Get the kiosk URL from `/owner/connections` (`https://<domain>/player/<venueId>?token=<kiosk token>`)
   and set Chromium to auto-launch into it in kiosk mode on boot, e.g.:
   ```bash
   chromium-browser --kiosk --noerrdialogs --disable-translate --autoplay-policy=no-user-gesture-required \
     "https://taptunes.rinchen.co/player/<venueId>?token=<kiosk-token>"
   ```
   (`--autoplay-policy` matters — without it Chromium may block Spotify's Web Playback SDK from
   starting audio without a user gesture.)
4. Run it under a supervisor (a systemd unit or `pm2`/`forever` wrapping the browser launch) so a
   crash restarts it automatically.
5. In `/owner/connections`, once the kiosk shows "Connected", click "Refresh devices" and
   "Activate" on it — this makes it the venue's active Spotify Connect output device.
6. Log the venue's Spotify Premium account into the kiosk once via `/owner/connections` →
   "Connect Spotify" (opens Spotify's login in a new tab; do this from a device you can see the
   Spotify login prompt on, not blind on the kiosk itself, then it stays connected via the stored
   refresh token going forward).

## NFC tags

Cheap passive NTAG213/215 stickers, one per table/bar-top. Write each with an NDEF **URI record**
pointing at `https://<domain>/v/<venue-slug>?t=<tag-slug>` using a phone NFC-writer app (e.g. "NFC
Tools", no coding needed) or the Web NFC API (`NDEFReader`, Android Chrome only) from
`/owner/tags`, which lists the exact URL for each registered table. Both iOS (11+) and Android open
that URL automatically on tap — no app install required for customers.
