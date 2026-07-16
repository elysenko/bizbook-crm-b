import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  signupForm: FormGroup;
  readonly error = signal('');
  readonly loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.signupForm = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm: ['', [Validators.required]],
      },
      { validators: [this.matchPasswords] },
    );
  }

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const p = group.get('password')?.value;
    const c = group.get('confirm')?.value;
    return p && c && p !== c ? { mismatch: true } : null;
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.signupForm.value;
    this.error.set('');
    this.loading.set(true);
    this.auth.signup(name, email, password).subscribe({
      next: () => this.router.navigate(['/today']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.messageFrom(err) || 'Could not create account.');
      },
    });
  }

  private messageFrom(err: unknown): string {
    const msg = (err as { error?: { message?: string | string[] } })?.error?.message;
    return Array.isArray(msg) ? msg.join(', ') : (msg ?? '');
  }
}
