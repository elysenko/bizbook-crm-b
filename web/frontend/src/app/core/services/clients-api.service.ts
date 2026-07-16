import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, Client } from '../models';

/**
 * REST client for the NestJS Clients API (`/api/v1/clients`).
 * The JWT is attached by authInterceptor; 401s redirect to /login there.
 */
@Injectable({ providedIn: 'root' })
export class ClientsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clients`;

  list(q?: string): Observable<Client[]> {
    const options = q && q.trim() ? { params: { q: q.trim() } } : {};
    return this.http.get<Client[]>(this.base, options);
  }

  get(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.base}/${id}`);
  }

  create(dto: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.base, dto);
  }

  update(id: string, dto: Partial<Client>): Observable<Client> {
    return this.http.patch<Client>(`${this.base}/${id}`, dto);
  }

  appointments(id: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.base}/${id}/appointments`);
  }
}
