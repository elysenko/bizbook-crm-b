# Architecture

## Requested stack
`backend, web` (fixed by platform for this project — see `<stack_contract>`).

## What was scaffolded
This project directory was empty (only `.git`, `.github`, `README.md`) before this run, so
both platforms were newly scaffolded from `scaffold-templates/`:

- ✅ **backend** — `backend/` — NestJS + Prisma + PostgreSQL API (from `template-backend`)
- ✅ **web** — `web/` — Angular frontend (`web/frontend/`) + nginx static host, plus a
  bundled demo NestJS/Prisma backend (`web/backend/`) that ships with the template (from
  `template-web`)

Nothing pre-existed, so no platform was skipped.

## Where each piece lives
- `backend/` — primary API service. NestJS 11 + Prisma + PostgreSQL, global prefix `api/v1`,
  Swagger at `/api`, listens on port 3000. Has its own `Dockerfile`.
- `web/frontend/` — Angular 17 SPA (project name `frontend` in `angular.json`), builds to
  `dist/frontend/browser`. Served by nginx in production (`web/Dockerfile.frontend` +
  `web/nginx.conf`), dev proxy config at `web/frontend/proxy.conf.json`.
- `web/backend/` — a second, template-bundled NestJS/Prisma backend shipped as part of
  `template-web` (auth/user/health modules only). It is not the primary API — treat
  `backend/` as the source of truth for BizBook's domain API (auth, clients, services,
  appointments, revenue) per the technical plan. Keep or remove `web/backend/` based on
  whether the build actually wires it up; do not let it silently diverge from `backend/`.

## Notes vs. the technical plan
The plan called for a React + Vite SPA and SQLite. The platform's fixed stack for this app
is NestJS (`backend`) + Angular (`web`), so the plan's **features** (auth/roles, clients,
services, appointments with double-booking checks, revenue reporting, health checks) should
be implemented on top of the scaffolded Angular + NestJS + Prisma stack rather than React/Vite.
`backend/prisma/schema.prisma` and `web/backend/prisma/schema.prisma` currently default to
`postgresql` — confirm which datasource the build actually targets before writing migrations
that assume SQLite from the plan.

## Next steps for the developer
1. `backend/`: copy `.env` from a template if one is added, set `DATABASE_URL`, `JWT_SECRET`,
   run `npx prisma migrate dev` against a running Postgres instance, then `npm run seed`.
2. `web/frontend/`: `npm install`, `npm start` (proxies `/api` to the backend per
   `proxy.conf.json`).
3. Decide whether `web/backend/` is kept, merged into `backend/`, or removed — avoid running
   two divergent NestJS/Prisma backends in production.
4. Wire the domain models from the plan (User/Client/Service/Appointment) into
   `backend/prisma/schema.prisma`, replacing/extending the template's starter `User` model.
5. `docker build` using `backend/Dockerfile`, `web/Dockerfile.frontend`, and
   `web/Dockerfile.backend` as needed; `web/nginx.conf` proxies `/api/` to a service named
   `backend` on port 3000 — keep that name in sync with `colossus.yaml`.

## Template sources
- `scaffold-templates/template-backend/` → `backend/`
- `scaffold-templates/template-web/` → `web/`
