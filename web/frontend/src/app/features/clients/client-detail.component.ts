import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Appointment, Client } from '../../core/models';
import { formatMoney, prettyDate, shiftISO, todayISO } from '../../core/date-util';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.css',
})
export class ClientDetailComponent implements OnInit {
  readonly clientId = signal<string>('c1');
  readonly today = todayISO();
  readonly money = formatMoney;
  readonly prettyDate = prettyDate;

  // Mock data — service_agent wires to GET /api/clients/:id.
  readonly clients = signal<Client[]>([
    { id: 'c1', name: 'Maya Chen', phone: '(415) 555-0132', email: 'maya.chen@email.com', notes: 'Prefers morning slots.', createdAt: '2025-11-02' },
    { id: 'c2', name: 'Liam Foster', phone: '(415) 555-0177', email: 'liam.f@email.com', notes: '', createdAt: '2025-12-14' },
    { id: 'c3', name: 'Priya Nair', phone: '(628) 555-0104', email: 'priya.nair@email.com', notes: 'Allergic to certain dyes — patch test.', createdAt: '2026-01-08' },
    { id: 'c4', name: 'Diego Alvarez', phone: '(510) 555-0199', email: 'diego.a@email.com', notes: '', createdAt: '2026-02-19' },
    { id: 'c5', name: 'Sara Whitman', phone: '(415) 555-0146', email: 'sara.whitman@email.com', notes: 'Referred by Maya.', createdAt: '2026-03-03' },
  ]);

  // Mock data — service_agent wires to GET /api/clients/:id/appointments.
  readonly appointments = signal<Appointment[]>([
    { id: 'a10', clientId: 'c1', clientName: 'Maya Chen', clientPhone: '(415) 555-0132', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: this.today, startTime: '09:00', status: 'scheduled' },
    { id: 'a11', clientId: 'c1', clientName: 'Maya Chen', clientPhone: '(415) 555-0132', serviceId: 's3', serviceName: 'Color & Style', priceCents: 8500, date: shiftISO(7), startTime: '10:30', status: 'scheduled' },
    { id: 'a12', clientId: 'c1', clientName: 'Maya Chen', clientPhone: '(415) 555-0132', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: shiftISO(-21), startTime: '11:00', status: 'completed' },
    { id: 'a13', clientId: 'c1', clientName: 'Maya Chen', clientPhone: '(415) 555-0132', serviceId: 's2', serviceName: 'Beard Trim', priceCents: 1500, date: shiftISO(-49), startTime: '14:00', status: 'completed' },
    { id: 'a14', clientId: 'c1', clientName: 'Maya Chen', clientPhone: '(415) 555-0132', serviceId: 's4', serviceName: 'Deep Conditioning', priceCents: 4000, date: shiftISO(-63), startTime: '16:00', status: 'cancelled' },
    { id: 'a20', clientId: 'c2', clientName: 'Liam Foster', clientPhone: '(415) 555-0177', serviceId: 's2', serviceName: 'Beard Trim', priceCents: 1500, date: this.today, startTime: '09:30', status: 'completed' },
    { id: 'a21', clientId: 'c2', clientName: 'Liam Foster', clientPhone: '(415) 555-0177', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: shiftISO(-30), startTime: '13:00', status: 'completed' },
    { id: 'a30', clientId: 'c3', clientName: 'Priya Nair', clientPhone: '(628) 555-0104', serviceId: 's3', serviceName: 'Color & Style', priceCents: 8500, date: this.today, startTime: '11:00', status: 'scheduled' },
  ]);

  readonly client = computed(() => this.clients().find((c) => c.id === this.clientId()) ?? null);
  readonly mine = computed(() =>
    this.appointments()
      .filter((a) => a.clientId === this.clientId())
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)),
  );
  readonly upcoming = computed(() => this.mine().filter((a) => a.date >= this.today));
  readonly past = computed(() => this.mine().filter((a) => a.date < this.today));

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.clientId.set(this.route.snapshot.paramMap.get('id') ?? 'c1');
  }
}
