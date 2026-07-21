import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiExpediente } from '../../../core/api/api.models';
import {
  CambioSeccionPayload,
  CambioSeccionResult,
  HistorialCambioSeccion,
  OcupacionSeccion,
} from './cambio-seccion.model';

@Injectable({ providedIn: 'root' })
export class CambioSeccionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/students`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  loadStudents(params?: { nivel?: string; grado?: string }): Observable<ApiExpediente[]> {
    this.loading.set(true);
    let httpParams = new HttpParams();
    if (params?.nivel) httpParams = httpParams.set('nivel', params.nivel);
    if (params?.grado) httpParams = httpParams.set('grado', params.grado);
    return this.http
      .get<ApiExpediente[]>(`${this.base}/section-change-candidates`, { params: httpParams })
      .pipe(
        catchError((err) => throwError(() => err)),
        finalize(() => this.loading.set(false)),
      );
  }

  loadHistory(params?: { nivel?: string; grado?: string }): Observable<HistorialCambioSeccion[]> {
    let httpParams = new HttpParams();
    if (params?.nivel) httpParams = httpParams.set('nivel', params.nivel);
    if (params?.grado) httpParams = httpParams.set('grado', params.grado);
    return this.http.get<HistorialCambioSeccion[]>(`${this.base}/section-changes`, {
      params: httpParams,
    });
  }

  loadOccupancy(
    nivel: string,
    grado: string,
    anioEscolar?: number,
  ): Observable<OcupacionSeccion[]> {
    let params = new HttpParams().set('nivel', nivel).set('grado', grado);
    if (anioEscolar) params = params.set('anioEscolar', anioEscolar);
    return this.http.get<OcupacionSeccion[]>(`${this.base}/section-occupancy`, { params });
  }

  changeSection(studentId: number, payload: CambioSeccionPayload): Observable<CambioSeccionResult> {
    this.saving.set(true);
    return this.http.post<CambioSeccionResult>(`${this.base}/${studentId}/change-section`, payload).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }
}
