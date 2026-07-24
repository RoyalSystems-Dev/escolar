import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { format, parseISO, differenceInCalendarDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { catchError, finalize, of, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { SeguimientoService } from '../seguimiento/seguimiento.service';
import {
  TareaEstado,
  TareaPrioridad,
  TareaRecursoDocente,
  TareaVista,
  diasRestantesLabel,
  estadoBadge,
  estadoLabel,
  prioridadBadge,
  prioridadLabel,
} from '../../portal-estudiante/tareas/tareas.model';

export interface TareaPadreApi {
  id: number;
  titulo: string;
  curso: string;
  fechaEntrega: string;
  estado: TareaEstado;
  prioridad: TareaPrioridad;
  resourceId: number | null;
  resource: TareaRecursoDocente | null;
  comentarioEntrega?: string;
  archivoEntregaUrl?: string | null;
  archivoEntregaNombre?: string | null;
  fechaEntregaReal?: string | null;
  nota?: number | null;
  retroalimentacion?: string;
  calificadoAt?: string | null;
}

export interface TareaPadreItem {
  id: number;
  titulo: string;
  curso: string;
  fechaEntrega: string;
  estado: TareaEstado;
  prioridad: TareaPrioridad;
  diasRestantes: number;
  venceHoy: boolean;
  vencida: boolean;
  resourceId: number | null;
  recurso: TareaRecursoDocente | null;
  comentarioEntrega: string;
  archivoEntregaUrl: string | null;
  archivoEntregaNombre: string | null;
  fechaEntregaReal: string | null;
  nota: number | null;
  retroalimentacion: string;
  calificadoAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class TareasPadreService {
  private readonly http = inject(HttpClient);
  private readonly seguimiento = inject(SeguimientoService);
  private readonly base = `${environment.apiUrl}/parents`;

  readonly loading = signal(false);
  private readonly _tareas = signal<TareaPadreItem[]>([]);
  readonly tareas = this._tareas.asReadonly();

  readonly pendientes = computed(() => this._tareas().filter(t => t.estado === 'PENDING'));
  readonly entregadas = computed(() => this._tareas().filter(t => t.estado === 'SUBMITTED'));
  readonly vencidas = computed(() => this._tareas().filter(t => t.estado === 'OVERDUE'));
  readonly calificadas = computed(() => this._tareas().filter(t => t.estado === 'GRADED'));

  readonly cursosDisponibles = computed(() =>
    [...new Set(this._tareas().map(t => t.curso))].sort(),
  );

  load(studentId: number): void {
    this.loading.set(true);
    const params = new HttpParams().set('email', this.seguimiento.parentEmail());

    this.http.get<{ tareas: TareaPadreApi[] }>(`${this.base}/children/${studentId}/tasks`, { params }).pipe(
      tap(res => this._tareas.set(res.tareas.map(t => this.mapTask(t)))),
      catchError(() => {
        this._tareas.set([]);
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }

  filtrar(vista: TareaVista, curso: string, busqueda: string): TareaPadreItem[] {
    const q = busqueda.trim().toLowerCase();
    return this._tareas().filter(t => {
      if (vista === 'pendientes' && t.estado !== 'PENDING') return false;
      if (vista === 'entregadas' && t.estado !== 'SUBMITTED') return false;
      if (vista === 'vencidas' && t.estado !== 'OVERDUE') return false;
      if (vista === 'calificadas' && t.estado !== 'GRADED') return false;
      if (curso && t.curso !== curso) return false;
      if (q && !`${t.titulo} ${t.curso}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  estadoLabel = estadoLabel;
  estadoBadge = estadoBadge;
  prioridadLabel = prioridadLabel;
  prioridadBadge = prioridadBadge;
  diasRestantesLabel = diasRestantesLabel;

  formatFecha(fecha: string): string {
    return format(parseISO(fecha.slice(0, 10)), 'dd/MM/yyyy', { locale: es });
  }

  private mapTask(t: TareaPadreApi): TareaPadreItem {
    const hoy = startOfDay(new Date());
    const entrega = startOfDay(parseISO(t.fechaEntrega.slice(0, 10)));
    const dias = differenceInCalendarDays(entrega, hoy);
    const vencida = t.estado === 'OVERDUE' || (t.estado === 'PENDING' && dias < 0);
    const venceHoy = dias === 0 && t.estado === 'PENDING';

    return {
      id: t.id,
      titulo: t.titulo,
      curso: t.curso,
      fechaEntrega: t.fechaEntrega.slice(0, 10),
      estado: vencida && t.estado === 'PENDING' ? 'OVERDUE' : t.estado,
      prioridad: t.prioridad,
      diasRestantes: dias,
      venceHoy,
      vencida: vencida || t.estado === 'OVERDUE',
      resourceId: t.resourceId ?? null,
      recurso: t.resource ?? null,
      comentarioEntrega: t.comentarioEntrega ?? '',
      archivoEntregaUrl: t.archivoEntregaUrl ?? null,
      archivoEntregaNombre: t.archivoEntregaNombre ?? null,
      fechaEntregaReal: t.fechaEntregaReal?.slice(0, 10) ?? null,
      nota: t.nota ?? null,
      retroalimentacion: t.retroalimentacion ?? '',
      calificadoAt: t.calificadoAt ?? null,
    };
  }
}
