import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  BulkHistorialPreviewResult,
  BulkImportHistorialRequest,
  BulkImportHistorialResult,
} from './historial-academico.model';

@Injectable({ providedIn: 'root' })
export class HistorialAcademicoMaestroService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/students`;

  readonly importing = signal(false);
  readonly previewing = signal(false);

  previewFile(file: File): Observable<BulkHistorialPreviewResult> {
    this.previewing.set(true);
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http
      .post<BulkHistorialPreviewResult>(`${this.base}/bulk-historial-academico/preview`, formData)
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.extractError(err))),
        ),
        finalize(() => this.previewing.set(false)),
      );
  }

  bulkImport(payload: BulkImportHistorialRequest): Observable<BulkImportHistorialResult> {
    this.importing.set(true);
    return this.http
      .post<BulkImportHistorialResult>(`${this.base}/bulk-historial-academico`, payload)
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
