import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RevenueMonth } from '../models';

/** REST client for the NestJS Revenue API (`/api/v1/revenue`). ADMIN-only server-side. */
@Injectable({ providedIn: 'root' })
export class RevenueApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/revenue`;

  byMonth(): Observable<RevenueMonth[]> {
    return this.http.get<RevenueMonth[]>(this.base);
  }
}
