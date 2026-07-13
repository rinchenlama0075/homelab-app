# Social feature API

Minimal Express + SQLite backend powering the `/social` feature of the portfolio site: accounts,
photo+caption posts, likes, and comments. Runs as the `api` service in
[`../docker-compose.yml`](../docker-compose.yml); nginx proxies `/api/*` to it, so in production
everything is still served from `rinchen.co` with no extra domain or Caddy changes required.

## Local development

```bash
npm install
npm start   # listens on http://localhost:4000 (override with PORT)
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

| Method | Path                     | Auth | Description                                  |
|--------|---------------------------|------|-----------------------------------------------|
| POST   | `/api/auth/signup`        | —    | `{ username, password }` → creates account, sets session cookie |
| POST   | `/api/auth/login`         | —    | `{ username, password }` → sets session cookie |
| POST   | `/api/auth/logout`        | —    | Clears the session cookie                     |
| GET    | `/api/auth/me`            | yes  | Current user, or `401`                        |
| GET    | `/api/posts`               | —    | Latest posts (up to 50), newest first         |
| POST   | `/api/posts`               | yes  | `multipart/form-data` with `image` + `caption` |
| POST   | `/api/posts/:id/like`      | yes  | Toggles a like on a post                      |
| GET    | `/api/posts/:id/comments`  | —    | List comments on a post                       |
| POST   | `/api/posts/:id/comments`  | yes  | `{ body }` → adds a comment                   |
| GET    | `/api/uploads/:filename`   | —    | Serves an uploaded image                      |

Auth uses a JWT stored in an httpOnly, `SameSite=Lax` cookie, which works without CORS because the
frontend and API are served from the same origin (via nginx/CRA's dev proxy).

## Production

Set a real `JWT_SECRET` via a `.env` file next to `docker-compose.yml` (not committed):

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)" > ../.env
```

Docker Compose picks up `.env` automatically. Posts and accounts persist in the `api_data` named
volume across redeploys.
