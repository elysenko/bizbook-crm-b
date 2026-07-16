import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Service } from '../../core/models';
import { formatMoney } from '../../core/date-util';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesComponent {
  readonly money = formatMoney;

  // Mock data — service_agent wires this signal to GET /api/services.
  readonly services = signal<Service[]>([
    { id: 's1', name: 'Haircut', durationMin: 30, priceCents: 2500, createdAt: '2025-10-01' },
    { id: 's2', name: 'Beard Trim', durationMin: 20, priceCents: 1500, createdAt: '2025-10-01' },
    { id: 's3', name: 'Color & Style', durationMin: 90, priceCents: 8500, createdAt: '2025-10-05' },
    { id: 's4', name: 'Deep Conditioning', durationMin: 45, priceCents: 4000, createdAt: '2025-10-12' },
  ]);

  constructor(public auth: AuthService) {}
}
