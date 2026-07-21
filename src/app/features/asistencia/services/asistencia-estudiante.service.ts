import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiAttendance } from '../../../core/api/api.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { HorariosService } from '../../academico/horarios/services/horarios.service';
import { PortalEstudianteService } from '../../portal-estudiante/services/portal-estudiante.service';
import {
  EstadoAsistencia,
  RegistroAsistenciaAlumno,
  ResumenAsistenciaAlumno,
} from '../models/asistencia-estudiante.model';

@Injectable({ providedIn: 'root' })
export class AsistenciaEstudianteService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly horarios = inject(HorariosService);
  private readonly portal = inject(PortalEstudianteService);
  private readonly base = `${environment.apiUrl}/attendances`;

  private readonly _registros = signal<RegistroAsistenciaAlumno[]>([]);
  readonly registros = this._registros.asReadonly();
  readonly loading = signal(false);

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);

    const perfil$ = this.auth.hasRole('ESTUDIANTE')
      ? this.portal.ensureLoaded()
      : of(null);

    perfil$.pipe(
      switchMap(perfil => {
        const studentId = perfil?.studentId;
        const params = studentId
          ? new HttpParams().set('studentId', String(studentId))
          : undefined;
        return this.http.get<ApiAttendance[]>(this.base, { params }).pipe(
          map(items => ({ items, studentId })),
        );
      }),
      tap(({ items, studentId }) => {
        const id = studentId ? String(studentId) : this.getEstudianteId();
        this._registros.set(
          items
            .filter(r => String(r.studentId) === id)
            .map(r => ({
              id: r.id,
              estudianteId: String(r.studentId),
              fecha: r.fecha.slice(0, 10),
              estado: r.estado,
              observacion: r.observacion,
            })),
        );
        this.loading.set(false);
      }),
      catchError(() => {
        this.loading.set(false);
        return of([]);
      }),
    ).subscribe();
  }

  getEstudianteId(): string {
    return this.portal.getStudentIdString() || '5';
  }

  getPerfil() {
    return this.horarios.getPerfilEstudiante();
  }

  getRegistros(): RegistroAsistenciaAlumno[] {
    return this._registros()
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  filtrarRegistros(
    registros: RegistroAsistenciaAlumno[],
    estado: EstadoAsistencia | 'TODOS',
  ): RegistroAsistenciaAlumno[] {
    if (estado === 'TODOS') return registros;
    return registros.filter((r) => r.estado === estado);
  }

  filtrarPorMes(
    registros: RegistroAsistenciaAlumno[],
    mes: string | 'TODOS',
  ): RegistroAsistenciaAlumno[] {
    if (mes === 'TODOS') return registros;
    return registros.filter((r) => r.fecha.startsWith(mes));
  }

  obtenerMesesDisponibles(registros: RegistroAsistenciaAlumno[]): string[] {
    const meses = new Set(registros.map((r) => r.fecha.slice(0, 7)));
    return Array.from(meses).sort((a, b) => b.localeCompare(a));
  }

  calcularResumen(registros: RegistroAsistenciaAlumno[]): ResumenAsistenciaAlumno {
    const totalDias = registros.length;
    const presentes = registros.filter((r) => r.estado === 'P').length;
    const faltas = registros.filter((r) => r.estado === 'F').length;
    const tardanzas = registros.filter((r) => r.estado === 'T').length;
    const justificadas = registros.filter((r) => r.estado === 'J').length;
    const inasistenciasNetas = Math.max(faltas - justificadas, 0);
    const asistenciaPct = totalDias ? Math.round((presentes / totalDias) * 100) : 0;
    return {
      totalDias,
      presentes,
      faltas,
      tardanzas,
      justificadas,
      inasistenciasNetas,
      asistenciaPct,
    };
  }

  estadoLabel(estado: EstadoAsistencia): string {
    return {
      P: 'Presente',
      F: 'Falta',
      T: 'Tardanza',
      J: 'Justificada',
    }[estado];
  }

  estadoBadge(estado: EstadoAsistencia): string {
    return {
      P: 'badge-green',
      F: 'badge-red',
      T: 'badge-yellow',
      J: 'badge-blue',
    }[estado];
  }

  formatFecha(fechaISO: string): string {
    return format(parseISO(fechaISO), 'dd/MM/yyyy', { locale: es });
  }

  formatDia(fechaISO: string): string {
    return format(parseISO(fechaISO), 'EEEE', { locale: es });
  }

  formatMes(mesISO: string): string {
    return format(parseISO(`${mesISO}-01`), 'MMMM yyyy', { locale: es });
  }
}
