import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { PromediosFilters, PromediosResponse } from './promedios.model';

@Injectable({ providedIn: 'root' })
export class PromediosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/grades/averages`;

  readonly loading = signal(false);

  load(filters?: PromediosFilters): Observable<PromediosResponse> {
    this.loading.set(true);
    let params = new HttpParams();
    if (filters?.nivel) params = params.set('nivel', filters.nivel);
    if (filters?.grado) params = params.set('grado', filters.grado);
    if (filters?.seccion) params = params.set('seccion', filters.seccion);
    if (filters?.curso) params = params.set('curso', filters.curso);
    if (filters?.busqueda) params = params.set('busqueda', filters.busqueda);

    return this.http.get<PromediosResponse>(this.base, { params }).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loading.set(false)),
    );
  }
}
