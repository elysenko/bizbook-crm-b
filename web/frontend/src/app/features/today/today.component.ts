import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../core/models';
import { formatMoney, prettyDate, shiftISO, todayISO } from '../../core/date-util';
import { AppointmentsApiService } from '../../core/services/appointments-api.service';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './today.component.html',
  styleUrl: './today.component.css',
})
export class TodayComponent implements OnInit {
  private readonly api = inject(AppointmentsApiService);

  readonly today = todayISO();
  readonly tomorrow = shiftISO(1);
  readonly prettyToday = prettyDate(this.today);
  readonly money = formatMoney;

  // Wired to GET /api/v1/appointments/today.
  readonly appointments = signal<Appointment[]>([]);
  readonly tomorrowCount = signal<number>(0);

  readonly ordered = computed(() =>
    [...this.appointments()].sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );
  readonly scheduledCount = computed(() => this.appointments().filter((a) => a.status === 'scheduled').length);
  readonly completedCount = computed(() => this.appointments().filter((a) => a.status === 'completed').length);

  ngOnInit(): void {
    this.api.today().subscribe({
      next: (res) => {
        this.appointments.set(res.appointments ?? []);
        this.tomorrowCount.set(res.tomorrowCount ?? 0);
      },
      error: () => {
        this.appointments.set([]);
        this.tomorrowCount.set(0);
      },
    });
  }
}
