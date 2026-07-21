import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  GenerateLibretasPayload,
  LibretaFilters,
  LibretaListResponse,
  Libreta,
  UpdateLibretaPayload,
} from './libretas.model';

@Injectable({ providedIn: 'root' })
export class LibretasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/report-cards`;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly pdfLoading = signal(false);

  list(filters: LibretaFilters): Observable<LibretaListResponse> {
    this.loading.set(true);
    let params = this.buildParams(filters);
    if (filters.estado && filters.estado !== 'todos') {
      params = params.set('estado', filters.estado);
    }
    return this.http.get<LibretaListResponse>(this.base, { params }).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loading.set(false)),
    );
  }

  generate(payload: GenerateLibretasPayload): Observable<{ generated: number }> {
    this.saving.set(true);
    return this.http.post<{ generated: number }>(`${this.base}/generate`, payload).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  update(studentId: number, payload: UpdateLibretaPayload): Observable<Libreta> {
    this.saving.set(true);
    return this.http.patch<Libreta>(`${this.base}/${studentId}`, payload).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  downloadPdfOne(studentId: number, filters: LibretaFilters): Observable<void> {
    this.pdfLoading.set(true);
    const params = this.buildParams(filters);
    return this.http
      .get(`${this.base}/${studentId}/pdf`, { params, responseType: 'blob' })
      .pipe(
        tap((blob) => this.triggerDownload(blob, `libreta_${studentId}_B${filters.bimestre}.pdf`)),
        map(() => undefined),
        catchError((err) => throwError(() => err)),
        finalize(() => this.pdfLoading.set(false)),
      );
  }

  downloadPdfSalon(filters: LibretaFilters, studentIds?: number[]): Observable<void> {
    this.pdfLoading.set(true);
    let params = this.buildParams(filters);
    if (studentIds?.length) {
      params = params.set('studentIds', studentIds.join(','));
    }
    return this.http
      .get(`${this.base}/pdf/salon`, { params, responseType: 'blob' })
      .pipe(
        tap((blob) =>
          this.triggerDownload(
            blob,
            `libretas_${filters.nivel}_${filters.grado}_${filters.seccion}_B${filters.bimestre}.pdf`,
          ),
        ),
        map(() => undefined),
        catchError((err) => throwError(() => err)),
        finalize(() => this.pdfLoading.set(false)),
      );
  }

  private buildParams(filters: LibretaFilters): HttpParams {
    let params = new HttpParams()
      .set('nivel', filters.nivel)
      .set('grado', filters.grado)
      .set('seccion', filters.seccion)
      .set('bimestre', filters.bimestre);
    if (filters.anio) params = params.set('anio', filters.anio);
    return params;
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
