import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiStudent } from './api.models';

export interface CreateStudentPayload {
  nombre: string;
  apellido: string;
  email: string;
  nivel: string;
  grado: string;
  seccion: string;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class StudentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/students`;

  list(): Observable<ApiStudent[]> {
    return this.http.get<ApiStudent[]>(this.base);
  }

  get(id: number): Observable<ApiStudent> {
    return this.http.get<ApiStudent>(`${this.base}/${id}`);
  }

  create(payload: CreateStudentPayload): Observable<ApiStudent> {
    return this.http.post<ApiStudent>(this.base, payload);
  }

  update(id: number, payload: Partial<CreateStudentPayload>): Observable<ApiStudent> {
    return this.http.patch<ApiStudent>(`${this.base}/${id}`, payload);
  }

  remove(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/${id}`);
  }
}
