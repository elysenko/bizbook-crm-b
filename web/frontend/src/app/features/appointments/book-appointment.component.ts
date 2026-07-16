import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Appointment, Client, Service } from '../../core/models';
import { businessSlots, formatMoney, prettyDate, todayISO } from '../../core/date-util';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.css',
})
export class BookAppointmentComponent implements OnInit {
  readonly slots = businessSlots();
  readonly money = formatMoney;
  readonly prettyDate = prettyDate;

  // Form state
  readonly clientId = signal('');
  readonly serviceId = signal('');
  readonly date = signal<string>(todayISO());
  readonly startTime = signal('');

  readonly error = signal('');
  readonly success = signal(false);

  // Mock data — service_agent wires these to GET /api/clients and GET /api/services.
  readonly clients = signal<Client[]>([
    { id: 'c1', name: 'Maya Chen', phone: '(415) 555-0132', createdAt: '2025-11-02' },
    { id: 'c2', name: 'Liam Foster', phone: '(415) 555-0177', createdAt: '2025-12-14' },
    { id: 'c3', name: 'Priya Nair', phone: '(628) 555-0104', createdAt: '2026-01-08' },
    { id: 'c4', name: 'Diego Alvarez', phone: '(510) 555-0199', createdAt: '2026-02-19' },
    { id: 'c5', name: 'Sara Whitman', phone: '(415) 555-0146', createdAt: '2026-03-03' },
  ]);

  readonly services = signal<Service[]>([
    { id: 's1', name: 'Haircut', durationMin: 30, priceCents: 2500, createdAt: '2025-10-01' },
    { id: 's2', name: 'Beard Trim', durationMin: 20, priceCents: 1500, createdAt: '2025-10-01' },
    { id: 's3', name: 'Color & Style', durationMin: 90, priceCents: 8500, createdAt: '2025-10-05' },
    { id: 's4', name: 'Deep Conditioning', durationMin: 45, priceCents: 4000, createdAt: '2025-10-12' },
  ]);

  // Existing bookings used to compute taken slots (active = status !== cancelled).
  readonly appointments = signal<Appointment[]>([
    { id: 'a1', clientId: 'c1', clientName: 'Maya Chen', clientPhone: '(415) 555-0132', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: todayISO(), startTime: '09:00', status: 'scheduled' },
    { id: 'a2', clientId: 'c2', clientName: 'Liam Foster', clientPhone: '(415) 555-0177', serviceId: 's2', serviceName: 'Beard Trim', priceCents: 1500, date: todayISO(), startTime: '09:30', status: 'completed' },
    { id: 'a3', clientId: 'c3', clientName: 'Priya Nair', clientPhone: '(628) 555-0104', serviceId: 's3', serviceName: 'Color & Style', priceCents: 8500, date: todayISO(), startTime: '11:00', status: 'scheduled' },
    { id: 'a4', clientId: 'c4', clientName: 'Diego Alvarez', clientPhone: '(510) 555-0199', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: todayISO(), startTime: '13:30', status: 'scheduled' },
  ]);

  readonly takenSlots = computed(() => {
    const d = this.date();
    return new Set(
      this.appointments()
        .filter((a) => a.date === d && a.status !== 'cancelled')
        .map((a) => a.startTime),
    );
  });

  readonly canSubmit = computed(
    () => !!this.clientId() && !!this.serviceId() && !!this.date() && !!this.startTime(),
  );

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('clientId')) this.clientId.set(qp.get('clientId')!);
    if (qp.get('date')) this.date.set(qp.get('date')!);
  }

  onDateChange(value: string): void {
    this.date.set(value);
    this.startTime.set('');
    this.error.set('');
  }

  selectSlot(slot: string): void {
    if (this.takenSlots().has(slot)) {
      // Demonstrates the 409 the backend returns for an already-booked slot.
      this.startTime.set('');
      this.error.set(`Time slot already booked — ${slot} on ${this.prettyDate(this.date())} is taken.`);
      return;
    }
    this.startTime.set(slot);
    this.error.set('');
  }

  book(): void {
    this.error.set('');
    if (!this.canSubmit()) {
      this.error.set('Please choose a client, service, date and time slot.');
      return;
    }
    if (this.takenSlots().has(this.startTime())) {
      this.error.set('Time slot already booked');
      return;
    }
    this.success.set(true);
    setTimeout(() => this.router.navigate(['/appointments'], { queryParams: { date: this.date() } }), 900);
  }
}
