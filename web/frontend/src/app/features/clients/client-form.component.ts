import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Client } from '../../core/models';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.css',
})
export class ClientFormComponent implements OnInit {
  readonly clientId = signal<string | null>(null);
  form: FormGroup;

  // Mock lookup source for edit mode — service_agent replaces with GET /api/clients/:id.
  readonly clients = signal<Client[]>([
    { id: 'c1', name: 'Maya Chen', phone: '(415) 555-0132', email: 'maya.chen@email.com', notes: 'Prefers morning slots.', createdAt: '2025-11-02' },
    { id: 'c2', name: 'Liam Foster', phone: '(415) 555-0177', email: 'liam.f@email.com', notes: '', createdAt: '2025-12-14' },
    { id: 'c3', name: 'Priya Nair', phone: '(628) 555-0104', email: 'priya.nair@email.com', notes: 'Allergic to certain dyes — patch test.', createdAt: '2026-01-08' },
    { id: 'c4', name: 'Diego Alvarez', phone: '(510) 555-0199', email: 'diego.a@email.com', notes: '', createdAt: '2026-02-19' },
    { id: 'c5', name: 'Sara Whitman', phone: '(415) 555-0146', email: 'sara.whitman@email.com', notes: 'Referred by Maya.', createdAt: '2026-03-03' },
  ]);

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
      const existing = this.clients().find((c) => c.id === id);
      if (existing) {
        this.form.patchValue({
          name: existing.name,
          phone: existing.phone,
          email: existing.email ?? '',
          notes: existing.notes ?? '',
        });
      }
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Mockup: no persistence — navigate to reflect the created/updated record.
    if (this.isEdit) {
      this.router.navigate(['/clients', this.clientId()]);
    } else {
      this.router.navigate(['/clients']);
    }
  }

  cancel(): void {
    if (this.isEdit) this.router.navigate(['/clients', this.clientId()]);
    else this.router.navigate(['/clients']);
  }
}
