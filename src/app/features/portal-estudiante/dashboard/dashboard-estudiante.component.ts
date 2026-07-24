import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { HorariosService } from '../../academico/horarios/services/horarios.service';
import { NotasEstudianteService } from '../../evaluacion/notas/services/notas-estudiante.service';
import { AsistenciaEstudianteService } from '../../asistencia/services/asistencia-estudiante.service';
import { ComunicadosService } from '../../comunicaciones/comunicados/comunicados.service';
import { TareasEstudianteService } from '../tareas/tareas-estudiante.service';

@Component({
  standalone: true,
  imports: [RouterLink, DecimalPipe, NgClass],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Hola, {{ primerNombre() }} 👋</h1>
          <p class="text-gray-500 text-sm mt-1">Este es tu panel académico de hoy</p>
        </div>
        <div class="flex gap-2">
          <a class="btn btn-secondary text-sm" routerLink="/portal-estudiante/horarios">
            <span class="icon text-base mr-1">schedule</span> Ver horarios
          </a>
          <a class="btn btn-primary text-sm" routerLink="/portal-estudiante/tareas">
            <span class="icon text-base mr-1">assignment</span> Mis tareas
          </a>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card p-4">
          <p class="text-xs text-gray-500">Clases de hoy</p>
          <p class="text-2xl font-bold text-indigo-700 mt-1">{{ clasesHoy() }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ clasesPendientesHoy() }} pendientes</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-500">Promedio general</p>
          <p class="text-2xl font-bold mt-1" [ngClass]="notasSvc.notaColor(promedioGeneral())">
            {{ promedioGeneral() | number:'1.1-1' }}
          </p>
          <p class="text-xs text-gray-400 mt-1">Nivel {{ nivelGeneral() }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-500">Asistencia del mes</p>
          <p class="text-2xl font-bold mt-1" [ngClass]="asistenciaMes().asistenciaPct >= 90 ? 'text-emerald-600' : asistenciaMes().asistenciaPct >= 75 ? 'text-amber-600' : 'text-red-600'">
            {{ asistenciaMes().asistenciaPct }}%
          </p>
          <p class="text-xs text-gray-400 mt-1">{{ asistenciaMes().presentes }} presentes</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-500">Comunicados activos</p>
          <p class="text-2xl font-bold text-blue-700 mt-1">{{ comunicadosActivos() }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ comunicadosUrgentes() }} urgentes</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800">Resumen de clases de hoy</h3>
            <span class="badge badge-indigo text-xs">{{ perfil().aulaLabel }}</span>
          </div>

          @if (!clasesHoy()) {
            <p class="text-sm text-gray-400 py-6 text-center">
              Hoy no tienes clases programadas.
            </p>
          } @else {
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Clases completadas</span>
                <span class="font-semibold text-emerald-600">{{ clasesCompletadasHoy() }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Clases pendientes</span>
                <span class="font-semibold text-amber-600">{{ clasesPendientesHoy() }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div
                  class="h-full rounded-full bg-indigo-500 transition-all"
                  [style.width.%]="progresoClasesHoy()">
                </div>
              </div>
              <p class="text-xs text-gray-400 mt-1">{{ progresoClasesHoy() }}% de avance del día</p>
            </div>

            <div class="mt-5 p-3 rounded-lg border border-indigo-100 bg-indigo-50/40">
              @if (proximaClase(); as prox) {
                <p class="text-xs text-indigo-600 uppercase tracking-wide font-semibold">Próxima clase</p>
                <p class="text-sm font-semibold text-indigo-800 mt-0.5">{{ prox.curso }}</p>
                <p class="text-xs text-indigo-700">{{ prox.hora }} · {{ prox.docente }}</p>
              } @else {
                <p class="text-sm text-indigo-700">No hay más clases pendientes para hoy.</p>
              }
            </div>
          }
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800">Asistencia reciente</h3>
            <a routerLink="/portal-estudiante/asistencia" class="text-xs text-indigo-600 hover:underline">
              Ver detalle
            </a>
          </div>
          <div class="space-y-2">
            @for (item of asistenciaResumenItems(); track item.label) {
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">{{ item.label }}</span>
                <span class="font-semibold" [ngClass]="item.color">{{ item.value }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800">Tareas pendientes</h3>
            <a routerLink="/portal-estudiante/tareas" class="text-xs text-indigo-600 hover:underline">Ir a tareas</a>
          </div>
          @if (!tareasPendientes().length) {
            <p class="text-sm text-gray-400 py-6 text-center">No tienes tareas pendientes.</p>
          } @else {
            <div class="space-y-2">
              @for (t of tareasPendientes(); track t.id) {
                <div class="p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-medium text-gray-800">{{ t.titulo }}</p>
                      <p class="text-xs text-gray-500 mt-0.5">{{ t.curso }} · Entrega {{ tareasSvc.formatFecha(t.fechaEntrega) }}</p>
                    </div>
                    <span class="badge text-[10px]"
                      [ngClass]="tareasSvc.prioridadBadge(t.prioridad)">
                      {{ tareasSvc.prioridadLabel(t.prioridad) }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800">Comunicados para ti</h3>
            <a routerLink="/portal-estudiante/comunicados" class="text-xs text-indigo-600 hover:underline">
              Ver todos
            </a>
          </div>
          @for (c of comunicadosPreview(); track c.id) {
            <div class="py-2 border-b border-gray-50 last:border-b-0">
              <div class="flex items-center gap-2 mb-1">
                <p class="text-sm font-medium text-gray-800">{{ c.titulo }}</p>
                @if (c.prioridad === 'alta' || c.tipo === 'urgente') {
                  <span class="badge badge-red text-[10px]">Urgente</span>
                }
              </div>
              <p class="text-xs text-gray-500 line-clamp-2">{{ c.cuerpo }}</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DashboardEstudianteComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly auth = inject(AuthService);
  readonly horariosSvc = inject(HorariosService);
  readonly notasSvc = inject(NotasEstudianteService);
  readonly asistenciaSvc = inject(AsistenciaEstudianteService);
  readonly comunicadosSvc = inject(ComunicadosService);
  readonly tareasSvc = inject(TareasEstudianteService);

  readonly perfil = computed(() => this.horariosSvc.getPerfilEstudiante());
  readonly entradas = computed(() => this.horariosSvc.getEntradas(this.perfil()));
  readonly periodos = computed(() => this.horariosSvc.getPeriodos(this.perfil().nivel).filter((p) => !p.isReceso));
  readonly cursos = computed(() => this.notasSvc.getCursos());
  readonly promedioGeneral = computed(() => this.notasSvc.promedioGeneral(this.cursos()));
  readonly nivelGeneral = computed(() => this.notasSvc.nivelDesdeNota(this.promedioGeneral()));

  readonly registrosAsistencia = computed(() => this.asistenciaSvc.getRegistros());
  readonly mesAsistenciaActual = computed(() => {
    const mesActual = this.asistenciaSvc.mesActual();
    const meses = this.asistenciaSvc.obtenerMesesDisponibles(this.registrosAsistencia());
    return meses.includes(mesActual) ? mesActual : (meses[0] ?? mesActual);
  });
  readonly asistenciaMes = computed(() => {
    const porMes = this.asistenciaSvc.filtrarPorMes(this.registrosAsistencia(), this.mesAsistenciaActual());
    return this.asistenciaSvc.calcularResumen(porMes);
  });

  readonly comunicadosActivos = computed(() => this.comunicadosSvc.paraAlumnos().length);
  readonly comunicadosUrgentes = computed(
    () => this.comunicadosSvc.paraAlumnos().filter((c) => c.prioridad === 'alta' || c.tipo === 'urgente').length,
  );
  readonly comunicadosPreview = computed(() => this.comunicadosSvc.paraAlumnos().slice(0, 3));

  readonly hoyDia = computed(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? d - 1 : -1;
  });

  readonly clasesHoy = computed(() => {
    if (this.hoyDia() < 0) return 0;
    return this.entradas().filter((e) => e.dia === this.hoyDia()).length;
  });

  readonly clasesCompletadasHoy = computed(() => {
    if (this.hoyDia() < 0) return 0;
    const now = new Date();
    const minsNow = now.getHours() * 60 + now.getMinutes();
    return this.entradas().filter((e) => {
      if (e.dia !== this.hoyDia()) return false;
      const p = this.periodos().find((x) => x.id === e.periodoId);
      if (!p) return false;
      const [h, m] = p.horaInicio.split(':').map((n) => +n);
      return h * 60 + m <= minsNow;
    }).length;
  });

  readonly clasesPendientesHoy = computed(() => Math.max(this.clasesHoy() - this.clasesCompletadasHoy(), 0));

  readonly progresoClasesHoy = computed(() => {
    const total = this.clasesHoy();
    return total ? Math.round((this.clasesCompletadasHoy() / total) * 100) : 0;
  });

  readonly proximaClase = computed(() => {
    if (this.hoyDia() < 0) return null;
    const now = new Date();
    const minsNow = now.getHours() * 60 + now.getMinutes();
    const candidatas = this.entradas()
      .filter((e) => e.dia === this.hoyDia())
      .map((e) => {
        const periodo = this.periodos().find((p) => p.id === e.periodoId);
        if (!periodo) return null;
        const [h, m] = periodo.horaInicio.split(':').map((n) => +n);
        const inicio = h * 60 + m;
        if (inicio <= minsNow) return null;
        const curso = this.horariosSvc.curById(e.cursoId);
        const docente = this.horariosSvc.docById(e.docenteId);
        return {
          inicio,
          hora: `${periodo.horaInicio} - ${periodo.horaFin}`,
          curso: curso?.nombre ?? 'Curso',
          docente: docente?.abrev ?? 'Docente',
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.inicio - b.inicio);
    return candidatas[0] ?? null;
  });

  readonly asistenciaResumenItems = computed(() => {
    const r = this.asistenciaMes();
    return [
      { label: 'Presentes', value: r.presentes, color: 'text-emerald-600' },
      { label: 'Faltas', value: r.faltas, color: 'text-red-600' },
      { label: 'Tardanzas', value: r.tardanzas, color: 'text-amber-600' },
      { label: 'Inasistencias netas', value: r.inasistenciasNetas, color: 'text-indigo-600' },
    ];
  });

  readonly tareasPendientes = computed(() =>
    this.tareasSvc.pendientes().slice(0, 4),
  );

  ngOnInit(): void {
    this.layout.setTitle('Dashboard Estudiante');
    this.tareasSvc.load();
    this.asistenciaSvc.load();
  }

  primerNombre(): string {
    return this.auth.currentUser()?.nombre?.split(' ')[0] ?? 'Estudiante';
  }
}
