import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApproveAllResult,
  EstCont,
  GenerateContinuityRequest,
  GenerateContinuityResult,
  RegistroCont,
} from './continuidad.model';

@Injectable({ providedIn: 'root' })
export class ContinuidadService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/continuity-enrollment`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  getCandidates(anioOrigen: number, anioNuevo: number): Observable<EstCont[]> {
    this.loading.set(true);
    const params = new HttpParams()
      .set('anioOrigen', anioOrigen)
      .set('anioNuevo', anioNuevo);

    return this.http.get<EstCont[]>(`${this.base}/candidates`, { params }).pipe(
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.loading.set(false)),
    );
  }

  getRecords(anioNuevo: number, estado?: string): Observable<RegistroCont[]> {
    let params = new HttpParams().set('anioNuevo', anioNuevo);
    if (estado) params = params.set('estado', estado);

    return this.http
      .get<RegistroCont[]>(this.base, { params })
      .pipe(catchError((err) => throwError(() => new Error(this.extractError(err)))));
  }

  generate(payload: GenerateContinuityRequest): Observable<GenerateContinuityResult> {
    this.saving.set(true);
    return this.http
      .post<GenerateContinuityResult>(`${this.base}/generate`, payload)
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  approve(id: number, aprobadoPor = 'Administrador'): Observable<RegistroCont> {
    this.saving.set(true);
    return this.http
      .patch<RegistroCont>(`${this.base}/${id}/approve`, { aprobadoPor })
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  approveAll(anioNuevo: number, aprobadoPor = 'Administrador'): Observable<ApproveAllResult> {
    this.saving.set(true);
    return this.http
      .post<ApproveAllResult>(`${this.base}/approve-all`, { anioNuevo, aprobadoPor })
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  reject(id: number, motivoRechazo: string): Observable<RegistroCont> {
    this.saving.set(true);
    return this.http
      .patch<RegistroCont>(`${this.base}/${id}/reject`, { motivoRechazo })
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  private extractError(err: HttpErrorResponse): string {
    const body = err.error;
    if (typeof body === 'string') return body;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join('; ') : body.message;
    }
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifique que el backend este activo.';
    }
    return `Error del servidor (${err.status})`;
  }
}
