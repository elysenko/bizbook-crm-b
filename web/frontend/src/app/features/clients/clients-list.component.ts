import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Client } from '../../core/models';
import { ClientsApiService } from '../../core/services/clients-api.service';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css',
})
export class ClientsListComponent implements OnInit {
  private readonly api = inject(ClientsApiService);

  readonly query = signal('');

  // Wired to GET /api/v1/clients. The search box filters the loaded set client-side.
  readonly clients = signal<Client[]>([]);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.clients();
    return this.clients().filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')),
    );
  });

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.query.set(this.route.snapshot.queryParamMap.get('q') ?? '');
    this.api.list().subscribe({
      next: (clients) => this.clients.set(clients),
      error: () => this.clients.set([]),
    });
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
