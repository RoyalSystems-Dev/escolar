import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ControlReportFilters, ControlReportResponse } from './control.model';

@Injectable({ providedIn: 'root' })
export class AsistenciaControlService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/attendances`;

  readonly loading = signal(false);

  loadReport(filters?: ControlReportFilters): Observable<ControlReportResponse> {
    this.loading.set(true);
    return this.http
      .get<ControlReportResponse>(`${this.base}/control-report`, {
        params: this.buildParams(filters),
      })
      .pipe(
        catchError((err) => throwError(() => err)),
        finalize(() => this.loading.set(false)),
      );
  }

  downloadCsv(filters?: ControlReportFilters): Observable<Blob> {
    return this.http.get(`${this.base}/control-report/export`, {
      params: this.buildParams(filters),
      responseType: 'blob',
    });
  }

  private buildParams(filters?: ControlReportFilters): HttpParams {
    let params = new HttpParams();
    if (filters?.mes) params = params.set('mes', filters.mes);
    if (filters?.nivel) params = params.set('nivel', filters.nivel);
    if (filters?.grado) params = params.set('grado', filters.grado);
    if (filters?.seccion) params = params.set('seccion', filters.seccion);
    if (filters?.busqueda) params = params.set('busqueda', filters.busqueda);
    return params;
  }
}

export function mesActualIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function diaNumero(fecha: string): number {
  return Number(fecha.split('-')[2]);
}

export function semanasCalendario(
  dias: ControlReportResponse['diasEscolares'],
  calendario: Record<string, string | null>,
): Array<Array<{ fecha: string; dia: number; estado: string; esFuturo: boolean }>> {
  if (!dias.length) return [];

  const semanas: Array<Array<{ fecha: string; dia: number; estado: string; esFuturo: boolean }>> = [];
  let actual: Array<{ fecha: string; dia: number; estado: string; esFuturo: boolean }> = [];

  for (const d of dias) {
    actual.push({
      fecha: d.fecha,
      dia: diaNumero(d.fecha),
      estado: d.esFuturo ? '–' : (calendario[d.fecha] ?? '–'),
      esFuturo: d.esFuturo,
    });
    if (actual.length === 5) {
      semanas.push(actual);
      actual = [];
    }
  }
  if (actual.length) semanas.push(actual);
  return semanas;
}

export function triggerCsvDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
