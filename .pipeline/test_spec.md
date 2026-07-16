# Test Specification

> ⚠️ **Warning:** `.pipeline/surface.json` was not found. The API surface below was
> derived from the approved spec and `.pipeline/tasks.md` ("Surface contract").
> The `## Coverage summary` "total in surface.json" denominator therefore reflects
> the 20 endpoints enumerated from those sources, not a machine-read manifest.
> If `surface.json` is added later, re-run this agent to reconcile.

## Coverage summary
- Total cases: 78
- API endpoints covered: 20 / 20 (derived from spec + tasks.md)
- User journeys covered: 14

---

## API tests

All endpoints are under the `/api` prefix. Unless listed as **Public**, every endpoint
requires a valid `Authorization: Bearer <JWT>` header; a missing/invalid/expired token
must return **401**. Seed provides one ADMIN and one USER account (credentials emitted
via `SEED_CREDS_JSON`).

### `POST /api/auth/signup` — Public
- **Happy path (first user → ADMIN)**: on an empty user table, `{email,password,name}` → **201/200** with `{token}` (JWT). Decoded `GET /api/auth/me` shows `role: "ADMIN"`.
- **Happy path (subsequent → USER)**: with ≥1 existing user, valid body → **200** with `{token}`; `GET /api/auth/me` shows `role: "USER"`.
- **Validation failures**: missing `email` / missing `password` / malformed email → **400**.
- **Duplicate email**: signup with an already-registered email → **409** (or 400), no second row created.

### `POST /api/auth/login` — Public
- **Happy path**: seeded ADMIN `{email,password}` → **200** with `{token}`; token payload contains `{sub, role, name}`.
- **Validation failures**: missing `email` or `password` → **400**.
- **Auth failures**: wrong password → **401**; unknown email → **401**.

### `GET /api/auth/me`
- **Happy path**: valid ADMIN token → **200** `{id,email,name,role:"ADMIN"}`; valid USER token → `role:"USER"`.
- **Auth failures**: no token / malformed token / expired token → **401**.

### `GET /api/clients?q=`
- **Happy path (all authenticated roles)**: USER or ADMIN token → **200** array of clients (seed has 5).
- **Search**: `?q=<name-substring>` filters by name; `?q=<phone-substring>` filters by phone; both return only matching rows. Empty `?q=` (or omitted) returns all.
- **Auth failures**: no token → **401**.

### `POST /api/clients`
- **Happy path**: `{name, phone}` (any authenticated role) → **201** with created client `{id,name,phone}`; row is now retrievable via `GET /api/clients/:id` and appears in list.
- **Validation failures**: missing `name` → **400**; missing `phone` → **400**.
- **Auth failures**: no token → **401**.

### `GET /api/clients/:id`
- **Happy path**: existing id → **200** `{id,name,phone,email?,notes?}`.
- **Not found**: unknown id → **404**.
- **Auth failures**: no token → **401**.

### `PATCH /api/clients/:id`
- **Happy path**: `{name:"New Name"}` on existing id → **200**; subsequent `GET` reflects the change.
- **Validation failures**: empty/invalid field types → **400**.
- **Not found**: unknown id → **404**.
- **Auth failures**: no token → **401**.

### `GET /api/clients/:id/appointments`
- **Happy path**: client with history → **200** array of appointments with joined `service`, ordered by date then `startTime`, including both past and upcoming entries.
- **Empty**: client with no appointments → **200** `[]`.
- **Not found**: unknown client id → **404**.
- **Auth failures**: no token → **401**.

### `GET /api/services`
- **Happy path (all roles)**: USER and ADMIN tokens → **200** array (seed has 4, incl. "Haircut" 30min / 2500 cents).
- **Auth failures**: no token → **401**.

### `POST /api/services` — ADMIN only
- **Happy path (ADMIN)**: `{name:"Haircut",durationMin:30,priceCents:2500}` → **201**; appears in `GET /api/services`.
- **Auth failures (role)**: valid USER token → **403**, no row created.
- **Validation failures**: `durationMin<=0` → **400**; `priceCents<0` → **400**; missing `name` → **400**.
- **Auth failures**: no token → **401**.

### `PATCH /api/services/:id` — ADMIN only
- **Happy path (ADMIN)**: `{priceCents:3000}` on existing id → **200**; `GET` reflects change.
- **Auth failures (role)**: USER token → **403**, no change.
- **Validation failures**: `durationMin<=0` or `priceCents<0` → **400**.
- **Not found**: unknown id → **404**.

### `GET /api/appointments?date=YYYY-MM-DD`
- **Happy path**: valid date with bookings → **200** array in `startTime` order; each item includes client (with `phone`) and service.
- **Empty**: date with no bookings → **200** `[]`.
- **Validation failures**: malformed `date` (e.g. `2026-13-40` or `not-a-date`) → **400**.
- **Auth failures**: no token → **401**.

