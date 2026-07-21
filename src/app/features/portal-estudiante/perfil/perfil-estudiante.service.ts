import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiExpediente } from '../../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class PerfilEstudianteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/students`;

  readonly loading = signal(false);
  readonly expediente = signal<ApiExpediente | null>(null);

  load(): Observable<ApiExpediente> {
    this.loading.set(true);
    return this.http.get<ApiExpediente>(`${this.base}/me/profile`).pipe(
      tap(data => this.expediente.set(data)),
      catchError(err => {
        this.expediente.set(null);
        return throwError(() => err);
      }),
      finalize(() => this.loading.set(false)),
    );
  }
}
