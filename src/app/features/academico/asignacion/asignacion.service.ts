import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  AsignacionContext,
  AsignacionDocente,
  CreateAsignacionPayload,
  UpdateAsignacionPayload,
} from './asignacion.model';

@Injectable({ providedIn: 'root' })
export class AsignacionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/curricula`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  loadContext(anio?: number): Observable<AsignacionContext> {
    this.loading.set(true);
    let params = new HttpParams();
    if (anio) params = params.set('anio', anio);
    return this.http
      .get<AsignacionContext>(`${this.base}/asignacion/context`, { params })
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.loading.set(false)),
      );
  }

  create(payload: CreateAsignacionPayload): Observable<AsignacionDocente> {
    this.saving.set(true);
    return this.http
      .post<AsignacionDocente>(`${this.base}/assignments`, payload)
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  update(id: number, payload: UpdateAsignacionPayload): Observable<AsignacionDocente> {
    this.saving.set(true);
    return this.http
      .patch<AsignacionDocente>(`${this.base}/assignments/${id}`, payload)
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  remove(id: number): Observable<{ ok: true }> {
    this.saving.set(true);
    return this.http
      .delete<{ ok: true }>(`${this.base}/assignments/${id}`)
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  private extractError(err: unknown): string {
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
