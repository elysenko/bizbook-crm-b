import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  readonly error = signal('');
  readonly loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.value;
    this.error.set('');
    this.loading.set(true);
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/today']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.messageFrom(err) || 'Invalid credentials.');
      },
    });
  }

  demoLogin(): void {
    this.error.set('');
    this.loading.set(true);
    this.auth.demoLogin().subscribe({
      next: () => this.router.navigate(['/today']),
      error: () => {
        this.loading.set(false);
        this.error.set('Demo login unavailable — the API may not be seeded yet.');
      },
    });
  }

  private messageFrom(err: unknown): string {
    const msg = (err as { error?: { message?: string | string[] } })?.error?.message;
    return Array.isArray(msg) ? msg.join(', ') : (msg ?? '');
  }
}
