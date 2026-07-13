# Social feature API

Minimal Express + SQLite backend powering the `/social` feature of the portfolio site: it's a
small "social contract" app. Accounts make **commitments** (e.g. "Go to the gym, 5x/week"), then
**check in** — a photo + a required comment — against a commitment; other accounts can like and
comment on those check-ins. Weekly check-ins build a **streak**, streaks and check-in volume
unlock **badges** and **points**, and hitting a meaningful badge auto-posts a **milestone** to the
feed so friends can cheer it on. Runs as the `api` service in
[`../docker-compose.yml`](../docker-compose.yml); nginx proxies `/api/*` to it, so in production
everything is still served from `rinchen.co` with no extra domain or Caddy changes required.

## Local development

```bash
npm install
npm start   # listens on http://localhost:4000 (override with PORT)
npm test    # runs the streak-calculator unit tests (node's built-in test runner)
```

Data (SQLite database + uploaded images) is stored in `./data/`, which is git-ignored. Delete that
folder to reset to a clean state.

## Environment variables

| Variable    | Default                 | Notes                                                    |
|-------------|--------------------------|-----------------------------------------------------------|
| `PORT`      | `4000`                   | HTTP port the API listens on.                             |
| `DATA_DIR`  | `./data`                 | Where the SQLite file and `uploads/` live.                |
| `JWT_SECRET`| `dev-secret-change-me`   | **Must** be overridden in production (see below).         |

## API

All routes are mounted under `/api`.

| Method | Path                          | Auth | Description                                  |
|--------|--------------------------------|------|-----------------------------------------------|
| POST   | `/api/auth/signup`             | —    | `{ username, password }` → creates account, sets session cookie |
| POST   | `/api/auth/login`               | —    | `{ username, password }` → sets session cookie |
| POST   | `/api/auth/logout`              | —    | Clears the session cookie                     |
| GET    | `/api/auth/me`                  | yes  | Current user, or `401`                        |
| GET    | `/api/commitments`              | —    | All commitments, newest first; supports `?mine=1` (auth) for just the caller's own |
| GET    | `/api/commitments/:id`          | —    | A single commitment with progress stats, or `404` |
| POST   | `/api/commitments`               | yes  | `{ title, description, targetPerWeek }` → creates a commitment |
| GET    | `/api/posts`                     | —    | Latest check-ins (up to 50), newest first; supports `?commitmentId=` to scope to one commitment |
| POST   | `/api/posts`                     | yes  | `multipart/form-data` with `commitmentId`, `image`, and a required `caption` — must be the caller's own commitment |
| POST   | `/api/posts/:id/like`            | yes  | Toggles a like on a post                      |
| GET    | `/api/posts/:id/comments`        | —    | List comments on a post                       |
| POST   | `/api/posts/:id/comments`        | yes  | `{ body }` → adds a comment                   |
| GET    | `/api/uploads/:filename`         | —    | Serves an uploaded image                      |
| GET    | `/api/users/:username`           | —    | Public profile: points, badges, next-badge teasers, and per-commitment streaks |

Auth uses a JWT stored in an httpOnly, `SameSite=Lax` cookie, which works without CORS because the
frontend and API are served from the same origin (via nginx/CRA's dev proxy).

### Data model

- `commitments` — a goal a user commits to, with a weekly target (`target_per_week`, 1-7).
- `posts` — either a check-in (`type = 'check_in'`: a photo + caption, optionally tied to a
  commitment via `commitment_id`) or an auto-generated `milestone` post (no photo; `milestone_meta`
  holds the badge/streak details used to render it). Weekly progress for a commitment is computed
  on read as the count of its check-in posts created since the most recent Monday 00:00 UTC (see
  [`lib/week.js`](lib/week.js)).
- `likes` / `comments` — work the same way on check-in and milestone posts alike, so friends can
  cheer on both.
- `user_badges` — unlocked badges (`badge_code` from the static catalog in
  [`lib/badges.js`](lib/badges.js)), scoped to an account or to a specific commitment via
  `commitment_id`.
- `points_ledger` — an append-only log of point awards (check-ins, weekly-target bonuses, badge
  unlocks); totals are summed on read, same "compute on read" style as everything else here.

### Streaks, badges & points

- **Streaks** are never stored — [`lib/streaks.js`](lib/streaks.js) computes a commitment's current
  and longest streak (in consecutive completed weeks) from its check-in timestamps on every read.
  An in-progress current week never breaks a streak; it only extends it once the week's target is
  met. `isAtRisk` flags a commitment whose existing streak is on the line late in the week
  (Friday onward) with the target still unmet — used for loss-aversion nudges in the UI.
- **Badges** are a static catalog in [`lib/badges.js`](lib/badges.js): escalating streak badges
  (2/4/8/16/26/52 weeks), check-in volume badges (1/10/50/100/365), social/encouragement badges
  (likes/comments/commitments given), and a "Comeback Kid" badge for rebuilding a streak after a
  break. Unlocks are evaluated inline after the relevant write (check-in, like, comment, commitment
  creation) — no cron/polling needed.
- **Milestone posts** are auto-inserted into `posts` only for streak and volume badges (not the
  smaller social badges), so the feed celebrates real achievements without getting noisy.

## Production

Set a real `JWT_SECRET` via a `.env` file next to `docker-compose.yml` (not committed):

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)" > ../.env
```

Docker Compose picks up `.env` automatically. Posts and accounts persist in the `api_data` named
volume across redeploys.
