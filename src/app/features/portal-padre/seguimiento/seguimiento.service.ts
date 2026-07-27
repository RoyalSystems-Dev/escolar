import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '../../../core/auth/services/auth.service';
import { HijoResumen, SeguimientoAcademico } from './seguimiento.model';

@Injectable({ providedIn: 'root' })
export class SeguimientoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/parents`;

  readonly loading = signal(false);
  readonly loadingTracking = signal(false);
  readonly seguimiento = signal<SeguimientoAcademico | null>(null);

  readonly loadingHijos = signal(false);
  readonly hijos = signal<HijoResumen[]>([]);
  readonly hijoSeleccionado = signal<HijoResumen | null>(null);

  loadHijos(): Observable<HijoResumen[]> {
    this.loadingHijos.set(true);
    const params = new HttpParams().set('email', this.parentEmail());

    return this.http.get<HijoResumen[]>(`${this.base}/children`, { params }).pipe(
      tap(hijos => {
        this.hijos.set(hijos);
        const current = this.hijoSeleccionado();
        const stillValid = current && hijos.some(h => h.studentId === current.studentId);
        if (!stillValid) {
          this.hijoSeleccionado.set(hijos[0] ?? null);
        }
      }),
      catchError(err => throwError(() => err)),
      finalize(() => this.loadingHijos.set(false)),
    );
  }

  seleccionarHijo(hijo: HijoResumen): void {
    this.hijoSeleccionado.set(hijo);
  }

  loadSeguimiento(studentId: number): Observable<SeguimientoAcademico> {
    this.loadingTracking.set(true);
    const params = new HttpParams().set('email', this.parentEmail());

    return this.http.get<SeguimientoAcademico>(`${this.base}/children/${studentId}/tracking`, { params }).pipe(
      catchError(err => throwError(() => err)),
      finalize(() => this.loadingTracking.set(false)),
    );
  }

  markAlertaLeida(studentId: number, alertId: number): Observable<unknown> {
    const params = new HttpParams().set('email', this.parentEmail());
    return this.http.post(
      `${this.base}/children/${studentId}/absence-alerts/${alertId}/read`,
      {},
      { params },
    );
  }

  parentEmail(): string {
    return this.auth.currentUser()?.email ?? 'padre@escolar.pe';
  }
}
