import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  AlertaFilters,
  AlertasResponse,
  AlertSettings,
} from './alertas.model';

@Injectable({ providedIn: 'root' })
export class AlertasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/attendances`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  loadAlerts(filters?: AlertaFilters): Observable<AlertasResponse> {
    this.loading.set(true);
    return this.http
      .get<AlertasResponse>(`${this.base}/alerts`, {
        params: this.buildParams(filters),
      })
      .pipe(
        catchError((err) => throwError(() => err)),
        finalize(() => this.loading.set(false)),
      );
  }

  getSettings(): Observable<AlertSettings> {
    return this.http.get<AlertSettings>(`${this.base}/alert-settings`);
  }

  updateSettings(payload: Partial<AlertSettings>): Observable<AlertSettings> {
    this.saving.set(true);
    return this.http
      .patch<AlertSettings>(`${this.base}/alert-settings`, payload)
      .pipe(
        catchError((err) => throwError(() => err)),
        finalize(() => this.saving.set(false)),
      );
  }

  private buildParams(filters?: AlertaFilters): HttpParams {
    let params = new HttpParams();
    if (filters?.nivel) params = params.set('nivel', filters.nivel);
    if (filters?.grado) params = params.set('grado', filters.grado);
    if (filters?.mes) params = params.set('mes', filters.mes);
    if (filters?.busqueda) params = params.set('busqueda', filters.busqueda);
    if (filters?.soloCriticos) params = params.set('soloCriticos', 'true');
    return params;
  }
}
