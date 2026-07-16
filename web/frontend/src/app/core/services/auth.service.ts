import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, User } from '../models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Auth service wired to the NestJS auth API (`/api/v1/auth/*`). Persists the JWT +
 * user profile in localStorage and exposes reactive role state so the shell can
 * render role-aware navigation. Token is attached to API calls by authInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly _user = signal<User | null>(this.readUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  constructor(private router: Router) {}

  /** Login against POST /api/v1/auth/login. Persists session on success. */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.setSession(res.user, res.token)));
  }

  /**
   * Signup against POST /api/v1/auth/signup. The first account created in the
   * system becomes ADMIN; subsequent public signups become USER (server rule).
   */
  signup(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/signup`, { name, email, password })
      .pipe(tap((res) => this.setSession(res.user, res.token)));
  }

  /** Demo bypass — logs in with the seeded ADMIN owner credentials. */
  demoLogin(): Observable<AuthResponse> {
    return this.login('admin@bizbook.demo', 'admin1234');
  }

  /** Refresh the cached profile from GET /api/v1/auth/me (validates the token). */
  refreshMe(): void {
    this.http.get<User>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (user) => this.setUser(user),
      error: () => {
        /* interceptor handles 401 → /login */
      },
    });
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
    this.setUser(user);
  }

  private setUser(user: User): void {
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
}
