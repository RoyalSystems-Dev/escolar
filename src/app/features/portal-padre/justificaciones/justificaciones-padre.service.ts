import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '../../../core/auth/services/auth.service';
import {
  CreateJustificacionPayload,
  JustificacionItem,
  PendienteJustificacion,
} from '../../asistencia/justificaciones/justificaciones.model';

@Injectable({ providedIn: 'root' })
export class JustificacionesPadreService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/parents`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  loadPending(studentId: number, mes?: string): Observable<PendienteJustificacion[]> {
    this.loading.set(true);
    let params = new HttpParams().set('email', this.parentEmail());
    if (mes) params = params.set('mes', mes);

    return this.http
      .get<PendienteJustificacion[]>(
        `${this.base}/children/${studentId}/justifications/pending`,
        { params },
      )
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.loading.set(false)),
      );
  }

  loadHistorial(studentId: number, mes?: string): Observable<JustificacionItem[]> {
    this.loading.set(true);
    let params = new HttpParams().set('email', this.parentEmail());
    if (mes) params = params.set('mes', mes);

    return this.http
      .get<JustificacionItem[]>(
        `${this.base}/children/${studentId}/justifications`,
        { params },
      )
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.loading.set(false)),
      );
  }

  create(
    studentId: number,
    payload: Omit<CreateJustificacionPayload, 'studentId' | 'registradoPor'>,
  ): Observable<JustificacionItem> {
    this.saving.set(true);
    const params = new HttpParams().set('email', this.parentEmail());
    const form = new FormData();
    form.append('cantidad', String(payload.cantidad));
    form.append('motivo', payload.motivo);
    if (payload.observacion) form.append('observacion', payload.observacion);
    if (payload.mes) form.append('mes', payload.mes);
    if (payload.attendanceIds?.length) {
      form.append('attendanceIds', JSON.stringify(payload.attendanceIds));
    }
    for (const file of payload.adjuntos ?? []) {
      form.append('adjuntos', file, file.name);
    }

    return this.http
      .post<JustificacionItem>(
        `${this.base}/children/${studentId}/justifications`,
        form,
        { params },
      )
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  private parentEmail(): string {
    return this.auth.currentUser()?.email ?? '';
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
