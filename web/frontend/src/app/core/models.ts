export type Role = 'ADMIN' | 'USER';

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  priceCents: number;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM
  status: AppointmentStatus;
}

export interface RevenueMonth {
  month: string;       // YYYY-MM
  totalCents: number;
  count: number;
}

export interface AdminSetting {
  key: string;
  label: string;
  fields: { key: string; label: string; placeholder: string; value: string }[];
  configured: boolean;
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};
