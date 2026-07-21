import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiStudentContactos } from '../../../core/api/api.models';
import {
  ContactoCompanero,
  ContactoDocente,
  ContactosEstudianteData,
  inicialesContacto,
  nombreCompletoContacto,
} from './contactos.model';

@Injectable({ providedIn: 'root' })
export class ContactosEstudianteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/students/me/contactos`;

  private readonly _data = signal<ContactosEstudianteData | null>(null);
  private readonly _error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly data = this._data.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalCompaneros = computed(() => this._data()?.companeros.length ?? 0);
  readonly totalDocentes = computed(() => this._data()?.docentes.length ?? 0);

  load(anioEscolar?: number): Observable<ContactosEstudianteData | null> {
    this.loading.set(true);
    this._error.set(null);

    const params = anioEscolar ? { anioEscolar: String(anioEscolar) } : undefined;

    return this.http.get<ApiStudentContactos>(this.base, { params }).pipe(
      map(api => this.mapContactos(api)),
      tap(data => this._data.set(data)),
      catchError(() => {
        this._error.set('No se pudo cargar el directorio de contactos');
        this._data.set(null);
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  private mapContactos(api: ApiStudentContactos): ContactosEstudianteData {
    const companeros: ContactoCompanero[] = api.companeros.map(c => ({
      id: c.id,
      nombreCompleto: nombreCompletoContacto(c.nombres, c.apellidos),
      email: c.email,
      telefono: c.telefono,
      iniciales: inicialesContacto(c.nombres, c.apellidos),
    }));

    const docentes: ContactoDocente[] = api.docentes.map(d => ({
      id: d.id,
      nombreCompleto: nombreCompletoContacto(d.nombres, d.apellidos),
      abrev: d.abrev,
      email: d.email,
      telefono: d.telefono,
      especialidad: d.especialidad,
      cursos: d.cursos,
      iniciales: inicialesContacto(d.nombres, d.apellidos),
    }));

    return {
      aulaLabel: api.aula.aulaLabel,
      anioEscolar: api.aula.anioEscolar,
      companeros,
      docentes,
    };
  }
}
