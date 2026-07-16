import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevenueMonth } from '../../core/models';
import { formatMoney, prettyMonth } from '../../core/date-util';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.css',
})
export class RevenueComponent {
  readonly money = formatMoney;
  readonly prettyMonth = prettyMonth;

  // Mock data — service_agent wires this signal to GET /api/revenue (sorted desc).
  readonly months = signal<RevenueMonth[]>([
    { month: '2026-07', totalCents: 142500, count: 34 },
    { month: '2026-06', totalCents: 189000, count: 47 },
    { month: '2026-05', totalCents: 165500, count: 41 },
    { month: '2026-04', totalCents: 121000, count: 29 },
    { month: '2026-03', totalCents: 98500, count: 24 },
  ]);

  readonly totalCents = computed(() => this.months().reduce((sum, m) => sum + m.totalCents, 0));
  readonly totalCount = computed(() => this.months().reduce((sum, m) => sum + m.count, 0));
  readonly max = computed(() => Math.max(1, ...this.months().map((m) => m.totalCents)));

  barWidth(cents: number): string {
    return Math.round((cents / this.max()) * 100) + '%';
  }
}
