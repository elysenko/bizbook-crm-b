import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, AppointmentStatus } from '../models';

export interface TodayResponse {
  date: string;
  appointments: Appointment[];
  tomorrowCount: number;
}

/** REST client for the NestJS Appointments API (`/api/v1/appointments`). */
@Injectable({ providedIn: 'root' })
export class AppointmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/appointments`;

  today(): Observable<TodayResponse> {
    return this.http.get<TodayResponse>(`${this.base}/today`);
  }

  byDate(date: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.base, { params: { date } });
  }

  create(dto: {
    clientId: string;
    serviceId: string;
    date: string;
    startTime: string;
  }): Observable<Appointment> {
    return this.http.post<Appointment>(this.base, dto);
  }

  updateStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/${id}/status`, { status });
  }
}
