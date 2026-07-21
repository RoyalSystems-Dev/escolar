import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, of } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResource } from '../../../core/api/api.models';

export interface RecursosEstudianteQuery {
  nivel: string;
  grado: string;
  seccion: string;
  curso?: string;
}

@Injectable({ providedIn: 'root' })
export class RecursosEstudianteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/resources`;

  readonly loading = signal(false);

  load(query: RecursosEstudianteQuery): Observable<ApiResource[]> {
    this.loading.set(true);
    let params = new HttpParams()
      .set('nivel', query.nivel)
      .set('grado', query.grado)
      .set('seccion', query.seccion)
      .set('visible', 'true');
    if (query.curso) params = params.set('curso', query.curso);

    return this.http.get<ApiResource[]>(this.base, { params }).pipe(
      catchError(() => of([])),
      finalize(() => this.loading.set(false)),
    );
  }
}