### `POST /api/appointments`
- **Happy path**: `{clientId,serviceId,date,startTime:"09:00"}` on a free slot → **201** with `status:"scheduled"`; appears in that day's `GET ?date=`.
- **Double-booking**: POST a second appointment at the same `date`+`startTime` while an active (status ≠ cancelled) appointment exists → **409** with message `"Time slot already booked"`; **no new row created** (day-view count unchanged).
- **Cancelled slot reuse**: if the only appointment at that slot is `cancelled`, a new POST at that slot → **201** (slot considered free).
- **Validation failures**: missing `clientId`/`serviceId`/`date`/`startTime` → **400**; `startTime` not on a 30-min increment or outside 08:00–18:00 → **400**.
- **Referential failures**: non-existent `clientId` or `serviceId` → **400/404**, no row created.
- **Auth failures**: no token → **401**.

### `PATCH /api/appointments/:id/status`
- **Happy path**: `{status:"completed"}` → **200**; reflected in day view and client history. Also verify `cancelled` and `no_show`.
- **Validation failures**: invalid status value (e.g. `"done"`) → **400**.
- **Not found**: unknown id → **404**.
- **Auth failures**: no token → **401**.

### `GET /api/appointments/today`
- **Happy path**: → **200** `{appointments:[...today in time order, with client phone], tomorrowCount:<int>}`. `tomorrowCount` equals number of appointments dated tomorrow.
- **Auth failures**: no token → **401**.

### `GET /api/revenue` — ADMIN only
- **Happy path (ADMIN)**: → **200** array `[{month:"YYYY-MM", totalCents, count}]` sorted by month **descending**. Only `completed` appointments contribute; `totalCents` equals the sum of joined `service.priceCents`.
- **Exclusion check**: scheduled/cancelled/no_show appointments do **not** contribute to any month's total or count.
- **Auth failures (role)**: USER token → **403**.
- **Auth failures**: no token → **401**.

### `GET /api/admin/settings` — ADMIN only
- **Happy path (ADMIN)**: → **200** list of service keys (`postgresql`, `minio`) with masked values and a configured/unconfigured status flag.
- **Auth failures (role)**: USER token → **403**.
- **Auth failures**: no token → **401**.

### `PATCH /api/admin/settings` — ADMIN only
- **Happy path (ADMIN)**: upsert `{postgresql:{...}}` key-value pairs → **200**; subsequent `GET` shows the key as configured.
- **Auth failures (role)**: USER token → **403**, no upsert.
- **Auth failures**: no token → **401**.

### `GET /api/health` — Public
- **Happy path**: no token required → **200** `{status:"ok"}`.

### `GET /api/health/deep` — Public
- **Happy path**: no token required → **200** with DB ping result (Prisma `SELECT 1` succeeds), status ok.
- **Degraded**: if DB is unreachable, returns a non-ok status (5xx or `{status:"error"}`) — documented expectation, not asserted in the happy-path suite.

---

## UI / journey tests

### Journey: Signup (first user becomes ADMIN)
- **Steps**: On an empty DB, visit `/signup` → enter name/email/password → submit.
- **Expected outcomes**: JWT stored in localStorage; redirected to `/today`; AppShell shows "BizBook"; Revenue + service-edit + admin-settings nav **visible** (ADMIN).
- **Negative path**: submit with blank required field → inline validation error, no navigation; duplicate email → server error surfaced inline.

### Journey: Signup (subsequent user becomes USER)
- **Steps**: With ≥1 user already present, visit `/signup` → submit valid form.
- **Expected outcomes**: logged in and redirected to `/today`; Revenue, service create/edit, and admin-settings nav **hidden**.

### Journey: Login / Logout
- **Steps**: Visit `/login` → enter seeded ADMIN creds → submit; then trigger logout.
- **Expected outcomes**: login stores JWT and lands on `/today`; logout clears JWT from localStorage and redirects to `/login`.
- **Negative path**: wrong password → inline "invalid credentials" error, remain on `/login`.

### Journey: Protected-route redirect & deep-linking
- **Steps**: While logged out, paste `/today` (and `/clients/:id`, `/appointments?date=...`) directly into the address bar.
- **Expected outcomes**: unauthenticated access redirects to `/login`. After login, pasting a fresh deep-link URL renders the correct view directly (every state deep-links).
- **Negative path**: USER pasting `/revenue` or `/admin/settings` is blocked by `RoleRoute` (redirect/403 view).

### Journey: Today dashboard
- **Steps**: Log in → land on `/today`.
- **Expected outcomes**: today's appointments listed in `startTime` order, each showing the client **phone**; a tomorrow count is displayed matching `tomorrowCount`.
- **Negative path**: no appointments today → empty state shown (not an error); API failure → error state.

### Journey: Clients list + search
- **Steps**: Navigate to `/clients` → observe seeded clients → type a name/phone fragment into search (`?q=`).
- **Expected outcomes**: list filters to matching clients; URL reflects `?q=`; clearing restores full list.
- **Negative path**: no matches → empty state; loading/error states render.

