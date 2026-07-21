import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  BulkImportMatriculaRequest,
  BulkImportMatriculaResult,
  BulkMatriculaPreviewResult,
} from './masiva.model';

@Injectable({ providedIn: 'root' })
export class MasivaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/students`;

  readonly importing = signal(false);
  readonly previewing = signal(false);

  /** Analiza el archivo sin guardar: separa listos vs bloqueados */
  previewFile(file: File): Observable<BulkMatriculaPreviewResult> {
    this.previewing.set(true);
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http
      .post<BulkMatriculaPreviewResult>(`${this.base}/bulk-matricula/preview`, formData)
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.extractError(err))),
        ),
        finalize(() => this.previewing.set(false)),
      );
  }

  bulkImport(payload: BulkImportMatriculaRequest): Observable<BulkImportMatriculaResult> {
    this.importing.set(true);
    return this.http
      .post<BulkImportMatriculaResult>(`${this.base}/bulk-matricula`, payload)
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.extractError(err))),
        ),
        finalize(() => this.importing.set(false)),
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
