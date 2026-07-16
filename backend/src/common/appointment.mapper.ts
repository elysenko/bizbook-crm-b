/**
 * Flattens a Prisma Appointment (with client + service relations included)
 * into the shape the Angular frontend expects (see web/frontend core/models.ts):
 *   { id, clientId, clientName, clientPhone, serviceId, serviceName,
 *     priceCents, date: 'YYYY-MM-DD', startTime, status }
 */
export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface AppointmentWithRelations {
  id: string;
  date: Date;
  startTime: string;
  status: string;
  clientId: string;
  serviceId: string;
  client?: { name: string; phone: string } | null;
  service?: { name: string; priceCents: number } | null;
}

export function mapAppointment(a: AppointmentWithRelations) {
  return {
    id: a.id,
    clientId: a.clientId,
    clientName: a.client?.name ?? '',
    clientPhone: a.client?.phone ?? '',
    serviceId: a.serviceId,
    serviceName: a.service?.name ?? '',
    priceCents: a.service?.priceCents ?? 0,
    date: toDateOnly(a.date),
    startTime: a.startTime,
    status: a.status,
  };
}
