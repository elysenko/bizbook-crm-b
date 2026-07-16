'use strict';
/**
 * Production seed — runs with plain `node`, no TypeScript toolchain needed.
 * Dependencies: pg + bcryptjs (both in package.json "dependencies").
 * Usage:  node prisma/seed/seed.js
 * Called by: npx prisma db seed  (via package.json "prisma.seed" field)
 *
 * Seeds BizBook demo data: 1 ADMIN + 1 USER, 5 clients, 4 services,
 * and a spread of appointments across yesterday/today/tomorrow plus prior
 * months. Idempotent: users are upserted by email; domain data is created only
 * when the Client table is empty.
 */
const { Pool } = require('pg');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');

// Known demo credentials (public by design for this demo).
const ADMIN = { name: 'Demo Owner', email: 'admin@bizbook.demo', password: 'admin1234' };
const STAFF = { name: 'Front Desk', email: 'staff@bizbook.demo', password: 'staff1234' };

function dateOnly(iso) {
  return new Date(`${iso}T00:00:00.000Z`);
}
function shift(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function shiftMonth(months, day) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + months, day));
  return d.toISOString().slice(0, 10);
}

async function seedUsers(pool) {
  for (const [role, u] of [
    ['admin', ADMIN],
    ['user', STAFF],
  ]) {
    const hashed = bcrypt.hashSync(u.password, 10);
    await pool.query(
      `INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5::"Role", now(), now())
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, password = EXCLUDED.password,
             role = EXCLUDED.role, "updatedAt" = now()`,
      [randomUUID(), u.name, u.email, hashed, role]
    );
  }
  console.log(
    'SEED_CREDS_JSON=' +
      JSON.stringify({
        admin: { email: ADMIN.email, password: ADMIN.password },
        user: { email: STAFF.email, password: STAFF.password },
      })
  );
}

async function seedDomain(pool) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM "Client"');
  if (rows[0].n > 0) {
    console.log('Seed: domain data already present — skipping clients/services/appointments');
    return;
  }

  const clientsData = [
    { name: 'Maya Chen', phone: '(415) 555-0132', email: 'maya@example.com' },
    { name: 'Liam Foster', phone: '(415) 555-0177', email: 'liam@example.com' },
    { name: 'Priya Nair', phone: '(628) 555-0104', email: 'priya@example.com' },
    { name: 'Diego Alvarez', phone: '(510) 555-0199', email: 'diego@example.com' },
    { name: 'Sara Whitman', phone: '(415) 555-0146', email: 'sara@example.com' },
  ];
  const clientIds = [];
  for (const c of clientsData) {
    const id = randomUUID();
    clientIds.push(id);
    await pool.query(
      `INSERT INTO "Client" (id, name, phone, email, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, now(), now())`,
      [id, c.name, c.phone, c.email]
    );
  }

  const servicesData = [
    { name: 'Haircut', durationMin: 30, priceCents: 2500 },
    { name: 'Beard Trim', durationMin: 15, priceCents: 1500 },
    { name: 'Color & Style', durationMin: 90, priceCents: 8500 },
    { name: 'Deep Conditioning', durationMin: 45, priceCents: 4000 },
  ];
  const serviceIds = [];
  for (const s of servicesData) {
    const id = randomUUID();
    serviceIds.push(id);
    await pool.query(
      `INSERT INTO "Service" (id, name, "durationMin", "priceCents", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, now(), now())`,
      [id, s.name, s.durationMin, s.priceCents]
    );
  }

  const yesterday = shift(-1);
  const today = shift(0);
  const tomorrow = shift(1);

  const appts = [
    { date: yesterday, startTime: '09:00', status: 'completed', ci: 0, si: 0 },
    { date: yesterday, startTime: '10:30', status: 'completed', ci: 1, si: 1 },
    { date: yesterday, startTime: '13:00', status: 'no_show', ci: 2, si: 2 },
    { date: today, startTime: '09:00', status: 'scheduled', ci: 0, si: 0 },
    { date: today, startTime: '09:30', status: 'completed', ci: 1, si: 1 },
    { date: today, startTime: '11:00', status: 'scheduled', ci: 2, si: 2 },
    { date: today, startTime: '13:30', status: 'cancelled', ci: 3, si: 0 },
    { date: today, startTime: '15:00', status: 'no_show', ci: 4, si: 3 },
    { date: tomorrow, startTime: '10:00', status: 'scheduled', ci: 2, si: 2 },
    { date: tomorrow, startTime: '14:00', status: 'scheduled', ci: 0, si: 0 },
    { date: tomorrow, startTime: '16:30', status: 'scheduled', ci: 3, si: 1 },
    { date: shiftMonth(-1, 12), startTime: '10:00', status: 'completed', ci: 0, si: 2 },
    { date: shiftMonth(-1, 20), startTime: '11:30', status: 'completed', ci: 3, si: 0 },
    { date: shiftMonth(-2, 8), startTime: '09:30', status: 'completed', ci: 4, si: 3 },
  ];

  for (const a of appts) {
    await pool.query(
      `INSERT INTO "Appointment"
         (id, date, "startTime", status, "clientId", "serviceId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4::"AppointmentStatus", $5, $6, now(), now())`,
      [randomUUID(), dateOnly(a.date), a.startTime, a.status, clientIds[a.ci], serviceIds[a.si]]
    );
  }

  console.log(
    `Seed: created ${clientIds.length} clients, ${serviceIds.length} services, ${appts.length} appointments`
  );
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await seedUsers(pool);
    await seedDomain(pool);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
