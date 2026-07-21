import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { PeriodoAcademicoItem, PeriodoAcademicoPayload } from './periodos-academicos.model';

@Injectable({ providedIn: 'root' })
export class MaestrosPeriodosAcademicosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/maestros/periodos-academicos`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  list(filters?: {
    anioEscolar?: number;
    tipo?: string;
    activo?: boolean;
  }): Observable<PeriodoAcademicoItem[]> {
    this.loading.set(true);
    let params = new HttpParams();
    if (filters?.anioEscolar) params = params.set('anioEscolar', filters.anioEscolar);
    if (filters?.tipo) params = params.set('tipo', filters.tipo);
    if (filters?.activo !== undefined) params = params.set('activo', filters.activo);

    return this.http.get<PeriodoAcademicoItem[]>(this.base, { params }).pipe(
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.loading.set(false)),
    );
  }

  create(payload: PeriodoAcademicoPayload): Observable<PeriodoAcademicoItem> {
    this.saving.set(true);
    return this.http.post<PeriodoAcademicoItem>(this.base, payload).pipe(
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.saving.set(false)),
    );
  }

  update(id: number, payload: Partial<PeriodoAcademicoPayload>): Observable<PeriodoAcademicoItem> {
    this.saving.set(true);
    return this.http.patch<PeriodoAcademicoItem>(`${this.base}/${id}`, payload).pipe(
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.saving.set(false)),
    );
  }

  marcarActual(id: number): Observable<PeriodoAcademicoItem> {
    this.saving.set(true);
    return this.http.patch<PeriodoAcademicoItem>(`${this.base}/${id}/actual`, {}).pipe(
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
