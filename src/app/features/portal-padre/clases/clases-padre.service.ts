import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, finalize, of, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResource, ApiTemarioClase } from '../../../core/api/api.models';
import { SeguimientoService } from '../seguimiento/seguimiento.service';
import { TemarioClaseItem } from '../../portal-docente/temario/temario.model';

export interface ClasesPadreResponse {
  temario: ApiTemarioClase[];
  recursos: ApiResource[];
}

@Injectable({ providedIn: 'root' })
export class ClasesPadreService {
  private readonly http = inject(HttpClient);
  private readonly seguimiento = inject(SeguimientoService);
  private readonly base = `${environment.apiUrl}/parents`;

  readonly loading = signal(false);

  loadCurso(studentId: number, curso: string, anioEscolar?: number) {
    this.loading.set(true);
    let params = new HttpParams()
      .set('email', this.seguimiento.parentEmail())
      .set('curso', curso);
    if (anioEscolar) params = params.set('anioEscolar', String(anioEscolar));

    return this.http
      .get<ClasesPadreResponse>(`${this.base}/children/${studentId}/clases`, { params })
      .pipe(
        tap(res => {
          this._temario.set(res.temario as TemarioClaseItem[]);
          this._recursos.set(res.recursos);
        }),
        catchError(err => throwError(() => err)),
        finalize(() => this.loading.set(false)),
      );
  }

  private readonly _temario = signal<TemarioClaseItem[]>([]);
  private readonly _recursos = signal<ApiResource[]>([]);
  readonly temario = this._temario.asReadonly();
  readonly recursos = this._recursos.asReadonly();

  clear(): void {
    this._temario.set([]);
    this._recursos.set([]);
  }
}
