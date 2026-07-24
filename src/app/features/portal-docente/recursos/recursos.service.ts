import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResource } from '../../../core/api/api.models';
import { RecursoFilters, RecursoPayload, RecursoUpdatePayload, RecursoUploadResponse } from './recursos.model';

@Injectable({ providedIn: 'root' })
export class RecursosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/resources`;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);

  load(filters?: RecursoFilters): Observable<ApiResource[]> {
    this.loading.set(true);
    let params = new HttpParams();
    if (filters?.curso) params = params.set('curso', filters.curso);
    if (filters?.tipo) params = params.set('tipo', filters.tipo);
    if (filters?.docente) params = params.set('docente', filters.docente);
    if (filters?.nivel) params = params.set('nivel', filters.nivel);
    if (filters?.grado) params = params.set('grado', filters.grado);
    if (filters?.seccion) params = params.set('seccion', filters.seccion);

    return this.http.get<ApiResource[]>(this.base, { params }).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loading.set(false)),
    );
  }

  upload(
    file: File,
    meta: { tipo: string; nivel: string; grado: string; seccion: string },
  ): Observable<RecursoUploadResponse> {
    this.uploading.set(true);
    const form = new FormData();
    form.append('file', file);
    form.append('tipo', meta.tipo);
    form.append('nivel', meta.nivel);
    form.append('grado', meta.grado);
    form.append('seccion', meta.seccion);

    return this.http.post<RecursoUploadResponse>(`${this.base}/upload`, form).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.uploading.set(false)),
    );
  }

  create(payload: RecursoPayload): Observable<ApiResource> {
    this.saving.set(true);
    return this.http.post<ApiResource>(this.base, payload).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  update(id: number, payload: RecursoUpdatePayload): Observable<ApiResource> {
    this.saving.set(true);
    return this.http.patch<ApiResource>(`${this.base}/${id}`, payload).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  setVisibility(id: number, visible: boolean): Observable<ApiResource> {
    this.saving.set(true);
    return this.http.patch<ApiResource>(`${this.base}/${id}/visibility`, { visible }).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  delete(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/${id}`);
  }
}
