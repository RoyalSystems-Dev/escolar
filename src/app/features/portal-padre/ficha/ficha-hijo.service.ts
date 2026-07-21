import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ApiExpediente } from '../../../core/api/api.models';
import { HijoResumen } from '../seguimiento/seguimiento.model';

export interface FichaHijo extends ApiExpediente {
  parentesco: string;
  estudiante: HijoResumen;
}

@Injectable({ providedIn: 'root' })
export class FichaHijoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/parents`;

  readonly loading = signal(false);
  readonly ficha = signal<FichaHijo | null>(null);

  load(studentId: number): Observable<FichaHijo> {
    this.loading.set(true);
    const params = new HttpParams().set('email', this.parentEmail());

    return this.http
      .get<FichaHijo>(`${this.base}/children/${studentId}/profile`, { params })
      .pipe(
        tap(data => this.ficha.set(data)),
        catchError(err => {
          this.ficha.set(null);
          return throwError(() => err);
        }),
        finalize(() => this.loading.set(false)),
      );
  }

  parentEmail(): string {
    return this.auth.currentUser()?.email ?? 'padre@escolar.pe';
  }
}
