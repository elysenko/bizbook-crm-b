import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminSetting } from '../models';

/** REST client for the NestJS Admin Settings API (`/api/v1/admin/settings`). ADMIN-only server-side. */
@Injectable({ providedIn: 'root' })
export class AdminSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/settings`;

  list(): Observable<AdminSetting[]> {
    return this.http.get<AdminSetting[]>(this.base);
  }

  update(body: Record<string, string>): Observable<AdminSetting[]> {
    return this.http.patch<AdminSetting[]>(this.base, body);
  }
}
