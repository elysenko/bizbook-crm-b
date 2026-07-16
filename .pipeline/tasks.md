# Pipeline Task Decomposition

## Summary
BizBook is a full-stack appointment CRM. A NestJS + Prisma API (JWT auth, role-based access) serves a React + Vite + React Router SPA from a single container. Staff manage clients, a service catalog, and day-by-day appointment booking with double-booking protection; admins additionally manage the service catalog and view month-grouped revenue. Auth follows the `full_auth` model: public `/login` + `/signup`, first user becomes ADMIN, subsequent signups become USER.

## Surface contract

### Auth model: `full_auth` (roles: ADMIN, USER)
- Public routes: `/login`, `/signup`, `GET /api/health`, `GET /api/health/deep`.
- First signup → ADMIN; subsequent signups → USER. Logout clears JWT + redirects.

### Backend routes (all under `/api`)
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/clients?q=`, `POST /api/clients`, `GET /api/clients/:id`, `PATCH /api/clients/:id`, `GET /api/clients/:id/appointments`
- `GET /api/services` (all roles), `POST /api/services` (ADMIN), `PATCH /api/services/:id` (ADMIN)
- `GET /api/appointments?date=YYYY-MM-DD`, `POST /api/appointments`, `PATCH /api/appointments/:id/status`, `GET /api/appointments/today`
- `GET /api/revenue` (ADMIN)
- `GET /api/admin/settings` (ADMIN), `PATCH /api/admin/settings` (ADMIN)
- `GET /api/health`, `GET /api/health/deep`

### Frontend routes/screens
- `/login`, `/signup` (public)
- `/` → redirect `/today`
- `/today` (Today), `/clients` (`?q=`), `/clients/new`, `/clients/:id`, `/clients/:id/edit`
- `/services`, `/services/new` (ADMIN), `/services/:id/edit` (ADMIN)
- `/appointments` (`?date=`, DayView), `/appointments/new` (BookAppointment)
- `/revenue` (ADMIN)
- `/admin/settings` (ADMIN)
- `AppShell` header always renders "BizBook"; nav hides Revenue + service-edit + admin settings for USER.

### Entities
- `User{id, email(unique), passwordHash, name, role(enum ADMIN|USER @default USER), createdAt}`
- `Client{id, name, phone, email?, notes?, createdAt}`
- `Service{id, name, durationMin(int), priceCents(int), createdAt}`
- `Appointment{id, clientId→Client, serviceId→Service, date(DateTime date-only), startTime(String HH:MM), status(enum scheduled|completed|cancelled|no_show @default scheduled), createdAt}`
- `SystemSetting{key(String @id), value(String), updatedAt(DateTime @updatedAt)}`

### Domain rules
- Time slots: 30-min increments (`HH:MM`), business day 08:00–18:00.
- Taken slot = existing appointment at same `date`+`startTime` with status ≠ `cancelled`; enforced in service layer (check + insert wrapped).
- Double-booking → 409 with message `"Time slot already booked"`, no row created.
- Revenue = sum of `service.priceCents` for `completed` appointments grouped by appointment-date month (`YYYY-MM`), sorted desc.

## db_agent tasks
- [ ] Create `backend/prisma/schema.prisma` with SQLite datasource and Prisma client generator.
- [ ] Define `enum UserRole { ADMIN USER }` and `User{id, email @unique, passwordHash, name, role UserRole @default(USER), createdAt}` (full_auth model).
- [ ] Define `Client{id, name, phone, email?, notes?, createdAt}`.
- [ ] Define `Service{id, name, durationMin Int, priceCents Int, createdAt}`.
- [ ] Define `enum AppointmentStatus { scheduled completed cancelled no_show }` and `Appointment{id, clientId→Client, serviceId→Service, date DateTime (date-only), startTime String (HH:MM), status AppointmentStatus @default(scheduled), createdAt}` with relations to Client and Service.
- [ ] Add a `@@unique([date, startTime])`-style index/comment supporting active-booking uniqueness (partial-unique on enum enforced in backend service layer; document limitation).
- [ ] Define `SystemSetting{key String @id, value String, updatedAt DateTime @updatedAt}` (settings config store).
- [ ] Generate the initial Prisma migration.
- [ ] Author `backend/prisma/seed.ts`: create 1 ADMIN + 1 USER (known passwords), 5 clients, 4 services (incl. "Haircut" 30min/$25), ~10 appointments across yesterday/today/tomorrow at distinct slots with mixed statuses; print `SEED_CREDS_JSON={"admin":{...},"user":{...}}`; idempotent (skip if users exist).

## backend_agent tasks
- [ ] Scaffold backend app: `src/main.ts` (bootstrap, global `ValidationPipe`, `/api` prefix, SPA static fallback), `src/app.module.ts`, `src/prisma/prisma.service.ts` + module.
- [ ] Auth module (`src/auth/*`): `auth.service.ts` (signup hashes bcrypt password, assigns ADMIN if zero users else USER, returns JWT; login verifies + returns JWT `{sub,role,name}`), `auth.controller.ts` (`POST /api/auth/signup|login`, `GET /api/auth/me`), `jwt.strategy.ts`, `jwt-auth.guard.ts` (global except `@Public()`).
- [ ] Admin guard: `roles.guard.ts` + `roles.decorator.ts` (`@Roles('ADMIN')`); USER hitting admin endpoints → 403.
- [ ] Clients module (`src/clients/*`): `GET /api/clients?q=` (name/phone search), `POST` (name+phone required), `GET /api/clients/:id`, `PATCH /api/clients/:id`, `GET /api/clients/:id/appointments` (past + upcoming, joined service, ordered by date/time); DTOs with class-validator.
- [ ] Services module (`src/services/*`): `GET /api/services` (all roles), `POST`/`PATCH /api/services/:id` guarded `@Roles('ADMIN')`; validate `durationMin>0`, `priceCents>=0`; DTOs.
- [ ] Appointments module (`src/appointments/*`): `POST /api/appointments` (validate client/service exist; reject 409 `"Time slot already booked"` if active appointment at same date+startTime; wrap check+insert to avoid race), `GET /api/appointments?date=YYYY-MM-DD` (time order, client incl. phone + service), `GET /api/appointments/today` (today's list + `tomorrowCount`), `PATCH /api/appointments/:id/status` (completed/cancelled/no_show); DTOs.
- [ ] Revenue module (`src/revenue/*`): `GET /api/revenue` guarded `@Roles('ADMIN')`; aggregate `completed` appointments joined to service prices grouped by `YYYY-MM`, return `[{month,totalCents,count}]` sorted desc.
- [ ] Health (`src/health/health.controller.ts`): `GET /api/health` → `{status:'ok'}` (public); `GET /api/health/deep` → Prisma `SELECT 1` (public).
- [ ] Create `lib/config.ts` with `resolveConfig(key: string): string | null` — reads `process.env[key]`; if value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or absent, reads `SystemSetting` DB row; returns null if neither set.
- [ ] Admin settings endpoints: `GET /api/admin/settings` (list service keys for `postgresql` + `minio` with masked values + configured status) and `PATCH /api/admin/settings` (upsert key-value pairs, `@Roles('ADMIN')`).
- [ ] Serve `frontend/dist` statically from `main.ts` with SPA fallback to `index.html` for non-`/api` routes.

## ui_agent tasks
- [ ] Scaffold frontend: `package.json`, `vite.config.ts` (dev proxy `/api` → backend), `index.html`, `tsconfig.json`, `src/main.tsx`.
- [ ] `src/router.tsx` route table with `data.flow` nodes; `/` → redirect `/today`; wrap app routes in `ProtectedRoute`, admin routes in `RoleRoute`.
- [ ] Auth: `src/auth/AuthContext.tsx` (JWT in localStorage + user, logout clears + redirects), `src/auth/ProtectedRoute.tsx`, `src/auth/RoleRoute.tsx` (ADMIN gate); `src/api/client.ts` fetch wrapper attaching JWT, 401 → redirect `/login`.
- [ ] `Login.tsx` and `Signup.tsx` public screens (full_auth model).
- [ ] `AppShell.tsx`: header always renders "BizBook" + role-aware nav (hide Revenue, service create/edit, and admin settings for USER); loading/empty/error states.
- [ ] `Today.tsx`: today's appointments in time order with client phone + tomorrow count; empty/loading/error states.
- [ ] `ClientsList.tsx` (`?q=` search), `ClientForm.tsx` (create/edit), `ClientDetail.tsx` (contact + appointment history) with empty/loading/error states.
- [ ] `Services.tsx` catalog + `ServiceForm.tsx` (admin only; USER sees no create/edit controls).
- [ ] `DayView.tsx`: reads `?date=`, appointments in time order with status-change controls.
- [ ] `BookAppointment.tsx`: pick client/service/date/slot (30-min slots 08:00–18:00), surface 409 double-booking message inline.
- [ ] `Revenue.tsx`: month-grouped totals (ADMIN).
- [ ] `/admin/settings` page: list each service in `postgresql`, `minio` with configured/unconfigured badge + per-service credential form; show banner "The following need credentials to activate: [...]" when placeholder services/integrations present.

## service_agent tasks
- [ ] Set up TanStack Query provider/client and typed API layer bindings over `src/api/client.ts`.
- [ ] Wire auth flows (signup/login/me/logout) from AuthContext to `/api/auth/*`.
- [ ] Wire clients data hooks (`GET /api/clients?q=`, `POST`, `GET/:id`, `PATCH/:id`, `GET/:id/appointments`) to ClientsList/ClientForm/ClientDetail.
- [ ] Wire services data hooks (`GET/POST/PATCH /api/services`) to Services/ServiceForm.
- [ ] Wire appointments data hooks (`GET ?date=`, `POST`, `PATCH/:id/status`, `GET /today`) to DayView/BookAppointment/Today, surfacing 409 handling.
- [ ] Wire revenue hook (`GET /api/revenue`) to Revenue page.
- [ ] Wire admin settings hooks (`GET`/`PATCH /api/admin/settings`) to `/admin/settings` page.

## tester tasks
- [ ] Auth/roles: login as seeded ADMIN and USER; confirm USER gets 403 on `POST /api/services` and `GET /api/revenue`, and Revenue/service-edit/admin-settings nav absent for USER.
- [ ] Clients: create client → appears in list + `/clients/:id` shows history; search `?q=` filters by name/phone.
- [ ] Services: ADMIN adds "Haircut 30/$25" → appears + selectable in booking picker.
- [ ] Appointments: book free slot → status scheduled, shows in `?date=` day view in time order; book same slot → 409 `"Time slot already booked"` + no row created; change status → reflects in day view + client history.
- [ ] Today: `/today` lists today's appts with phones + tomorrow count.
- [ ] Revenue: completed appts sum grouped by month, sorted desc.
- [ ] Routing: every state deep-links (paste URL fresh → correct view); protected routes redirect unauthenticated users to `/login`.
- [ ] Health + seed: `/api/health` and `/api/health/deep` return ok; verify `SEED_CREDS_JSON` printed on seed.

## Open questions
- Spec `## Scope` declares SQLite as the bundled DB with no external service, but pipeline inputs provision `postgresql` and `minio` deployments. Downstream agents should confirm whether these are actually used at runtime (and whether MinIO/object storage has any feature backing it — the spec defines no file/upload feature) or are placeholder infra only surfaced via `/admin/settings`. Absent a spec feature, no MinIO client behaviour is implemented.
- `<spec_integrations>` lists only the sentinel "None (no third-party APIs/SDKs)"; treated as no real integrations, so no integration client modules are generated.
