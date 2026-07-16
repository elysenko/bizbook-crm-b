import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Appointment, Client } from '../../core/models';
import { formatMoney, prettyDate, todayISO } from '../../core/date-util';
import { ClientsApiService } from '../../core/services/clients-api.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.css',
})
export class ClientDetailComponent implements OnInit {
  private readonly api = inject(ClientsApiService);

  readonly clientId = signal<string>('');
  readonly today = todayISO();
  readonly money = formatMoney;
  readonly prettyDate = prettyDate;

  // Wired to GET /api/v1/clients/:id.
  private readonly clientData = signal<Client | null>(null);
  // Wired to GET /api/v1/clients/:id/appointments.
  readonly appointments = signal<Appointment[]>([]);

  readonly client = computed(() => this.clientData());
  readonly mine = computed(() =>
    [...this.appointments()].sort((a, b) =>
      (b.date + b.startTime).localeCompare(a.date + a.startTime),
    ),
  );
  readonly upcoming = computed(() => this.mine().filter((a) => a.date >= this.today));
  readonly past = computed(() => this.mine().filter((a) => a.date < this.today));

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.clientId.set(id);
    if (!id) return;

    this.api.get(id).subscribe({
      next: (client) => this.clientData.set(client),
      error: () => this.clientData.set(null),
    });
    this.api.appointments(id).subscribe({
      next: (appts) => this.appointments.set(appts),
      error: () => this.appointments.set([]),
    });
  }
}
