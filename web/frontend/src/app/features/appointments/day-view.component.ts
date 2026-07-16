import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Appointment, AppointmentStatus } from '../../core/models';
import { formatMoney, prettyDate, toISODate, todayISO } from '../../core/date-util';
import { AppointmentsApiService } from '../../core/services/appointments-api.service';

@Component({
  selector: 'app-day-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './day-view.component.html',
  styleUrl: './day-view.component.css',
})
export class DayViewComponent implements OnInit {
  private readonly api = inject(AppointmentsApiService);

  readonly selectedDate = signal<string>(todayISO());
  readonly money = formatMoney;
  readonly prettyDate = prettyDate;
  readonly statusOptions: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled', 'no_show'];

  // Wired to GET /api/v1/appointments?date=. Holds the selected day's appointments.
  readonly appointments = signal<Appointment[]>([]);

  readonly dayList = computed(() =>
    [...this.appointments()].sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );

  readonly prettySelected = computed(() => prettyDate(this.selectedDate()));

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.selectedDate.set(this.route.snapshot.queryParamMap.get('date') ?? todayISO());
    this.load();
  }

  private load(): void {
    this.api.byDate(this.selectedDate()).subscribe({
      next: (appts) => this.appointments.set(appts),
      error: () => this.appointments.set([]),
    });
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
    this.load();
  }

  shiftDay(days: number): void {
    const [y, m, d] = this.selectedDate().split('-').map(Number);
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + days);
    this.goToDate(toISODate(next));
  }

  setStatus(id: string, status: AppointmentStatus): void {
    this.api.updateStatus(id, status).subscribe({
      next: (updated) =>
        this.appointments.update((list) =>
          list.map((a) => (a.id === id ? updated : a)),
        ),
      error: () => this.load(),
    });
  }
}
