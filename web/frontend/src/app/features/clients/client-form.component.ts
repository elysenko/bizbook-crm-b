import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientsApiService } from '../../core/services/clients-api.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.css',
})
export class ClientFormComponent implements OnInit {
  private readonly api = inject(ClientsApiService);

  readonly clientId = signal<string | null>(null);
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
      phone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      notes: [''],
    });
  }

  get isEdit(): boolean {
    return this.clientId() !== null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientId.set(id);
      // Edit mode — load the record from GET /api/v1/clients/:id.
      this.api.get(id).subscribe({
        next: (existing) =>
          this.form.patchValue({
            name: existing.name,
            phone: existing.phone,
            email: existing.email ?? '',
            notes: existing.notes ?? '',
          }),
        error: (err) => this.error.set(this.messageFrom(err) || 'Could not load client.'),
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
      phone: raw.phone,
      email: raw.email?.trim() ? raw.email.trim() : undefined,
      notes: raw.notes?.trim() ? raw.notes.trim() : undefined,
    };
    this.error.set('');
    this.saving.set(true);

    const id = this.clientId();
    const request$ = id ? this.api.update(id, dto) : this.api.create(dto);
    request$.subscribe({
      next: (client) => this.router.navigate(['/clients', client.id]),
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.messageFrom(err) || 'Could not save client.');
      },
    });
  }

  cancel(): void {
    if (this.isEdit) this.router.navigate(['/clients', this.clientId()]);
    else this.router.navigate(['/clients']);
  }

  private messageFrom(err: unknown): string {
    const msg = (err as { error?: { message?: string | string[] } })?.error?.message;
    return Array.isArray(msg) ? msg.join(', ') : (msg ?? '');
  }
}
