import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  BoletaVenta,
  CargoPago,
  PayVisaPayload,
  PagoResultado,
  RegistrarPagoPayload,
  ResumenTesoreria,
} from './pagos.model';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/treasury`;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadingBoleta = signal(false);

  listCharges(filters?: {
    anioEscolar?: number;
    q?: string;
    estado?: string;
  }): Observable<CargoPago[]> {
    this.loading.set(true);
    let params = new HttpParams();
    if (filters?.anioEscolar) {
      params = params.set('anioEscolar', String(filters.anioEscolar));
    }
    if (filters?.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }
    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }

    return this.http.get<CargoPago[]>(`${this.base}/charges`, { params }).pipe(
      catchError((err) => throwError(() => new Error(this.extractError(err)))),
      finalize(() => this.loading.set(false)),
    );
  }

  getSummary(anioEscolar?: number): Observable<ResumenTesoreria> {
    let params = new HttpParams();
    if (anioEscolar) {
      params = params.set('anioEscolar', String(anioEscolar));
    }
    return this.http
      .get<ResumenTesoreria>(`${this.base}/summary`, { params })
      .pipe(catchError((err) => throwError(() => new Error(this.extractError(err)))));
  }

  registerPayment(
    chargeId: number,
    payload: RegistrarPagoPayload,
  ): Observable<PagoResultado> {
    this.saving.set(true);
    return this.http
      .post<PagoResultado>(`${this.base}/charges/${chargeId}/payments`, payload)
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  payWithVisa(chargeId: number, payload: PayVisaPayload): Observable<PagoResultado> {
    this.saving.set(true);
    const body = {
      ...payload,
      numeroTarjeta: payload.numeroTarjeta.replace(/\D/g, ''),
    };
    return this.http
      .post<PagoResultado>(`${this.base}/charges/${chargeId}/pay-visa`, body)
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.saving.set(false)),
      );
  }

  getReceipt(paymentId: number): Observable<BoletaVenta> {
    this.loadingBoleta.set(true);
    return this.http
      .get<BoletaVenta>(`${this.base}/payments/${paymentId}/receipt`)
      .pipe(
        catchError((err) => throwError(() => new Error(this.extractError(err)))),
        finalize(() => this.loadingBoleta.set(false)),
      );
  }

  private extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'userMessage' in err) {
      const msg = (err as { userMessage?: string }).userMessage;
      if (msg) return msg;
    }
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string | string[] } | null;
      if (Array.isArray(body?.message)) return body.message.join(', ');
      if (typeof body?.message === 'string') return body.message;
      return err.message || 'Error de servidor';
    }
    if (err instanceof Error) return err.message;
    return 'Error inesperado';
  }
}
