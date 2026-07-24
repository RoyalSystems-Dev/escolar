import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ComunicadosService, TipoCom } from '../../comunicaciones/comunicados/comunicados.service';
import { SeguimientoService } from './seguimiento.service';
import { JustificacionesPadreService } from '../justificaciones/justificaciones-padre.service';
import {
  JustificacionItem,
  MOTIVOS_JUSTIFICACION,
  PendienteJustificacion,
} from '../../asistencia/justificaciones/justificaciones.model';
import {
  SeguimientoVista,
  cursoStyle,
  estadoAsistenciaBadge,
  estadoAsistenciaLabel,
  nivelBadge,
  notaColor,
  parentescoLabel,
  tareaEstadoBadge,
  tareaEstadoLabel,
  taskFileUrl,
} from './seguimiento.model';

const TIPO_COM_CFG: Record<TipoCom, { badge: string; label: string }> = {
  general:        { badge: 'badge-blue',   label: 'General' },
  academico:      { badge: 'badge-indigo', label: 'Académico' },
  administrativo: { badge: 'badge-gray',   label: 'Administrativo' },
  urgente:        { badge: 'badge-red',    label: 'Urgente' },
  evento:         { badge: 'badge-purple', label: 'Evento' },
};

@Component({
  standalone: true,
  imports: [FormsModule, NgClass, DecimalPipe, RouterLink],
  template: `
    <div class="space-y-5 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Portal de apoderados</h2>
          <p class="text-sm text-gray-400 mt-0.5">
            Bienvenido/a, {{ auth.nombreCompleto() }} · Resumen del avance de tus hijos
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="cargar()" [disabled]="svc.loadingHijos() || svc.loadingTracking()">
          <span class="icon icon-sm">refresh</span> Actualizar
        </button>
      </div>

      <!-- Comunicados activos -->
      <div class="card p-5">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h3 class="font-semibold text-gray-800 flex items-center gap-2">
            <span class="icon text-indigo-600">campaign</span> Comunicados activos
          </h3>
          <a routerLink="/portal-padre/comunicacion" class="text-xs text-indigo-600 hover:underline font-medium">
            Ver todos
          </a>
        </div>
        @if (comunicadosSvc.loading()) {
          <p class="text-sm text-gray-400 py-4 text-center">Cargando comunicados…</p>
        } @else if (!comunicadosActivos().length) {
          <p class="text-sm text-gray-400 py-4 text-center">No hay comunicados activos para padres.</p>
        } @else {
          <div class="space-y-2">
            @for (c of comunicadosActivos(); track c.id) {
              <a routerLink="/portal-padre/comunicacion"
                class="block p-3 rounded-xl border border-gray-100 hover:bg-indigo-50/50 hover:border-indigo-100 transition-colors">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <p class="text-sm font-medium text-gray-800">{{ c.titulo }}</p>
                  <div class="flex items-center gap-1 shrink-0">
                    <span class="badge text-[10px]" [ngClass]="tipoComCfg(c.tipo).badge">
                      {{ tipoComCfg(c.tipo).label }}
                    </span>
                    @if (c.prioridad === 'alta' || c.tipo === 'urgente') {
                      <span class="badge badge-red text-[10px]">Urgente</span>
                    }
                  </div>
                </div>
                <p class="text-xs text-gray-500 line-clamp-2">{{ c.cuerpo }}</p>
                <p class="text-[11px] text-gray-400 mt-1">{{ c.fechaPublicacion }} · {{ c.autor }}</p>
              </a>
            }
          </div>
        }
      </div>

      @if (svc.loadingHijos()) {
        <div class="card p-12 flex flex-col items-center text-gray-400">
          <span class="icon icon-xl animate-spin mb-3">progress_activity</span>
          <p class="text-sm">Cargando hijos vinculados…</p>
        </div>
      } @else if (!svc.hijos().length) {
        <div class="card p-16 flex flex-col items-center justify-center text-center">
          <span class="text-4xl mb-4">👨‍👩‍👧</span>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Sin hijos vinculados</h3>
          <p class="text-gray-500 text-sm">Contacta con la institución para vincular a tus hijos a tu cuenta.</p>
        </div>
      } @else {
        @if (svc.hijos().length > 1) {
          <div class="card p-4">
            <label class="form-label mb-2 block">Seleccionar hijo/a</label>
            <div class="flex flex-wrap gap-2">
              @for (h of svc.hijos(); track h.studentId) {
                <button type="button" class="px-4 py-2.5 rounded-xl border text-sm font-medium transition-all"
                  [ngClass]="hijoSeleccionado() === h.studentId
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'"
                  (click)="seleccionarHijo(h.studentId)">
                  {{ h.nombreCompleto }}
                  <span class="text-xs text-gray-400 ml-1">· {{ h.aulaLabel }}</span>
                </button>
              }
            </div>
          </div>
        }

        @if (svc.loadingTracking()) {
          <div class="card p-12 flex flex-col items-center text-gray-400">
            <span class="icon icon-xl animate-spin mb-3">progress_activity</span>
            <p class="text-sm">Cargando información de tus hijos…</p>
          </div>
        } @else if (data(); as d) {
          <div class="card p-4 bg-gradient-to-r from-indigo-50 to-white border-indigo-100">
            <div class="flex flex-wrap items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl shrink-0">
                🎓
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-gray-900">{{ d.estudiante.nombreCompleto }}</h3>
                <p class="text-sm text-gray-500">{{ d.estudiante.aulaLabel }}</p>
                <span class="badge badge-indigo text-xs mt-1">{{ parentescoLabel(d.estudiante.parentesco) }}</span>
              </div>
              @if (d.promedioGeneral !== null) {
                <div class="text-right">
                  <p class="text-xs text-gray-400">Promedio general</p>
                  <p class="text-3xl font-bold" [ngClass]="notaColor(d.promedioGeneral)">
                    {{ d.promedioGeneral | number:'1.1-1' }}
                  </p>
                  @if (d.nivelGeneral) {
                    <span class="badge text-xs" [ngClass]="nivelBadge(d.nivelGeneral)">{{ d.nivelGeneral }}</span>
                  }
                </div>
              }
            </div>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            @for (kpi of kpis(); track kpi.label) {
              <button type="button" class="card p-4 text-left hover:shadow-md transition-shadow"
                [ngClass]="vista() === kpi.vista ? 'ring-2 ring-indigo-400' : ''"
                (click)="vista.set(kpi.vista)">
                <p class="text-xs text-gray-400">{{ kpi.label }}</p>
                <p class="text-xl font-bold mt-1" [ngClass]="kpi.text ?? 'text-gray-900'">{{ kpi.value }}</p>
              </button>
            }
          </div>

          <div class="tabs">
            @for (tab of tabs; track tab.id) {
              <button class="tab" [class.tab-active]="vista() === tab.id" (click)="vista.set(tab.id)">
                <span class="icon icon-sm">{{ tab.icon }}</span> {{ tab.label }}
              </button>
            }
          </div>

          @if (vista() === 'resumen') {
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="card p-5">
                <h4 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span class="icon text-indigo-500">grading</span> Rendimiento por curso
                </h4>
                @if (!d.cursos.length) {
                  <p class="text-sm text-gray-400 text-center py-6">Sin cursos asignados en el horario</p>
                } @else {
                  <div class="space-y-3">
                    @for (c of d.cursos; track c.curso) {
                      @let style = cursoStyle(c.curso);
                      <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                          [ngClass]="style.colorClass">{{ style.emoji }}</div>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-gray-800 truncate">{{ c.curso }}</p>
                          <p class="text-xs text-gray-400">
                            B1: {{ valorBimestre(c.b1, c.b1Nivel) }} · B2: {{ valorBimestre(c.b2, c.b2Nivel) }}
                          </p>
                        </div>
                        <div class="text-right shrink-0">
                          @if (c.promedio !== null) {
                            <p class="font-bold" [ngClass]="notaColor(c.promedio)">{{ c.promedio | number:'1.1-1' }}</p>
                            @if (c.nivel) {
                              <span class="badge text-[10px]" [ngClass]="nivelBadge(c.nivel)">{{ c.nivel }}</span>
                            }
                          } @else if (c.nivel) {
                            <span class="badge text-xs" [ngClass]="nivelBadge(c.nivel)">{{ c.nivel }}</span>
                          } @else {
                            <p class="text-sm text-gray-400">Sin promedio</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="space-y-4">
                <div class="card p-5">
                  <h4 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span class="icon text-emerald-500">fact_check</span> Asistencia del mes
                  </h4>
                  <div class="flex items-center gap-4 mb-4">
                    <p class="text-4xl font-bold"
                      [ngClass]="d.asistencia.asistenciaPct >= 90 ? 'text-emerald-600' : d.asistencia.asistenciaPct >= 75 ? 'text-amber-600' : 'text-red-600'">
                      {{ d.asistencia.asistenciaPct }}%
                    </p>
                    <div class="text-sm text-gray-500">
                      <p>{{ d.asistencia.presentes }} presentes</p>
                      <p>{{ d.asistencia.faltas }} faltas · {{ d.asistencia.tardanzas }} tardanzas</p>
                    </div>
                  </div>
                  @if (d.asistencia.reciente.length) {
                    <div class="space-y-2">
                      @for (a of d.asistencia.reciente.slice(0, 4); track a.id) {
                        <div class="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                          <span class="text-gray-600">{{ formatFecha(a.fecha) }}</span>
                          <span class="badge text-xs" [ngClass]="estadoAsistenciaBadge(a.estado)">
                            {{ estadoAsistenciaLabel(a.estado) }}
                          </span>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="card p-5">
                  <h4 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span class="icon text-amber-500">assignment</span> Tareas activas
                  </h4>
                  @if (!tareasActivas().length) {
                    <p class="text-sm text-gray-400 text-center py-4">Sin tareas pendientes o vencidas</p>
                  } @else {
                    <div class="space-y-2">
                      @for (t of tareasActivas().slice(0, 4); track t.id) {
                        <div class="p-3 rounded-lg bg-gray-50">
                          <p class="text-sm font-medium text-gray-800">{{ t.titulo }}</p>
                          <div class="flex items-center justify-between mt-1">
                            <p class="text-xs text-gray-500">{{ t.curso }} · {{ formatFecha(t.fechaEntrega) }}</p>
                            <span class="badge text-[10px]" [ngClass]="tareaEstadoBadge(t.estado)">
                              {{ tareaEstadoLabel(t.estado) }}
                            </span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          @if (vista() === 'notas') {
            <div class="space-y-4">
              @if (!d.cursos.length) {
                <div class="card p-12 text-center text-gray-400">
                  <p class="text-sm">No hay cursos asignados en el horario de este estudiante.</p>
                </div>
              } @else {
                @for (c of d.cursos; track c.curso) {
                  @let style = cursoStyle(c.curso);
                  <div class="card overflow-hidden">
                    <div class="p-4 flex flex-wrap items-center gap-4 border-b border-gray-100">
                      <div class="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0"
                        [ngClass]="style.colorClass">{{ style.emoji }}</div>
                      <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-gray-800">{{ c.curso }}</h4>
                        <p class="text-xs text-gray-400">
                          B1: {{ valorBimestre(c.b1, c.b1Nivel) }} · B2: {{ valorBimestre(c.b2, c.b2Nivel) }} ·
                          B3: {{ valorBimestre(c.b3, c.b3Nivel) }} · B4: {{ valorBimestre(c.b4, c.b4Nivel) }}
                        </p>
                      </div>
                      <div class="text-right">
                        @if (c.promedio !== null) {
                          <p class="text-xl font-bold" [ngClass]="notaColor(c.promedio)">{{ c.promedio | number:'1.1-1' }}</p>
                          @if (c.nivel) {
                            <span class="badge text-xs" [ngClass]="nivelBadge(c.nivel)">{{ c.nivel }}</span>
                          }
                        } @else if (c.nivel) {
                          <span class="badge text-xs" [ngClass]="nivelBadge(c.nivel)">{{ c.nivel }}</span>
                        } @else {
                          <p class="text-sm text-gray-400">Sin promedio</p>
                        }
                      </div>
                    </div>
                    @if (c.ultimasNotas.length) {
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead>
                            <tr class="bg-gray-50 text-xs text-gray-500">
                              <th class="text-left px-4 py-2 font-medium">Evaluación</th>
                              <th class="text-center px-4 py-2 font-medium w-24">Fecha</th>
                              <th class="text-center px-4 py-2 font-medium w-16">Bim.</th>
                              <th class="text-center px-4 py-2 font-medium w-20">Nota</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-gray-50">
                            @for (n of c.ultimasNotas; track n.id) {
                              <tr>
                                <td class="px-4 py-2.5 text-gray-700">{{ n.descripcion }}</td>
                                <td class="px-4 py-2.5 text-center text-gray-500">{{ formatFecha(n.fecha) }}</td>
                                <td class="px-4 py-2.5 text-center text-gray-500">{{ n.bimestre }}°</td>
                                <td class="px-4 py-2.5 text-center font-semibold" [ngClass]="notaColor(n.nota)">
                                  {{ n.nota | number:'1.1-1' }}
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }

          @if (vista() === 'asistencia') {
            <div class="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <div class="card p-4 lg:col-span-2">
                <p class="text-xs text-gray-500">Asistencia</p>
                <p class="text-3xl font-bold mt-1"
                  [ngClass]="d.asistencia.asistenciaPct >= 90 ? 'text-emerald-600' : d.asistencia.asistenciaPct >= 75 ? 'text-amber-600' : 'text-red-600'">
                  {{ d.asistencia.asistenciaPct }}%
                </p>
              </div>
              <div class="card p-4"><p class="text-xs text-gray-500">Días</p><p class="text-2xl font-bold text-gray-800">{{ d.asistencia.totalDias }}</p></div>
              <div class="card p-4 border-l-4 border-l-emerald-400"><p class="text-xs text-emerald-600">Presentes</p><p class="text-2xl font-bold text-emerald-600">{{ d.asistencia.presentes }}</p></div>
              <div class="card p-4 border-l-4 border-l-red-400"><p class="text-xs text-red-600">Faltas</p><p class="text-2xl font-bold text-red-600">{{ d.asistencia.faltas }}</p></div>
              <div class="card p-4 border-l-4 border-l-blue-400"><p class="text-xs text-blue-600">Justificadas</p><p class="text-2xl font-bold text-blue-600">{{ d.asistencia.justificadas }}</p></div>
            </div>

            @if (pendienteActual(); as p) {
              <div class="card p-4 border-l-4 border-l-red-400 bg-red-50/40">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-gray-900 flex items-center gap-2">
                      <span class="icon text-red-500">event_busy</span>
                      Faltas sin justificar
                    </p>
                    <p class="text-sm text-gray-600 mt-1">
                      {{ p.faltasSinJustificar }} falta(s) pendiente(s)
                      @if (p.ultimaFalta) {
                        · última: {{ p.ultimaFalta }}
                      }
                    </p>
                  </div>
                  <button type="button" class="btn btn-primary btn-sm shrink-0"
                    (click)="abrirModalJustificar(p)" [disabled]="justSvc.saving()">
                    <span class="icon icon-sm">fact_check</span> Justificar falta
                  </button>
                </div>
              </div>
            } @else if (!justSvc.loading()) {
              <div class="card p-4 bg-emerald-50/50 border border-emerald-100">
                <p class="text-sm text-emerald-800 flex items-center gap-2">
                  <span class="icon icon-sm">check_circle</span>
                  No hay faltas pendientes de justificar para {{ d.estudiante.nombreCompleto }}.
                </p>
              </div>
            }

            @if (historialJustificaciones().length) {
              <div class="card overflow-hidden">
                <div class="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">
                  Justificaciones registradas
                </div>
                <div class="divide-y divide-gray-50">
                  @for (j of historialJustificaciones(); track j.id) {
                    <div class="px-4 py-3">
                      <div class="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p class="text-sm font-medium text-gray-900">{{ j.motivo }}</p>
                          <p class="text-xs text-gray-500 mt-0.5">
                            {{ j.cantidad }} falta(s) · {{ j.fechas.join(', ') }}
                          </p>
                          @if (j.observacion) {
                            <p class="text-xs text-gray-400 mt-1">{{ j.observacion }}</p>
                          }
                        </div>
                        <span class="text-[11px] text-gray-400 whitespace-nowrap">{{ j.fechaRegistro }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="card overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">Registro reciente</div>
              @if (!d.asistencia.reciente.length) {
                <p class="text-sm text-gray-400 text-center py-8">Sin registros de asistencia</p>
              } @else {
                <div class="divide-y divide-gray-50">
                  @for (a of d.asistencia.reciente; track a.id) {
                    <div class="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p class="text-sm font-medium text-gray-800">{{ formatFecha(a.fecha) }}</p>
                        @if (a.observacion) {
                          <p class="text-xs text-gray-500 mt-0.5">{{ a.observacion }}</p>
                        }
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="badge text-xs" [ngClass]="estadoAsistenciaBadge(a.estado)">
                          {{ estadoAsistenciaLabel(a.estado) }}
                        </span>
                        @if (a.estado === 'F') {
                          <button type="button" class="btn btn-secondary btn-sm"
                            (click)="abrirModalJustificarDesdeFalta()" [disabled]="justSvc.saving()">
                            Justificar
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }

          @if (vista() === 'tareas') {
            <div class="space-y-3">
              @if (!d.tareas.length) {
                <div class="card p-12 text-center text-gray-400">
                  <p class="text-sm">No hay tareas asignadas.</p>
                </div>
              } @else {
                @for (t of d.tareas; track t.id) {
                  <div class="card p-4"
                    [ngClass]="t.estado === 'OVERDUE' ? 'border-l-4 border-l-red-400' : t.estado === 'GRADED' ? 'border-l-4 border-l-indigo-400' : ''">
                    <div class="flex flex-wrap items-start gap-4">
                      <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1">
                          <h4 class="font-semibold text-gray-800">{{ t.titulo }}</h4>
                          <span class="badge text-xs" [ngClass]="tareaEstadoBadge(t.estado)">{{ tareaEstadoLabel(t.estado) }}</span>
                          <span class="badge text-xs"
                            [ngClass]="t.prioridad === 'alta' ? 'badge-red' : t.prioridad === 'media' ? 'badge-yellow' : 'badge-gray'">
                            {{ t.prioridad }}
                          </span>
                        </div>
                        <p class="text-sm text-gray-500">{{ t.curso }} · Entrega: {{ formatFecha(t.fechaEntrega) }}</p>
                        @if (t.fechaEntregaReal) {
                          <p class="text-xs text-gray-400 mt-1">Enviada: {{ formatFecha(t.fechaEntregaReal) }}</p>
                        }
                        @if (t.archivoEntregaNombre) {
                          <a [href]="taskFileUrl(t.archivoEntregaUrl)" target="_blank" rel="noopener"
                            class="inline-flex items-center gap-1.5 mt-2 text-xs text-indigo-600 hover:underline">
                            <span class="icon icon-sm">attach_file</span> {{ t.archivoEntregaNombre }}
                          </a>
                        }
                        @if (t.comentarioEntrega) {
                          <p class="text-xs text-gray-500 mt-2 italic">"{{ t.comentarioEntrega }}"</p>
                        }
                        @if (t.estado === 'GRADED') {
                          <div class="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                            <p class="text-sm font-semibold text-indigo-800">
                              Calificación: {{ t.nota ?? '—' }}/20
                            </p>
                            @if (t.retroalimentacion) {
                              <p class="text-sm text-indigo-900 mt-1">{{ t.retroalimentacion }}</p>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              }
            </div>
          }
        }
      }
    </div>

    @if (modalJustificar()) {
      <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        (click)="cerrarModalJustificar()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h3 class="font-bold text-gray-900">Justificar falta</h3>
              <p class="text-xs text-gray-500">{{ data()?.estudiante?.nombreCompleto }}</p>
            </div>
            <button type="button" class="btn-icon text-gray-400" (click)="cerrarModalJustificar()">
              <span class="icon">close</span>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div class="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
              <span class="text-sm text-gray-700">Faltas sin justificar</span>
              <span class="font-bold text-red-600 text-lg">{{ pendienteActual()?.faltasSinJustificar ?? 0 }}</span>
            </div>
            <div>
              <label class="form-label">Cantidad a justificar</label>
              <input type="number" class="form-input mt-1" min="1"
                [max]="pendienteActual()?.faltasSinJustificar ?? 1"
                [(ngModel)]="formJustificar.cantidad">
            </div>
            <div>
              <label class="form-label">Motivo <span class="text-red-500">*</span></label>
              <select class="form-select mt-1" [(ngModel)]="formJustificar.motivo">
                <option value="">— Seleccionar —</option>
                @for (m of motivosJustificacion; track m) {
                  <option [value]="m">{{ m }}</option>
                }
              </select>
            </div>
            @if (formJustificar.motivo === 'Otro') {
              <div>
                <label class="form-label">Especificar</label>
                <input class="form-input mt-1" placeholder="Describe el motivo..." [(ngModel)]="formJustificar.motivoOtro">
              </div>
            }
            <div>
              <label class="form-label">Observaciones (opcional)</label>
              <textarea class="form-input mt-1 min-h-20 resize-none"
                placeholder="Adjunta detalle del certificado o constancia..."
                [(ngModel)]="formJustificar.observacion"></textarea>
            </div>
            @if (errorJustificar()) {
              <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {{ errorJustificar() }}
              </div>
            }
          </div>
          <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
            <button type="button" class="btn btn-secondary" (click)="cerrarModalJustificar()">Cancelar</button>
            <button type="button" class="btn btn-primary" (click)="confirmarJustificacion()"
              [disabled]="justSvc.saving() || !motivoJustificarValido()">
              {{ justSvc.saving() ? 'Enviando...' : 'Enviar justificación' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (toastJustificar()) {
      <div class="fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-lg z-50 text-white flex items-center gap-2"
        [ngClass]="toastJustificar()!.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'">
        <span class="icon">{{ toastJustificar()!.tipo === 'success' ? 'check_circle' : 'error' }}</span>
        {{ toastJustificar()!.mensaje }}
      </div>
    }
  `,
})
export class SeguimientoComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly auth = inject(AuthService);
  readonly svc = inject(SeguimientoService);
  readonly justSvc = inject(JustificacionesPadreService);
  readonly comunicadosSvc = inject(ComunicadosService);

  readonly motivosJustificacion = MOTIVOS_JUSTIFICACION;
  readonly hijoSeleccionado = signal<number | null>(null);
  readonly vista = signal<SeguimientoVista>('resumen');
  readonly pendienteActual = signal<PendienteJustificacion | null>(null);
  readonly historialJustificaciones = signal<JustificacionItem[]>([]);
  readonly modalJustificar = signal(false);
  readonly errorJustificar = signal('');
  readonly toastJustificar = signal<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  formJustificar = { cantidad: 1, motivo: '', motivoOtro: '', observacion: '' };

  readonly tabs: { id: SeguimientoVista; label: string; icon: string }[] = [
    { id: 'resumen', label: 'Resumen', icon: 'dashboard' },
    { id: 'notas', label: 'Notas', icon: 'grading' },
    { id: 'asistencia', label: 'Asistencia', icon: 'fact_check' },
    { id: 'tareas', label: 'Tareas', icon: 'assignment' },
  ];

  readonly data = computed(() => this.svc.seguimiento());

  readonly comunicadosActivos = computed(() =>
    this.comunicadosSvc.paraPadres().slice(0, 4),
  );

  readonly tareasActivas = computed(() => {
    const tareas = this.data()?.tareas ?? [];
    return tareas.filter(t => t.estado === 'PENDING' || t.estado === 'OVERDUE');
  });

  readonly kpis = computed(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { label: 'Promedio', value: d.promedioGeneral !== null ? d.promedioGeneral.toFixed(1) : '—', text: notaColor(d.promedioGeneral), vista: 'notas' as SeguimientoVista },
      { label: 'Asistencia', value: `${d.asistencia.asistenciaPct}%`, text: d.asistencia.asistenciaPct >= 90 ? 'text-emerald-600' : d.asistencia.asistenciaPct >= 75 ? 'text-amber-600' : 'text-red-600', vista: 'asistencia' as SeguimientoVista },
      { label: 'Tareas pendientes', value: d.tareasPendientes + d.tareasVencidas, text: 'text-amber-600', vista: 'tareas' as SeguimientoVista },
      { label: 'Entregadas', value: d.tareasEntregadas, text: 'text-emerald-600', vista: 'tareas' as SeguimientoVista },
      { label: 'Calificadas', value: d.tareasCalificadas ?? 0, text: 'text-indigo-600', vista: 'tareas' as SeguimientoVista },
    ];
  });

  cursoStyle = cursoStyle;
  notaColor = notaColor;
  nivelBadge = nivelBadge;
  parentescoLabel = parentescoLabel;
  estadoAsistenciaLabel = estadoAsistenciaLabel;
  estadoAsistenciaBadge = estadoAsistenciaBadge;
  tareaEstadoLabel = tareaEstadoLabel;
  tareaEstadoBadge = tareaEstadoBadge;
  taskFileUrl = taskFileUrl;

  valorBimestre(nota: number | null | undefined, nivel: string | null | undefined): string {
    if (nota !== null && nota !== undefined) return String(nota);
    if (nivel) return nivel;
    return '—';
  }

  tipoComCfg(tipo: TipoCom) {
    return TIPO_COM_CFG[tipo] ?? TIPO_COM_CFG.general;
  }

  ngOnInit(): void {
    this.layout.setTitle('Inicio');
    this.comunicadosSvc.load();
    this.cargar();
  }

  cargar(): void {
    this.svc.loadHijos().subscribe({
      next: hijos => {
        this.svc.hijos.set(hijos);
        const current = this.hijoSeleccionado();
        const target = hijos.find(h => h.studentId === current)?.studentId ?? hijos[0]?.studentId ?? null;
        if (target) this.seleccionarHijo(target);
      },
    });
  }

  seleccionarHijo(studentId: number): void {
    this.hijoSeleccionado.set(studentId);
    this.svc.loadSeguimiento(studentId).subscribe({
      next: data => {
        this.svc.seguimiento.set(data);
        this.cargarJustificaciones(studentId);
      },
    });
  }

  cargarJustificaciones(studentId: number): void {
    this.justSvc.loadPending(studentId).subscribe({
      next: items => this.pendienteActual.set(items[0] ?? null),
      error: () => this.pendienteActual.set(null),
    });
    this.justSvc.loadHistorial(studentId).subscribe({
      next: items => this.historialJustificaciones.set(items),
      error: () => this.historialJustificaciones.set([]),
    });
  }

  abrirModalJustificar(p: PendienteJustificacion): void {
    this.pendienteActual.set(p);
    this.formJustificar = { cantidad: 1, motivo: '', motivoOtro: '', observacion: '' };
    this.errorJustificar.set('');
    this.modalJustificar.set(true);
  }

  abrirModalJustificarDesdeFalta(): void {
    const p = this.pendienteActual();
    if (p) this.abrirModalJustificar(p);
  }

  cerrarModalJustificar(): void {
    this.modalJustificar.set(false);
    this.errorJustificar.set('');
  }

  motivoJustificarValido(): boolean {
    if (!this.formJustificar.motivo) return false;
    if (this.formJustificar.motivo === 'Otro') {
      return this.formJustificar.motivoOtro.trim().length >= 2;
    }
    return true;
  }

  confirmarJustificacion(): void {
    const studentId = this.hijoSeleccionado();
    const p = this.pendienteActual();
    if (!studentId || !p || !this.motivoJustificarValido()) return;

    const cantidad = Math.min(
      Math.max(1, this.formJustificar.cantidad),
      p.faltasSinJustificar,
    );
    const motivo = this.formJustificar.motivo === 'Otro'
      ? this.formJustificar.motivoOtro.trim()
      : this.formJustificar.motivo;

    this.errorJustificar.set('');
    this.justSvc.create(studentId, {
      cantidad,
      motivo,
      observacion: this.formJustificar.observacion.trim() || undefined,
    }).subscribe({
      next: () => {
        this.cerrarModalJustificar();
        this.mostrarToastJustificar('Justificación enviada correctamente');
        this.seleccionarHijo(studentId);
      },
      error: (err) => this.errorJustificar.set(err.message),
    });
  }

  private mostrarToastJustificar(mensaje: string, tipo: 'success' | 'error' = 'success'): void {
    this.toastJustificar.set({ mensaje, tipo });
    setTimeout(() => this.toastJustificar.set(null), 3500);
  }

  formatFecha(fecha: string): string {
    return format(parseISO(fecha.slice(0, 10)), 'dd/MM/yyyy', { locale: es });
  }
}
