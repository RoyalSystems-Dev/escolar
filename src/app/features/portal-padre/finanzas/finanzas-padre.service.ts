import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '../../../core/auth/services/auth.service';
import { HijoResumen } from '../seguimiento/seguimiento.model';
import { EstadoCuentaHijo, PayVisaRequest, PayVisaResult, BoletaVenta } from './finanzas.model';

@Injectable({ providedIn: 'root' })
export class FinanzasPadreService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/parents`;

  readonly loadingHijos = signal(false);
  readonly loadingCuenta = signal(false);
  readonly payingVisa = signal(false);
  readonly loadingBoleta = signal(false);
  readonly hijos = signal<HijoResumen[]>([]);
  readonly hijoSeleccionado = signal<HijoResumen | null>(null);
  readonly estadoCuenta = signal<EstadoCuentaHijo | null>(null);
  readonly anioEscolar = signal(new Date().getFullYear());

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

  loadEstadoCuenta(studentId: number, anioEscolar?: number): Observable<EstadoCuentaHijo> {
    this.loadingCuenta.set(true);
    const anio = anioEscolar ?? this.anioEscolar();
    let params = new HttpParams()
      .set('email', this.parentEmail())
      .set('anioEscolar', String(anio));

    return this.http
      .get<EstadoCuentaHijo>(`${this.base}/children/${studentId}/account-statement`, { params })
      .pipe(
        tap(data => {
          this.anioEscolar.set(data.anioEscolar);
          this.hijoSeleccionado.set(data.estudiante);
          this.estadoCuenta.set(data);
        }),
        catchError(err => {
          this.estadoCuenta.set(null);
          return throwError(() => err);
        }),
        finalize(() => this.loadingCuenta.set(false)),
      );
  }

  seleccionarHijo(hijo: HijoResumen): Observable<EstadoCuentaHijo> {
    this.hijoSeleccionado.set(hijo);
    return this.loadEstadoCuenta(hijo.studentId);
  }

  parentEmail(): string {
    return this.auth.currentUser()?.email ?? 'padre@escolar.pe';
  }

  parentNombre(): string {
    return this.auth.nombreCompleto() ?? '';
  }

  payWithVisa(
    studentId: number,
    chargeId: number,
    dto: PayVisaRequest,
  ): Observable<PayVisaResult> {
    this.payingVisa.set(true);
    let params = new HttpParams()
      .set('email', this.parentEmail())
      .set('parentNombre', this.parentNombre());

    return this.http
      .post<PayVisaResult>(
        `${this.base}/children/${studentId}/charges/${chargeId}/pay-visa`,
        dto,
        { params },
      )
      .pipe(
        catchError(err => throwError(() => err)),
        finalize(() => this.payingVisa.set(false)),
      );
  }

  getBoleta(studentId: number, paymentId: number): Observable<BoletaVenta> {
    this.loadingBoleta.set(true);
    const params = new HttpParams()
      .set('email', this.parentEmail())
      .set('parentNombre', this.parentNombre());

    return this.http
      .get<BoletaVenta>(`${this.base}/children/${studentId}/payments/${paymentId}/receipt`, {
        params,
      })
      .pipe(
        catchError(err => throwError(() => err)),
        finalize(() => this.loadingBoleta.set(false)),
      );
  }
}
