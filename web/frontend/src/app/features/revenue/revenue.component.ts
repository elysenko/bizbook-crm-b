import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevenueMonth } from '../../core/models';
import { formatMoney, prettyMonth } from '../../core/date-util';
import { RevenueApiService } from '../../core/services/revenue-api.service';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.css',
})
export class RevenueComponent implements OnInit {
  private readonly api = inject(RevenueApiService);
  readonly money = formatMoney;
  readonly prettyMonth = prettyMonth;

  // Wired to GET /api/v1/revenue (sorted desc).
  readonly months = signal<RevenueMonth[]>([]);

  readonly totalCents = computed(() => this.months().reduce((sum, m) => sum + m.totalCents, 0));
  readonly totalCount = computed(() => this.months().reduce((sum, m) => sum + m.count, 0));
  readonly max = computed(() => Math.max(1, ...this.months().map((m) => m.totalCents)));

  ngOnInit(): void {
    this.api.byMonth().subscribe({
      next: (months) => this.months.set(months),
      error: () => this.months.set([]),
    });
  }

  barWidth(cents: number): string {
    return Math.round((cents / this.max()) * 100) + '%';
  }
}
