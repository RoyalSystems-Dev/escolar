import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Concepto,
  ConceptoApi,
  CreateConceptoPayload,
  UpdateConceptoPayload,
  mapConceptoFromApi,
  mapPeriodicidadToApi,
} from './conceptos.model';

@Injectable({ providedIn: 'root' })
export class ConceptosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/treasury/concepts`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  list(): Observable<Concepto[]> {
    this.loading.set(true);
    return this.http.get<ConceptoApi[]>(this.base).pipe(
      map((rows) => rows.map(mapConceptoFromApi)),
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.loading.set(false)),
    );
  }

  create(payload: CreateConceptoPayload): Observable<Concepto> {
    this.saving.set(true);
    return this.http
      .post<ConceptoApi>(this.base, {
        ...payload,
        periodicidad: mapPeriodicidadToApi(payload.periodicidad),
      })
      .pipe(
        map(mapConceptoFromApi),
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  update(id: number, payload: UpdateConceptoPayload): Observable<Concepto> {
    this.saving.set(true);
    const body: Record<string, unknown> = { ...payload };
    if (payload.periodicidad) {
      body['periodicidad'] = mapPeriodicidadToApi(payload.periodicidad);
    }
    return this.http.patch<ConceptoApi>(`${this.base}/${id}`, body).pipe(
      map(mapConceptoFromApi),
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.saving.set(false)),
    );
  }

  setActivo(id: number, activo: boolean): Observable<Concepto> {
    this.saving.set(true);
    return this.http.patch<ConceptoApi>(`${this.base}/${id}/activo`, { activo }).pipe(
      map(mapConceptoFromApi),
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.saving.set(false)),
    );
  }

  remove(id: number): Observable<{ deleted: boolean; id: number }> {
    this.saving.set(true);
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/${id}`).pipe(
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.saving.set(false)),
    );
  }

  private extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'userMessage' in err) {
      const msg = (err as { userMessage?: string }).userMessage;
      if (msg) return msg;
    }
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string | string[] } | null;
      if (Array.isArray(body?.message)) return body.message.join(', ');
      if (typeof body?.message === 'string') return body.message;
      return err.message || 'Error de servidor';
    }
    if (err instanceof Error) return err.message;
    return 'Error inesperado';
  }
}
