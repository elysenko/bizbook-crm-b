import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Appointment, Client, Service } from '../../core/models';
import { businessSlots, formatMoney, prettyDate, todayISO } from '../../core/date-util';
import { ClientsApiService } from '../../core/services/clients-api.service';
import { ServicesApiService } from '../../core/services/services-api.service';
import { AppointmentsApiService } from '../../core/services/appointments-api.service';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.css',
})
export class BookAppointmentComponent implements OnInit {
  private readonly clientsApi = inject(ClientsApiService);
  private readonly servicesApi = inject(ServicesApiService);
  private readonly appointmentsApi = inject(AppointmentsApiService);

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
  readonly submitting = signal(false);

  // Wired to GET /api/v1/clients and GET /api/v1/services.
  readonly clients = signal<Client[]>([]);
  readonly services = signal<Service[]>([]);

  // Existing bookings for the selected date — used to compute taken slots
  // (active = status !== cancelled), mirroring the backend double-booking rule.
  readonly appointments = signal<Appointment[]>([]);

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

    this.clientsApi.list().subscribe({
      next: (clients) => this.clients.set(clients),
      error: () => this.clients.set([]),
    });
    this.servicesApi.list().subscribe({
      next: (services) => this.services.set(services),
      error: () => this.services.set([]),
    });
    this.loadDay();
  }

  private loadDay(): void {
    this.appointmentsApi.byDate(this.date()).subscribe({
      next: (appts) => this.appointments.set(appts),
      error: () => this.appointments.set([]),
    });
  }

  onDateChange(value: string): void {
    this.date.set(value);
    this.startTime.set('');
    this.error.set('');
    this.loadDay();
  }

  selectSlot(slot: string): void {
    if (this.takenSlots().has(slot)) {
      // The backend returns 409 for an already-booked slot; surface it up-front.
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

    this.submitting.set(true);
    this.appointmentsApi
      .create({
        clientId: this.clientId(),
        serviceId: this.serviceId(),
        date: this.date(),
        startTime: this.startTime(),
      })
      .subscribe({
        next: () => {
          this.success.set(true);
          setTimeout(
            () => this.router.navigate(['/appointments'], { queryParams: { date: this.date() } }),
            900,
          );
        },
        error: (err) => {
          this.submitting.set(false);
          // 409 → "Time slot already booked"; refresh the day so the slot shows as taken.
          this.error.set(this.messageFrom(err) || 'Could not book appointment.');
          this.loadDay();
        },
      });
  }

  private messageFrom(err: unknown): string {
    const msg = (err as { error?: { message?: string | string[] } })?.error?.message;
    return Array.isArray(msg) ? msg.join(', ') : (msg ?? '');
  }
}
