import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  DailyRegisterCalendarResponse,
  DailyRegisterFilters,
  DailyRegisterResponse,
  SaveDailyRegisterPayload,
  SaveDailyRegisterResult,
} from '../models/asistencia-registro.model';

@Injectable({ providedIn: 'root' })
export class AsistenciaRegistroService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/attendances/daily-register`;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly calendarLoading = signal(false);

  load(filters: DailyRegisterFilters): Observable<DailyRegisterResponse> {
    this.loading.set(true);
    const params = new HttpParams()
      .set('nivel', filters.nivel)
      .set('grado', filters.grado)
      .set('seccion', filters.seccion)
      .set('fecha', filters.fecha);

    return this.http.get<DailyRegisterResponse>(this.base, { params }).pipe(
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.loading.set(false)),
    );
  }

  loadCalendar(
    filters: DailyRegisterFilters,
    mes: string,
  ): Observable<DailyRegisterCalendarResponse> {
    this.calendarLoading.set(true);
    const params = new HttpParams()
      .set('nivel', filters.nivel)
      .set('grado', filters.grado)
      .set('seccion', filters.seccion)
      .set('mes', mes)
      .set('fecha', filters.fecha);

    return this.http
      .get<DailyRegisterCalendarResponse>(`${this.base}/calendar`, { params })
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.calendarLoading.set(false)),
      );
  }

  save(payload: SaveDailyRegisterPayload): Observable<SaveDailyRegisterResult> {
    this.saving.set(true);
    return this.http.post<SaveDailyRegisterResult>(this.base, payload).pipe(
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.saving.set(false)),
    );
  }

  private extractError(err: unknown): string {
    if (err && typeof err === 'object') {
      const payload = err as { userMessage?: string; error?: { message?: unknown }; message?: string };
      if (typeof payload.userMessage === 'string') return payload.userMessage;
      const msg = payload.error?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
      if (typeof payload.message === 'string' && payload.message) return payload.message;
    }
    if (err instanceof HttpErrorResponse) {
      const msg = err.error?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
      return err.message || 'Error de servidor';
    }
    if (err instanceof Error) return err.message;
    return 'Error desconocido';
  }
}
