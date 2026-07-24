import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  TemarioClaseItem,
  TemarioClasePayload,
  TemarioClaseUpdatePayload,
  toImagenesClasePayload,
} from './temario.model';

export interface TemarioQuery {
  nivel?: string;
  grado?: string;
  seccion?: string;
  curso?: string;
  anioEscolar?: number;
}

@Injectable({ providedIn: 'root' })
export class TemarioDocenteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/temario/docente/clases`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  list(query: TemarioQuery): Observable<TemarioClaseItem[]> {
    this.loading.set(true);
    return this.http
      .get<TemarioClaseItem[]>(this.base, { params: this.toParams(query) })
      .pipe(
        catchError((err) => throwError(() => err)),
        finalize(() => this.loading.set(false)),
      );
  }

  create(payload: TemarioClasePayload): Observable<TemarioClaseItem> {
    this.saving.set(true);
    return this.http.post<TemarioClaseItem>(this.base, this.sanitizePayload(payload)).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  update(id: number, payload: TemarioClaseUpdatePayload): Observable<TemarioClaseItem> {
    this.saving.set(true);
    return this.http.patch<TemarioClaseItem>(`${this.base}/${id}`, this.sanitizePayload(payload)).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  remove(id: number): Observable<void> {
    this.saving.set(true);
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  private toParams(query: TemarioQuery): HttpParams {
    let params = new HttpParams();
    if (query.nivel) params = params.set('nivel', query.nivel);
    if (query.grado) params = params.set('grado', query.grado);
    if (query.seccion) params = params.set('seccion', query.seccion);
    if (query.curso) params = params.set('curso', query.curso);
    if (query.anioEscolar) params = params.set('anioEscolar', query.anioEscolar);
    return params;
  }

  private sanitizePayload<T extends TemarioClasePayload | TemarioClaseUpdatePayload>(payload: T): T {
    if (!payload.imagenesClase?.length) return payload;
    return {
      ...payload,
      imagenesClase: toImagenesClasePayload(payload.imagenesClase),
    };
  }
}
