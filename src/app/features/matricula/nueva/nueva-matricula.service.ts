import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ExpedienteCreado,
  NuevaMatriculaPayload,
  OcupacionSeccion,
} from './nueva-matricula.model';

@Injectable({ providedIn: 'root' })
export class NuevaMatriculaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/students`;

  readonly saving = signal(false);

  crear(payload: NuevaMatriculaPayload): Observable<ExpedienteCreado> {
    this.saving.set(true);
    return this.http.post<ExpedienteCreado>(this.base, payload).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  loadOccupancy(nivel: string, grado: string): Observable<OcupacionSeccion[]> {
    const params = new HttpParams().set('nivel', nivel).set('grado', grado);
    return this.http.get<OcupacionSeccion[]>(`${this.base}/section-occupancy`, { params });
  }
}
