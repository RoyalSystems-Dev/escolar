import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { EventoFilters, EventoItem, EventoPayload } from './eventos.model';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/events`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  load(filters?: EventoFilters): Observable<EventoItem[]> {
    this.loading.set(true);
    let params = new HttpParams();
    if (filters?.mes) params = params.set('mes', filters.mes);
    if (filters?.tipo) params = params.set('tipo', filters.tipo);
    if (filters?.destinatarios) params = params.set('destinatarios', filters.destinatarios);
    if (filters?.estado) params = params.set('estado', filters.estado);
    if (filters?.busqueda) params = params.set('busqueda', filters.busqueda);

    return this.http.get<EventoItem[]>(this.base, { params }).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loading.set(false)),
    );
  }

  create(payload: EventoPayload): Observable<EventoItem> {
    this.saving.set(true);
    return this.http.post<EventoItem>(this.base, payload).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  update(id: number, payload: Partial<EventoPayload>): Observable<EventoItem> {
    this.saving.set(true);
    return this.http.patch<EventoItem>(`${this.base}/${id}`, payload).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.saving.set(false)),
    );
  }

  delete(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/${id}`);
  }
}
