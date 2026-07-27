import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CreateJustificacionPayload,
  JustificacionFilters,
  JustificacionItem,
  PendienteJustificacion,
} from './justificaciones.model';

@Injectable({ providedIn: 'root' })
export class JustificacionesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/attendances/justifications`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  loadPending(filters?: JustificacionFilters): Observable<PendienteJustificacion[]> {
    this.loading.set(true);
    return this.http
      .get<PendienteJustificacion[]>(`${this.base}/pending`, {
        params: this.buildParams(filters),
      })
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.loading.set(false)),
      );
  }

  loadHistorial(filters?: JustificacionFilters): Observable<JustificacionItem[]> {
    this.loading.set(true);
    return this.http
      .get<JustificacionItem[]>(this.base, { params: this.buildParams(filters) })
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.loading.set(false)),
      );
  }

  create(payload: CreateJustificacionPayload): Observable<JustificacionItem> {
    this.saving.set(true);
    const form = this.buildCreateForm(payload);
    return this.http.post<JustificacionItem>(this.base, form).pipe(
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.saving.set(false)),
    );
  }

  private buildCreateForm(payload: CreateJustificacionPayload): FormData {
    const form = new FormData();
    form.append('studentId', String(payload.studentId));
    form.append('cantidad', String(payload.cantidad));
    form.append('motivo', payload.motivo);
    if (payload.observacion) form.append('observacion', payload.observacion);
    if (payload.registradoPor) form.append('registradoPor', payload.registradoPor);
    if (payload.mes) form.append('mes', payload.mes);
    if (payload.attendanceIds?.length) {
      form.append('attendanceIds', JSON.stringify(payload.attendanceIds));
    }
    for (const file of payload.adjuntos ?? []) {
      form.append('adjuntos', file, file.name);
    }
    return form;
  }

  delete(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/${id}`).pipe(
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
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

  private buildParams(filters?: JustificacionFilters): HttpParams {
    let params = new HttpParams();
    if (filters?.nivel) params = params.set('nivel', filters.nivel);
    if (filters?.grado) params = params.set('grado', filters.grado);
    if (filters?.mes) params = params.set('mes', filters.mes);
    if (filters?.busqueda) params = params.set('busqueda', filters.busqueda);
    return params;
  }
}
