import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Service } from '../models';

/** REST client for the NestJS Services API (`/api/v1/services`). Create/update are ADMIN-only server-side. */
@Injectable({ providedIn: 'root' })
export class ServicesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/services`;

  list(): Observable<Service[]> {
    return this.http.get<Service[]>(this.base);
  }

  create(dto: { name: string; durationMin: number; priceCents: number }): Observable<Service> {
    return this.http.post<Service>(this.base, dto);
  }

  update(
    id: string,
    dto: Partial<{ name: string; durationMin: number; priceCents: number }>,
  ): Observable<Service> {
    return this.http.patch<Service>(`${this.base}/${id}`, dto);
  }
}
