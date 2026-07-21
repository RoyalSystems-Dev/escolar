import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiTemarioClase } from '../../../core/api/api.models';

export interface ClasesTemarioQuery {
  nivel?: string;
  grado?: string;
  seccion?: string;
  curso: string;
  anioEscolar?: number;
}

@Injectable({ providedIn: 'root' })
export class ClasesTemarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/temario/estudiante/clases`;

  readonly loading = signal(false);

  listByCurso(query: ClasesTemarioQuery): Observable<ApiTemarioClase[]> {
    this.loading.set(true);
    let params = new HttpParams().set('curso', query.curso);
    if (query.nivel) params = params.set('nivel', query.nivel);
    if (query.grado) params = params.set('grado', query.grado);
    if (query.seccion) params = params.set('seccion', query.seccion);
    if (query.anioEscolar) params = params.set('anioEscolar', query.anioEscolar);

    return this.http.get<ApiTemarioClase[]>(this.base, { params }).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loading.set(false)),
    );
  }
}
