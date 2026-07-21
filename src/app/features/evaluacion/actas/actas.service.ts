import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ActaDetail,
  ActaFilters,
  ActaListItem,
  ActasBimestresMeta,
  GenerateActaPayload,
} from './actas.model';

@Injectable({ providedIn: 'root' })
export class ActasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/actas`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  loadBimestres(): Observable<ActasBimestresMeta> {
    return this.http.get<ActasBimestresMeta>(`${this.base}/bimestres`);
  }

  load(filters?: ActaFilters): Observable<ActaListItem[]> {
    this.loading.set(true);
    let params = new HttpParams();
    if (filters?.nivel) params = params.set('nivel', filters.nivel);
    if (filters?.grado) params = params.set('grado', filters.grado);
    if (filters?.seccion) params = params.set('seccion', filters.seccion);
    if (filters?.bimestre) params = params.set('bimestre', String(filters.bimestre));
    if (filters?.estado) params = params.set('estado', filters.estado);

    return this.http.get<ActaListItem[]>(this.base, { params }).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loading.set(false)),
    );
  }

  getById(id: number): Observable<ActaDetail> {
    return this.http.get<ActaDetail>(`${this.base}/${id}`);
  }

  generate(payload: GenerateActaPayload): Observable<ActaDetail> {
    this.saving.set(true);
    return this.http.post<ActaDetail>(`${this.base}/generate`, payload).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  approve(id: number, aprobadoPor?: string): Observable<ActaDetail> {
    return this.http.patch<ActaDetail>(`${this.base}/${id}/approve`, { aprobadoPor });
  }

  close(id: number): Observable<ActaDetail> {
    return this.http.patch<ActaDetail>(`${this.base}/${id}/close`, {});
  }

  delete(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/${id}`);
  }
}
