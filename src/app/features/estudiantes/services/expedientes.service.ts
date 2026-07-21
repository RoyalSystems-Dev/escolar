import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ApiExpediente, ApiStudentDocumentsResponse } from '../../../core/api/api.models';
import {
  DocumentoPayload,
  ExpedientePayload,
  ExpedientesApiService,
} from '../../../core/api/expedientes-api.service';

export interface Representante {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  trabajo: string;
}

export interface HistorialAcademico {
  anio: string;
  grado: string;
  seccion: string;
  promedio: number;
  estado: string;
}

export interface Documento {
  id?: number;
  tipo: string;
  numero: string;
  estado: 'entregado' | 'pendiente' | 'vencido';
  fechaEntrega: string;
  imagenUrl?: string;
}

export interface Estudiante {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  fechaNac: string;
  sexo: 'M' | 'F';
  direccion: string;
  foto: string;
  grupoSanguineo: string;
  alergias: string;
  condicionesSalud: string;
  observaciones: string;
  grado: string;
  seccion: string;
  anioIngreso: string;
  estado: 'activo' | 'inactivo' | 'retirado';
  padre: Representante;
  madre: Representante;
  apoderado: Representante;
  historialAcademico: HistorialAcademico[];
  asistenciaPct: number;
  conductaNota: string;
  documentos: Documento[];
}

export function estudianteVacio(id = 0): Estudiante {
  const repVacio = (): Representante => ({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: '',
    trabajo: '',
  });
  return {
    id,
    codigo: '',
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    fechaNac: '',
    sexo: 'M',
    direccion: '',
    foto: '',
    grupoSanguineo: 'O+',
    alergias: 'Ninguna',
    condicionesSalud: '',
    observaciones: '',
    grado: '',
    seccion: 'A',
    anioIngreso: String(new Date().getFullYear()),
    estado: 'activo',
    padre: repVacio(),
    madre: repVacio(),
    apoderado: repVacio(),
    historialAcademico: [],
    asistenciaPct: 0,
    conductaNota: 'AD',
    documentos: [],
  };
}

function fromApi(exp: ApiExpediente): Estudiante {
  return {
    id: exp.id,
    codigo: exp.codigo,
    nombres: exp.nombres,
    apellidos: exp.apellidos,
    dni: exp.dni,
    email: exp.email,
    fechaNac: exp.fechaNac,
    sexo: exp.sexo,
    direccion: exp.direccion,
    foto: exp.foto,
    grupoSanguineo: exp.grupoSanguineo,
    alergias: exp.alergias,
    condicionesSalud: exp.condicionesSalud,
    observaciones: exp.observaciones,
    grado: exp.gradoLabel,
    seccion: exp.seccion,
    anioIngreso: exp.anioIngreso,
    estado: exp.estado,
    padre: { ...exp.padre },
    madre: { ...exp.madre },
    apoderado: { ...exp.apoderado },
    historialAcademico: exp.historialAcademico.map((h) => ({ ...h })),
    asistenciaPct: exp.asistenciaPct,
    conductaNota: exp.conductaNota,
    documentos: exp.documentos.map((d) => ({
      id: d.id,
      tipo: d.tipo,
      numero: d.numero,
      estado: d.estado,
      fechaEntrega: d.fechaEntrega,
      imagenUrl: d.imagenUrl,
    })),
  };
}

function toPayload(e: Estudiante): ExpedientePayload {
  return {
    nombres: e.nombres,
    apellidos: e.apellidos,
    codigo: e.codigo || undefined,
    dni: e.dni,
    email: e.email || `${e.dni || 'alumno'}@estudiante.pe`,
    fechaNac: e.fechaNac || undefined,
    sexo: e.sexo,
    direccion: e.direccion,
    foto: e.foto,
    grupoSanguineo: e.grupoSanguineo,
    alergias: e.alergias,
    condicionesSalud: e.condicionesSalud,
    observaciones: e.observaciones,
    gradoLabel: e.grado,
    seccion: e.seccion,
    anioIngreso: e.anioIngreso,
    estado: e.estado,
    conductaNota: e.conductaNota,
    padre: e.padre,
    madre: e.madre,
    apoderado: e.apoderado,
    historialAcademico: e.historialAcademico,
    documentos: e.documentos.map((d) => ({
      id: d.id,
      tipo: d.tipo,
      numero: d.numero,
      estado: d.estado,
      fechaEntrega: d.fechaEntrega,
      imagenUrl: d.imagenUrl,
    })),
  };
}

@Injectable({ providedIn: 'root' })
export class ExpedientesService {
  private readonly api = inject(ExpedientesApiService);

  private readonly _estudiantes = signal<Estudiante[]>([]);
  readonly estudiantes = this._estudiantes.asReadonly();
  readonly loading = signal(false);
  readonly error = signal('');

  load(q?: string): void {
    this.loading.set(true);
    this.error.set('');
    this._estudiantes.set([]);
    this.api.list(q).pipe(
      tap((items) => {
        this._estudiantes.set(items.map(fromApi));
        this.loading.set(false);
      }),
      catchError(() => {
        this._estudiantes.set([]);
        this.loading.set(false);
        this.error.set('No se pudo conectar con la base de datos. Verifique que el servidor esté activo.');
        return of([]);
      }),
    ).subscribe();
  }

  refreshOne(id: number) {
    return this.api.get(id).pipe(
      tap((item) => {
        const mapped = fromApi(item);
        this._estudiantes.update((list) =>
          list.map((e) => (e.id === id ? mapped : e)),
        );
      }),
    );
  }

  create(estudiante: Estudiante) {
    return this.api.create(toPayload(estudiante)).pipe(
      tap((item) => {
        this._estudiantes.update((list) => [...list, fromApi(item)]);
      }),
      map(fromApi),
    );
  }

  update(estudiante: Estudiante) {
    return this.api.update(estudiante.id, toPayload(estudiante)).pipe(
      tap((item) => {
        const mapped = fromApi(item);
        this._estudiantes.update((list) =>
          list.map((e) => (e.id === mapped.id ? mapped : e)),
        );
      }),
      map(fromApi),
    );
  }

  remove(id: number) {
    return this.api.remove(id).pipe(
      tap(() => {
        this._estudiantes.update((list) => list.filter((e) => e.id !== id));
      }),
    );
  }

  addDocument(studentId: number, payload: DocumentoPayload) {
    return this.api.addDocument(studentId, payload).pipe(
      tap(() => this.refreshOne(studentId).subscribe()),
    );
  }

  updateDocument(studentId: number, docId: number, payload: Partial<DocumentoPayload>) {
    return this.api.updateDocument(studentId, docId, payload).pipe(
      tap(() => this.refreshOne(studentId).subscribe()),
    );
  }

  syncRequisitosMatricula(studentId: number) {
    return this.api.syncRequisitos(studentId).pipe(
      tap((item) => {
        const mapped = fromApi(item);
        this._estudiantes.update((list) =>
          list.map((e) => (e.id === mapped.id ? mapped : e)),
        );
      }),
      map(fromApi),
    );
  }

  loadStudentDocuments(studentId: number): Observable<ApiStudentDocumentsResponse> {
    return this.api.listDocuments(studentId);
  }

  search(q: string) {
    this.load(q);
  }

  exportCsv(filters?: { q?: string; grado?: string; estado?: string }): Observable<Blob> {
    return this.api.downloadExport(filters);
  }
}
