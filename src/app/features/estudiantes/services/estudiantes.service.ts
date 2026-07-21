import { Injectable, inject, signal } from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiStudent } from '../../../core/api/api.models';
import { CreateStudentPayload, StudentsApiService } from '../../../core/api/students-api.service';

export interface EstudianteListItem {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  email: string;
  nivel: string;
  grado: string;
  seccion: string;
  gradoLabel: string;
  activo: boolean;
}

function fromApi(student: ApiStudent): EstudianteListItem {
  return {
    id: student.id,
    codigo: `2026-${String(student.id).padStart(3, '0')}`,
    nombres: student.nombre,
    apellidos: student.apellido,
    email: student.email,
    nivel: student.nivel,
    grado: student.grado,
    seccion: student.seccion,
    gradoLabel: `${student.grado} ${student.nivel}`,
    activo: student.activo,
  };
}

@Injectable({ providedIn: 'root' })
export class EstudiantesService {
  private readonly api = inject(StudentsApiService);

  private readonly _estudiantes = signal<EstudianteListItem[]>([]);
  readonly estudiantes = this._estudiantes.asReadonly();
  readonly loading = signal(false);

  load(): void {
    this.loading.set(true);
    this.api.list().pipe(
      tap(items => {
        this._estudiantes.set(items.map(fromApi));
        this.loading.set(false);
      }),
      catchError(() => {
        this.loading.set(false);
        return of([]);
      }),
    ).subscribe();
  }

  create(payload: CreateStudentPayload) {
    return this.api.create(payload).pipe(
      tap(item => this._estudiantes.update(list => [...list, fromApi(item)])),
    );
  }

  update(id: number, payload: Partial<CreateStudentPayload>) {
    return this.api.update(id, payload).pipe(
      tap(item => this._estudiantes.update(list => list.map(e => e.id === id ? fromApi(item) : e))),
    );
  }

  remove(id: number) {
    return this.api.remove(id).pipe(
      tap(() => this._estudiantes.update(list => list.filter(e => e.id !== id))),
    );
  }
}
