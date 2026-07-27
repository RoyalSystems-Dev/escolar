import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiExpediente,
  ApiExpedienteDocumento,
  ApiRepresentante,
  ApiStudentDocumentsResponse,
  StudentsStats,
} from './api.models';
import { DocumentoRequerido } from '../../features/estudiantes/shared/documentos-requisitos';

export interface ExpedientePayload {
  nombres: string;
  apellidos: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  codigo?: string;
  dni?: string;
  tipoDocumento?: string;
  email: string;
  fechaNac?: string;
  sexo?: 'M' | 'F';
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  telefonoEmergencia?: string;
  foto?: string;
  grupoSanguineo?: string;
  alergias?: string;
  condicionesSalud?: string;
  observaciones?: string;
  gradoLabel: string;
  seccion: string;
  anioIngreso?: string;
  estado?: 'activo' | 'inactivo' | 'retirado';
  conductaNota?: string;
  padre?: ApiRepresentante;
  madre?: ApiRepresentante;
  apoderado?: ApiRepresentante;
  historialAcademico?: Array<{
    anio: string;
    grado: string;
    seccion: string;
    promedio: number;
    estado: string;
  }>;
  documentos?: Array<{
    id?: number;
    tipo: string;
    numero?: string;
    estado?: 'entregado' | 'pendiente' | 'vencido';
    fechaEntrega?: string;
    imagenUrl?: string;
  }>;
}

export interface DocumentoPayload {
  tipo: string;
  numero?: string;
  estado?: 'entregado' | 'pendiente' | 'vencido';
  fechaEntrega?: string;
  imagenUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpedientesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/students`;

  list(q?: string): Observable<ApiExpediente[]> {
    const params = q?.trim() ? new HttpParams().set('q', q.trim()) : undefined;
    return this.http.get<ApiExpediente[]>(this.base, { params });
  }

  getStats(): Observable<StudentsStats> {
    return this.http.get<StudentsStats>(`${this.base}/stats`);
  }

  getRequisitos(gradoLabel: string): Observable<DocumentoRequerido[]> {
    return this.http.get<DocumentoRequerido[]>(
      `${this.base}/document-requirements/${encodeURIComponent(gradoLabel)}`,
    );
  }

  syncRequisitos(studentId: number): Observable<ApiExpediente> {
    return this.http.post<ApiExpediente>(
      `${this.base}/${studentId}/documents/sync-requisitos`,
      {},
    );
  }

  get(id: number): Observable<ApiExpediente> {
    return this.http.get<ApiExpediente>(`${this.base}/${id}`);
  }

  listDocuments(studentId: number): Observable<ApiStudentDocumentsResponse> {
    return this.http.get<ApiStudentDocumentsResponse>(
      `${this.base}/${studentId}/documents`,
    );
  }

  create(payload: ExpedientePayload): Observable<ApiExpediente> {
    return this.http.post<ApiExpediente>(this.base, payload);
  }

  update(id: number, payload: Partial<ExpedientePayload>): Observable<ApiExpediente> {
    return this.http.patch<ApiExpediente>(`${this.base}/${id}`, payload);
  }

  remove(id: number): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/${id}`);
  }

  addDocument(studentId: number, payload: DocumentoPayload): Observable<ApiExpedienteDocumento> {
    return this.http.post<ApiExpedienteDocumento>(
      `${this.base}/${studentId}/documents`,
      payload,
    );
  }

  updateDocument(
    studentId: number,
    docId: number,
    payload: Partial<DocumentoPayload>,
  ): Observable<ApiExpedienteDocumento> {
    return this.http.patch<ApiExpedienteDocumento>(
      `${this.base}/${studentId}/documents/${docId}`,
      payload,
    );
  }

  removeDocument(
    studentId: number,
    docId: number,
  ): Observable<{ deleted: boolean; id: number }> {
    return this.http.delete<{ deleted: boolean; id: number }>(
      `${this.base}/${studentId}/documents/${docId}`,
    );
  }

  downloadExport(filters?: {
    q?: string;
    grado?: string;
    estado?: string;
  }): Observable<Blob> {
    let params = new HttpParams();
    if (filters?.q?.trim()) params = params.set('q', filters.q.trim());
    if (filters?.grado?.trim()) params = params.set('grado', filters.grado.trim());
    if (filters?.estado?.trim()) params = params.set('estado', filters.estado.trim());
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
