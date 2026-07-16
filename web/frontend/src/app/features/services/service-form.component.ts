import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServicesApiService } from '../../core/services/services-api.service';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './service-form.component.html',
  styleUrl: './service-form.component.css',
})
export class ServiceFormComponent implements OnInit {
  private readonly api = inject(ServicesApiService);

  readonly serviceId = signal<string | null>(null);
  readonly error = signal('');
  readonly saving = signal(false);
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      durationMin: [30, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
    });
  }

  get isEdit(): boolean {
    return this.serviceId() !== null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.serviceId.set(id);
      // The API exposes list-only reads for services; find the record in the catalog.
      this.api.list().subscribe({
        next: (services) => {
          const existing = services.find((s) => s.id === id);
          if (existing) {
            this.form.patchValue({
              name: existing.name,
              durationMin: existing.durationMin,
              price: existing.priceCents / 100,
            });
          } else {
            this.error.set('Service not found.');
          }
        },
        error: (err) => this.error.set(this.messageFrom(err) || 'Could not load service.'),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value;
    const dto = {
      name: raw.name,
      durationMin: Number(raw.durationMin),
      priceCents: Math.round(Number(raw.price) * 100),
    };
    this.error.set('');
    this.saving.set(true);

    const id = this.serviceId();
    const request$ = id ? this.api.update(id, dto) : this.api.create(dto);
    request$.subscribe({
      next: () => this.router.navigate(['/services']),
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.messageFrom(err) || 'Could not save service.');
      },
    });
  }

  private messageFrom(err: unknown): string {
    const msg = (err as { error?: { message?: string | string[] } })?.error?.message;
    return Array.isArray(msg) ? msg.join(', ') : (msg ?? '');
  }
}
