# homelab-app

Minimal Node.js Docker app — first project on the homelab CI/CD pipeline.

## Local development

```bash
npm install
npm run dev
# http://localhost:3000
```

## Docker

```bash
docker compose up --build
# http://localhost:3001
```

## Deploy

Push to `main` triggers GitHub Actions → SSH → `deploy-site.sh` on the homelab server.

See [SETUP.md](SETUP.md) for one-time GitHub and server configuration.