### Journey: Create client
- **Steps**: `/clients` → "New" → `/clients/new` → enter name + phone → submit.
- **Expected outcomes**: redirected to list (or detail); new client appears in `/clients`; `/clients/:id` page exists.
- **Negative path**: submit missing name or phone → inline validation error, no create.

### Journey: Client detail with history
- **Steps**: `/clients` → click a client → `/clients/:id`.
- **Expected outcomes**: shows contact info (name, phone, email) and appointment history (past + upcoming) with services, ordered by date/time.
- **Negative path**: unknown id → not-found/error view.

### Journey: Edit client
- **Steps**: `/clients/:id` → Edit → `/clients/:id/edit` → change a field → save.
- **Expected outcomes**: detail view reflects the updated value.
- **Negative path**: invalid input → inline error, no save.

### Journey: Services catalog (role-aware controls)
- **Steps**: Visit `/services` as ADMIN, then as USER.
- **Expected outcomes**: both roles see the service catalog. ADMIN sees create/edit controls; **USER sees no create/edit controls**.
- **Negative path**: USER cannot reach `/services/new` or `/services/:id/edit` (RoleRoute blocks).

### Journey: Create service (ADMIN)
- **Steps**: As ADMIN, `/services` → New → `/services/new` → enter "Haircut", 30 min, $25 → submit.
- **Expected outcomes**: service appears in `/services` and is **selectable in the booking picker**.
- **Negative path**: durationMin ≤ 0 or priceCents < 0 → inline validation error.

### Journey: Book appointment (incl. double-booking)
- **Steps**: `/appointments/new` → pick client, service, date, and a 30-min slot (08:00–18:00) → submit.
- **Expected outcomes**: appointment created with status `scheduled`; appears in `/appointments?date=` day view in time order.
- **Negative path**: booking an already-taken slot surfaces the inline **"Time slot already booked"** message; no duplicate row appears in the day view.

### Journey: Day view + status change
- **Steps**: `/appointments?date=YYYY-MM-DD` → view appointments → use status control to mark one `completed`.
- **Expected outcomes**: appointments listed in `startTime` order; after status change the new status reflects in the day view and in the client's appointment history.
- **Negative path**: date with no appointments → empty state; malformed/API error → error state.

### Journey: Revenue (ADMIN only)
- **Steps**: As ADMIN, visit `/revenue`.
- **Expected outcomes**: month-grouped totals shown (`YYYY-MM`), sorted descending; totals reflect only `completed` appointments' service prices.
- **Negative path**: USER cannot see the Revenue nav item and is blocked from `/revenue`.

### Journey: Admin settings (ADMIN only)
- **Steps**: As ADMIN, visit `/admin/settings`.
- **Expected outcomes**: lists `postgresql` and `minio` services each with a configured/unconfigured badge and a per-service credential form; a banner lists services needing credentials when placeholders present. Saving credentials marks the service configured.
- **Negative path**: USER cannot see the admin-settings nav item and is blocked from `/admin/settings`.

---

## Data integrity tests
- After `POST /api/appointments` succeeds, exactly one new `Appointment` row exists with `status = "scheduled"` and the given `clientId`, `serviceId`, `date`, `startTime`.
- After a **409 double-booking** rejection, the `Appointment` count for that `date`+`startTime` is unchanged (no partial insert; check+insert wrapped atomically).
- No two active (status ≠ `cancelled`) appointments share the same `(date, startTime)`.
- `User.email` is unique — a duplicate signup does not create a second user row.
- First-ever user has `role = "ADMIN"`; every subsequent user has `role = "USER"`.
- Passwords are stored only as bcrypt hashes (`passwordHash`), never plaintext.
- `PATCH /api/appointments/:id/status` changes only the `status` field; other fields unchanged.
- Revenue aggregation counts each `completed` appointment exactly once in exactly one `YYYY-MM` bucket (by appointment `date`); non-completed statuses contribute zero.
- Seed is idempotent: running the seed twice does not duplicate users/clients/services.
- Seed emits `SEED_CREDS_JSON={"admin":{...},"user":{...}}` to stdout on first run.

## Out of scope
- **MinIO / object storage behaviour**: the spec defines no file/upload feature, so `minio` in `/admin/settings` is treated as placeholder infra only; no upload/download flows are tested (spec is silent on any feature backing it).
- **Postgres runtime behaviour**: spec bundles SQLite as the DB; the `postgresql` settings key is placeholder infra surfaced via `/admin/settings` and is not exercised as the live datastore.
- **Third-party integrations**: spec lists integrations as "None"; no external API/SDK clients are tested.
- **Concurrency/race stress on double-booking**: single-instance demo; the service-layer check+insert is verified functionally, not under concurrent load (documented risk).
- **Container/Docker build & migration-on-start**: infra verification (multi-stage build, `prisma migrate deploy`) is outside functional test scope beyond confirming `/api/health` and `/api/health/deep` respond after start.
- **JWT expiry timing / token refresh**: only presence/validity of the token is asserted (401 on missing/invalid); expiry-window behaviour is not spec'd.
- **Pagination of clients/appointments**: spec does not define pagination; full-list responses assumed.
