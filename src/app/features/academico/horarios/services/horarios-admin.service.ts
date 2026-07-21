import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CreateHorarioBlockPayload,
  EntradaHorario,
  HorarioContext,
  ResolveConflictsPayload,
  UpdateHorarioBlockPayload,
} from '../models/horarios-admin.model';

@Injectable({ providedIn: 'root' })
export class HorariosAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/horarios`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  loadContext(anio?: number): Observable<HorarioContext> {
    this.loading.set(true);
    const params = new HttpParams().set(
      'anioEscolar',
      String(anio ?? new Date().getFullYear()),
    );
    return this.http
      .get<HorarioContext>(`${this.base}/context`, { params })
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.loading.set(false)),
      );
  }

  create(payload: CreateHorarioBlockPayload): Observable<EntradaHorario> {
    this.saving.set(true);
    return this.http
      .post<EntradaHorario>(`${this.base}/blocks`, payload)
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  update(id: number, payload: UpdateHorarioBlockPayload): Observable<EntradaHorario> {
    this.saving.set(true);
    return this.http
      .patch<EntradaHorario>(`${this.base}/blocks/${id}`, payload)
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  remove(id: number): Observable<{ ok: true }> {
    this.saving.set(true);
    return this.http
      .delete<{ ok: true }>(`${this.base}/blocks/${id}`)
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  resolveConflicts(payload: ResolveConflictsPayload): Observable<{
    removed: number;
    blocks: EntradaHorario[];
  }> {
    this.saving.set(true);
    return this.http
      .post<{ removed: number; blocks: EntradaHorario[] }>(
        `${this.base}/conflicts/resolve`,
        payload,
      )
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
