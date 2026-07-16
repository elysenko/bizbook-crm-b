import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../core/models';
import { formatMoney, prettyDate, shiftISO, todayISO } from '../../core/date-util';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './today.component.html',
  styleUrl: './today.component.css',
})
export class TodayComponent {
  readonly today = todayISO();
  readonly tomorrow = shiftISO(1);
  readonly prettyToday = prettyDate(this.today);
  readonly money = formatMoney;

  // Mock data — service_agent wires this signal to GET /api/appointments/today.
  readonly appointments = signal<Appointment[]>([
    { id: 'a1', clientId: 'c1', clientName: 'Maya Chen', clientPhone: '(415) 555-0132', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: this.today, startTime: '09:00', status: 'scheduled' },
    { id: 'a2', clientId: 'c2', clientName: 'Liam Foster', clientPhone: '(415) 555-0177', serviceId: 's2', serviceName: 'Beard Trim', priceCents: 1500, date: this.today, startTime: '09:30', status: 'completed' },
    { id: 'a3', clientId: 'c3', clientName: 'Priya Nair', clientPhone: '(628) 555-0104', serviceId: 's3', serviceName: 'Color & Style', priceCents: 8500, date: this.today, startTime: '11:00', status: 'scheduled' },
    { id: 'a4', clientId: 'c4', clientName: 'Diego Alvarez', clientPhone: '(510) 555-0199', serviceId: 's1', serviceName: 'Haircut', priceCents: 2500, date: this.today, startTime: '13:30', status: 'scheduled' },
    { id: 'a5', clientId: 'c5', clientName: 'Sara Whitman', clientPhone: '(415) 555-0146', serviceId: 's4', serviceName: 'Deep Conditioning', priceCents: 4000, date: this.today, startTime: '15:00', status: 'no_show' },
  ]);

  // Tomorrow count — wired alongside the today list (response.tomorrowCount).
  readonly tomorrowCount = signal<number>(3);

  readonly ordered = computed(() =>
    [...this.appointments()].sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );
  readonly scheduledCount = computed(() => this.appointments().filter((a) => a.status === 'scheduled').length);
  readonly completedCount = computed(() => this.appointments().filter((a) => a.status === 'completed').length);
}
