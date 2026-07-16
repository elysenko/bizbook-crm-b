import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import bcryptjs from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment variables');
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Known demo credentials (public by design for this demo).
const ADMIN = { name: 'Demo Owner', email: 'admin@bizbook.demo', password: 'admin1234' };
const STAFF = { name: 'Front Desk', email: 'staff@bizbook.demo', password: 'staff1234' };

/** UTC date-only helpers so seeded dates line up with the API's date matching. */
function dateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}
function shift(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function shiftMonth(months: number, day = 15): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + months, day));
  return d.toISOString().slice(0, 10);
}

async function seedUsers() {
  for (const [role, u] of [
    ['admin', ADMIN],
    ['user', STAFF],
  ] as const) {
    const password = bcryptjs.hashSync(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role, password },
      create: { name: u.name, email: u.email, role, password },
    });
  }
  console.log(
    'SEED_CREDS_JSON=' +
      JSON.stringify({
        admin: { email: ADMIN.email, password: ADMIN.password },
        user: { email: STAFF.email, password: STAFF.password },
      })
  );
}

async function seedDomain() {
  const existingClients = await prisma.client.count();
  if (existingClients > 0) {
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
  const clients = [];
  for (const c of clientsData) {
    clients.push(await prisma.client.create({ data: c }));
  }

  const servicesData = [
    { name: 'Haircut', durationMin: 30, priceCents: 2500 },
    { name: 'Beard Trim', durationMin: 15, priceCents: 1500 },
    { name: 'Color & Style', durationMin: 90, priceCents: 8500 },
    { name: 'Deep Conditioning', durationMin: 45, priceCents: 4000 },
  ];
  const services = [];
  for (const s of servicesData) {
    services.push(await prisma.service.create({ data: s }));
  }

  const yesterday = shift(-1);
  const today = shift(0);
  const tomorrow = shift(1);

  type Appt = {
    date: string;
    startTime: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    ci: number;
    si: number;
  };

  const appts: Appt[] = [
    // Yesterday — mostly completed (feeds revenue)
    { date: yesterday, startTime: '09:00', status: 'completed', ci: 0, si: 0 },
    { date: yesterday, startTime: '10:30', status: 'completed', ci: 1, si: 1 },
    { date: yesterday, startTime: '13:00', status: 'no_show', ci: 2, si: 2 },
    // Today — mixed statuses in distinct slots
    { date: today, startTime: '09:00', status: 'scheduled', ci: 0, si: 0 },
    { date: today, startTime: '09:30', status: 'completed', ci: 1, si: 1 },
    { date: today, startTime: '11:00', status: 'scheduled', ci: 2, si: 2 },
    { date: today, startTime: '13:30', status: 'cancelled', ci: 3, si: 0 },
    { date: today, startTime: '15:00', status: 'no_show', ci: 4, si: 3 },
    // Tomorrow — upcoming
    { date: tomorrow, startTime: '10:00', status: 'scheduled', ci: 2, si: 2 },
    { date: tomorrow, startTime: '14:00', status: 'scheduled', ci: 0, si: 0 },
    { date: tomorrow, startTime: '16:30', status: 'scheduled', ci: 3, si: 1 },
    // Prior months — completed, to make the revenue view multi-month
    { date: shiftMonth(-1, 12), startTime: '10:00', status: 'completed', ci: 0, si: 2 },
    { date: shiftMonth(-1, 20), startTime: '11:30', status: 'completed', ci: 3, si: 0 },
    { date: shiftMonth(-2, 8), startTime: '09:30', status: 'completed', ci: 4, si: 3 },
  ];

  for (const a of appts) {
    await prisma.appointment.create({
      data: {
        clientId: clients[a.ci].id,
        serviceId: services[a.si].id,
        date: dateOnly(a.date),
        startTime: a.startTime,
        status: a.status,
      },
    });
  }

  console.log(
    `Seed: created ${clients.length} clients, ${services.length} services, ${appts.length} appointments`
  );
}

async function main() {
  await seedUsers();
  await seedDomain();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
