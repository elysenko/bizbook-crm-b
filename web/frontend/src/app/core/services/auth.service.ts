import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Role, User } from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Mockup auth service. Persists a JWT-ish token + user profile in localStorage and
 * exposes reactive role state so the shell can render role-aware navigation.
 * The service_agent stage rewires login/signup/logout to /api/auth/* — the shape
 * (token in localStorage, user signal, role computed) is kept stable for that wiring.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(this.readUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  constructor(private router: Router) {}

  /** Mock login. Role is inferred from the email so reviewers can preview both roles. */
  login(email: string, _password: string): void {
    const role: Role = /staff|user\b/i.test(email) ? 'USER' : 'ADMIN';
    const name = this.nameFromEmail(email);
    this.setSession({ id: 'u_' + role.toLowerCase(), name, email, role }, 'mock.jwt.token');
    this.router.navigate(['/today']);
  }

  /** Mock signup. First-signup-is-admin is a backend rule; the mockup grants ADMIN. */
  signup(name: string, email: string, _password: string): void {
    this.setSession({ id: 'u_new', name, email, role: 'ADMIN' }, 'mock.jwt.token');
    this.router.navigate(['/today']);
  }

  /** Demo bypass — logs in as a fully-privileged ADMIN so every screen is reviewable. */
  demoLogin(): void {
    this.setSession(
      { id: 'u_demo', name: 'Demo Owner', email: 'owner@bizbook.demo', role: 'ADMIN' },
      'demo.jwt.token',
    );
    this.router.navigate(['/today']);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('access_token');
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(user: User, token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('access_token', token);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private readUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private nameFromEmail(email: string): string {
    const local = (email.split('@')[0] || 'Member').replace(/[._-]+/g, ' ');
    return local.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
