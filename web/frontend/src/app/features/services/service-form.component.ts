import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Service } from '../../core/models';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './service-form.component.html',
  styleUrl: './service-form.component.css',
})
export class ServiceFormComponent implements OnInit {
  readonly serviceId = signal<string | null>(null);
  form: FormGroup;

  // Mock lookup source for edit mode — service_agent replaces with GET /api/services.
  readonly services = signal<Service[]>([
    { id: 's1', name: 'Haircut', durationMin: 30, priceCents: 2500, createdAt: '2025-10-01' },
    { id: 's2', name: 'Beard Trim', durationMin: 20, priceCents: 1500, createdAt: '2025-10-01' },
    { id: 's3', name: 'Color & Style', durationMin: 90, priceCents: 8500, createdAt: '2025-10-05' },
    { id: 's4', name: 'Deep Conditioning', durationMin: 45, priceCents: 4000, createdAt: '2025-10-12' },
  ]);

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
      const existing = this.services().find((s) => s.id === id);
      if (existing) {
        this.form.patchValue({
          name: existing.name,
          durationMin: existing.durationMin,
          price: existing.priceCents / 100,
        });
      }
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Mockup: no persistence — navigate back to the catalog.
    this.router.navigate(['/services']);
  }
}
