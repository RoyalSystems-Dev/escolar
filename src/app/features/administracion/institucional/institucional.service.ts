import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ConfigSistema,
  Grado,
  InstitucionData,
  InstitutionConfigResponse,
  ModuloSistema,
  Nivel,
  Periodo,
  Seccion,
  Sede,
} from './institucional.model';

@Injectable({ providedIn: 'root' })
export class InstitucionalService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/institution`;

  readonly loading = signal(false);
  readonly saving = signal(false);

  load(): Observable<InstitutionConfigResponse | null> {
    this.loading.set(true);
    return this.http.get<InstitutionConfigResponse>(this.base).pipe(
      tap(() => this.loading.set(false)),
      catchError(() => {
        this.loading.set(false);
        return of(null);
      }),
    );
  }

  save(payload: {
    inst: InstitucionData;
    periodos: Periodo[];
    config: ConfigSistema;
    modulos: ModuloSistema[];
  }) {
    this.saving.set(true);
    return this.http.patch(`${this.base}`, {
      ...payload.inst,
      periodos: payload.periodos,
      config: payload.config,
      modulos: payload.modulos,
    }).pipe(
      tap(() => this.saving.set(false)),
      catchError(err => {
        this.saving.set(false);
        throw err;
      }),
    );
  }

  loadEducationLevels(): Observable<Nivel[]> {
    this.loading.set(true);
    return this.http.get<Nivel[]>(`${this.base}/education-levels`).pipe(
      tap(() => this.loading.set(false)),
      catchError(() => {
        this.loading.set(false);
        return of([]);
      }),
    );
  }

  createEducationLevel(payload: { nombre: string; activo?: boolean }) {
    return this.http.post<Nivel>(`${this.base}/education-levels`, payload);
  }

  updateEducationLevel(id: number, payload: Partial<Pick<Nivel, 'nombre' | 'activo'>>) {
    return this.http.patch<Nivel>(`${this.base}/education-levels/${id}`, payload);
  }

  deleteEducationLevel(id: number) {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/education-levels/${id}`);
  }

  createGradeLevel(nivelId: number, payload: { nombre: string }) {
    return this.http.post<Grado>(`${this.base}/education-levels/${nivelId}/grades`, payload);
  }

  updateGradeLevel(id: number, payload: { nombre: string }) {
    return this.http.patch<Grado>(`${this.base}/grade-levels/${id}`, payload);
  }

  deleteGradeLevel(id: number) {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/grade-levels/${id}`);
  }

  createGradeSection(gradoId: number, payload: { nombre: string }) {
    return this.http.post<Seccion>(`${this.base}/grade-levels/${gradoId}/sections`, payload);
  }

  deleteGradeSection(id: number) {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/grade-sections/${id}`);
  }

  createCampus(payload: Omit<Sede, 'id'>) {
    return this.http.post<Sede>(`${this.base}/campuses`, payload);
  }

  updateCampus(id: number, payload: Partial<Sede>) {
    return this.http.patch<Sede>(`${this.base}/campuses/${id}`, payload);
  }

  deleteCampus(id: number) {
    return this.http.delete<{ deleted: boolean; id: number }>(`${this.base}/campuses/${id}`);
  }
}
