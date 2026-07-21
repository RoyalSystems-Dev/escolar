import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { BitacoraFilters, BitacoraResponse } from './bitacora.model';

@Injectable({ providedIn: 'root' })
export class BitacoraService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/audit-logs`;

  readonly loading = signal(false);

  load(filters?: Partial<BitacoraFilters>): Observable<BitacoraResponse> {
    this.loading.set(true);
    let params = new HttpParams();
    if (filters?.modulo) params = params.set('modulo', filters.modulo);
    if (filters?.accion) params = params.set('accion', filters.accion);
    if (filters?.nivel) params = params.set('nivel', filters.nivel);
    if (filters?.usuario) params = params.set('usuario', filters.usuario);
    if (filters?.desde) params = params.set('desde', filters.desde);
    if (filters?.hasta) params = params.set('hasta', filters.hasta);
    if (filters?.busqueda) params = params.set('busqueda', filters.busqueda);

    return this.http.get<BitacoraResponse>(this.base, { params }).pipe(
      catchError(err => throwError(() => err)),
      finalize(() => this.loading.set(false)),
    );
  }
}
