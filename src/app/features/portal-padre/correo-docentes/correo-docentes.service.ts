import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '../../../core/auth/services/auth.service';

export interface ParentTeacherContact {
  docenteId: number;
  nombreCompleto: string;
  email: string;
  especialidad: string;
  cursos: string[];
  hijos: { studentId: number; nombreCompleto: string; aulaLabel: string }[];
}

export interface ParentTeacherMessage {
  id: number;
  studentId: number;
  studentNombre: string;
  docenteId: number;
  docenteNombre: string;
  docenteEmail: string;
  asunto: string;
  cuerpo: string;
  estado: string;
  createdAt: string;
}

export interface SendTeacherMailPayload {
  studentId: number;
  docenteId: number;
  asunto: string;
  cuerpo: string;
}

@Injectable({ providedIn: 'root' })
export class CorreoDocentesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/parents`;

  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly teachers = signal<ParentTeacherContact[]>([]);
  readonly messages = signal<ParentTeacherMessage[]>([]);

  loadTeachers(): Observable<ParentTeacherContact[]> {
    this.loading.set(true);
    const params = new HttpParams().set('email', this.parentEmail());
    return this.http.get<ParentTeacherContact[]>(`${this.base}/teachers`, { params }).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loading.set(false)),
    );
  }

  loadMessages(): Observable<ParentTeacherMessage[]> {
    const params = new HttpParams().set('email', this.parentEmail());
    return this.http.get<ParentTeacherMessage[]>(`${this.base}/messages`, { params }).pipe(
      catchError((err) => throwError(() => err)),
    );
  }

  send(payload: SendTeacherMailPayload): Observable<ParentTeacherMessage> {
    this.sending.set(true);
    let params = new HttpParams().set('email', this.parentEmail());
    const nombre = this.auth.nombreCompleto();
    if (nombre) params = params.set('parentNombre', nombre);

    return this.http
      .post<ParentTeacherMessage>(`${this.base}/messages`, payload, { params })
      .pipe(
        catchError((err) => throwError(() => err)),
        finalize(() => this.sending.set(false)),
      );
  }

  parentEmail(): string {
    return this.auth.currentUser()?.email ?? 'padre@escolar.pe';
  }
}
