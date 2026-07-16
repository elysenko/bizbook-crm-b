import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Appointment, AppointmentStatus } from '../../core/models';
import { formatMoney, prettyDate, shiftISO, toISODate, todayISO } from '../../core/date-util';

@Component({
  selector: 'app-day-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './day-view.component.html',
  styleUrl: './day-view.component.css',
})
export class DayViewComponent implements OnInit {
  readonly selectedDate = signal<string>(todayISO());
  readonly money = formatMoney;
  readonly prettyDate = prettyDate;
  readonly statusOptions: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled', 'no_show'];

  // Mock data — service_agent wires this signal to GET /api/appointments?date=.
  readonly appointments = signal<Appointment[]>([
    { id: 'a1', clientId: 'c1', clientName: 'Maya Chen', clientPhone: '(415) 555-0132', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: todayISO(), startTime: '09:00', status: 'scheduled' },
    { id: 'a2', clientId: 'c2', clientName: 'Liam Foster', clientPhone: '(415) 555-0177', serviceId: 's2', serviceName: 'Beard Trim', priceCents: 1500, date: todayISO(), startTime: '09:30', status: 'completed' },
    { id: 'a3', clientId: 'c3', clientName: 'Priya Nair', clientPhone: '(628) 555-0104', serviceId: 's3', serviceName: 'Color & Style', priceCents: 8500, date: todayISO(), startTime: '11:00', status: 'scheduled' },
    { id: 'a4', clientId: 'c4', clientName: 'Diego Alvarez', clientPhone: '(510) 555-0199', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: todayISO(), startTime: '13:30', status: 'scheduled' },
    { id: 'a5', clientId: 'c5', clientName: 'Sara Whitman', clientPhone: '(415) 555-0146', serviceId: 's4', serviceName: 'Deep Conditioning', priceCents: 4000, date: todayISO(), startTime: '15:00', status: 'no_show' },
    { id: 'a6', clientId: 'c2', clientName: 'Liam Foster', clientPhone: '(415) 555-0177', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: shiftISO(1), startTime: '10:00', status: 'scheduled' },
    { id: 'a7', clientId: 'c3', clientName: 'Priya Nair', clientPhone: '(628) 555-0104', serviceId: 's2', serviceName: 'Beard Trim', priceCents: 1500, date: shiftISO(1), startTime: '12:30', status: 'scheduled' },
    { id: 'a8', clientId: 'c1', clientName: 'Maya Chen', clientPhone: '(415) 555-0132', serviceId: 's3', serviceName: 'Color & Style', priceCents: 8500, date: shiftISO(1), startTime: '14:00', status: 'scheduled' },
    { id: 'a9', clientId: 'c4', clientName: 'Diego Alvarez', clientPhone: '(510) 555-0199', serviceId: 's4', serviceName: 'Deep Conditioning', priceCents: 4000, date: shiftISO(-1), startTime: '11:30', status: 'completed' },
    { id: 'a10', clientId: 'c5', clientName: 'Sara Whitman', clientPhone: '(415) 555-0146', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: shiftISO(-1), startTime: '16:00', status: 'cancelled' },
  ]);

  readonly dayList = computed(() =>
    this.appointments()
      .filter((a) => a.date === this.selectedDate())
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );

  readonly prettySelected = computed(() => prettyDate(this.selectedDate()));

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.selectedDate.set(this.route.snapshot.queryParamMap.get('date') ?? todayISO());
  }

  goToDate(iso: string): void {
    if (!iso) return;
    this.selectedDate.set(iso);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date: iso },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  shiftDay(days: number): void {
    const [y, m, d] = this.selectedDate().split('-').map(Number);
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + days);
    this.goToDate(toISODate(next));
  }

  setStatus(id: string, status: AppointmentStatus): void {
    this.appointments.update((list) =>
      list.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  }
}
