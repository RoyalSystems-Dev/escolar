import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CompetencyMatrixFilters,
  CompetencyMatrixResponse,
  SaveCompetencyBulkPayload,
} from './competencias.model';

@Injectable({ providedIn: 'root' })
export class CompetenciasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/competency-evaluations`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  loadPeriodMeta(): Observable<{ bimestreActual: number }> {
    return this.http.get<{ bimestreActual: number }>(`${this.base}/period-meta`);
  }

  loadMatrix(filters: CompetencyMatrixFilters): Observable<CompetencyMatrixResponse> {
    this.loading.set(true);
    let params = new HttpParams()
      .set('nivel', filters.nivel)
      .set('grado', filters.grado)
      .set('seccion', filters.seccion)
      .set('bimestre', filters.bimestre);

    if (filters.anio) params = params.set('anio', filters.anio);
    if (filters.curriculumId) params = params.set('curriculumId', filters.curriculumId);
    if (filters.cursoId) params = params.set('cursoId', filters.cursoId);

    return this.http.get<CompetencyMatrixResponse>(`${this.base}/matrix`, { params }).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loading.set(false)),
    );
  }

  saveBulk(payload: SaveCompetencyBulkPayload): Observable<{ saved: number; deleted: number }> {
    this.saving.set(true);
    return this.http.post<{ saved: number; deleted: number }>(`${this.base}/bulk`, payload).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }
}
