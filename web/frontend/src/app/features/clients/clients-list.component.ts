import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Client } from '../../core/models';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css',
})
export class ClientsListComponent implements OnInit {
  readonly query = signal('');

  // Mock data — service_agent wires this signal to GET /api/clients?q=.
  readonly clients = signal<Client[]>([
    { id: 'c1', name: 'Maya Chen', phone: '(415) 555-0132', email: 'maya.chen@email.com', notes: 'Prefers morning slots.', createdAt: '2025-11-02' },
    { id: 'c2', name: 'Liam Foster', phone: '(415) 555-0177', email: 'liam.f@email.com', notes: '', createdAt: '2025-12-14' },
    { id: 'c3', name: 'Priya Nair', phone: '(628) 555-0104', email: 'priya.nair@email.com', notes: 'Allergic to certain dyes — patch test.', createdAt: '2026-01-08' },
    { id: 'c4', name: 'Diego Alvarez', phone: '(510) 555-0199', email: 'diego.a@email.com', notes: '', createdAt: '2026-02-19' },
    { id: 'c5', name: 'Sara Whitman', phone: '(415) 555-0146', email: 'sara.whitman@email.com', notes: 'Referred by Maya.', createdAt: '2026-03-03' },
  ]);

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
