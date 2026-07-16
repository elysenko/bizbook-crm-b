import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Service } from '../../core/models';
import { formatMoney } from '../../core/date-util';
import { AuthService } from '../../core/services/auth.service';
import { ServicesApiService } from '../../core/services/services-api.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesComponent implements OnInit {
  private readonly api = inject(ServicesApiService);
  readonly money = formatMoney;

  // Wired to GET /api/v1/services.
  readonly services = signal<Service[]>([]);

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.api.list().subscribe({
      next: (services) => this.services.set(services),
      error: () => this.services.set([]),
    });
  }
}
