import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SeguimientoService } from './seguimiento.service';
import { JustificacionesPadreService } from '../justificaciones/justificaciones-padre.service';
import { OverlayPortalDirective } from '../../../core/overlay/overlay-portal.directive';
import {
  JustificacionItem,
  MOTIVOS_JUSTIFICACION,
  PendienteJustificacion,
  justificacionAdjuntoUrl,
} from '../../asistencia/justificaciones/justificaciones.model';
import {
  SeguimientoVista,
  cursoStyle,
  estadoAsistenciaBadge,
  estadoAsistenciaLabel,
  alertaAusentismoBadge,
  alertaAusentismoLabel,
  nivelBadge,
  notaColor,
  parentescoLabel,
  tareaEstadoBadge,
  tareaEstadoLabel,
  taskFileUrl,
} from './seguimiento.model';

@Component({
  standalone: true,
  imports: [FormsModule, NgClass, DecimalPipe, RouterLink, OverlayPortalDirective],
  template: `
    <div class="space-y-5 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Seguimiento académico</h2>
          <p class="text-sm text-gray-400 mt-0.5">
            Notas, asistencia y tareas de {{ auth.nombreCompleto() }}
          </p>
        </div>
        <div class="flex gap-2">
          <a routerLink="/portal-padre/inicio" class="btn btn-secondary btn-sm">
            <span class="icon icon-sm">home</span> Inicio
          </a>
          <button class="btn btn-secondary btn-sm" (click)="cargar()" [disabled]="svc.loadingHijos() || svc.loadingTracking()">
            <span class="icon icon-sm">refresh</span> Actualizar
          </button>
        </div>
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

            @if (d.alertasAusentismo?.length) {
              <div class="space-y-3">
                @for (alert of d.alertasAusentismo; track alert.id) {
                  <div class="card p-4 border-l-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    [ngClass]="alert.leidoEnPortal
                      ? 'border-gray-300 bg-gray-50/60'
                      : alert.nivelAlerta === 'critico'
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-amber-400 bg-amber-50/50'">
                    <div class="flex items-start gap-3 min-w-0">
                      <span class="icon shrink-0 mt-0.5"
                        [ngClass]="alert.leidoEnPortal ? 'text-gray-400' : alert.nivelAlerta === 'critico' ? 'text-red-600' : 'text-amber-600'">
                        {{ alert.leidoEnPortal ? 'mark_email_read' : 'notifications_active' }}
                      </span>
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <p class="font-semibold text-gray-900">Alerta de ausentismo · {{ alert.mesLabel }}</p>
                          <span class="badge text-[10px]" [ngClass]="alertaAusentismoBadge(alert.nivelAlerta)">
                            {{ alertaAusentismoLabel(alert.nivelAlerta) }}
                          </span>
                          @if (!alert.leidoEnPortal) {
                            <span class="badge badge-indigo text-[10px]">Nueva</span>
                          }
                        </div>
                        <p class="text-sm text-gray-700 mt-1">
                          <strong>{{ alert.faltasInjustificadas }}</strong> falta(s) injustificada(s)
                          · {{ alert.diasConsecutivos }} día(s) consecutivo(s)
                        </p>
                        @if (alert.motivoAlerta) {
                          <p class="text-xs text-gray-500 mt-1">{{ alert.motivoAlerta }}</p>
                        }
                        <p class="text-[11px] text-gray-400 mt-2">
                          Notificado el {{ alert.notificadoAt }}
                          @if (alert.correoEnviado) { · también enviado a su correo }
                        </p>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-2 shrink-0">
                      @if (!alert.leidoEnPortal) {
                        <button type="button" class="btn btn-secondary btn-sm"
                          (click)="marcarAlertaLeida(alert.id)">
                          Entendido
                        </button>
                      }
                      @if (pendienteActual()) {
                        <button type="button" class="btn btn-primary btn-sm"
                          (click)="abrirModalJustificarDesdeFalta()">
                          Justificar
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

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
                          @if (j.adjuntos?.length) {
                            <div class="flex flex-wrap gap-2 mt-2">
                              @for (a of j.adjuntos; track a.url) {
                                <a [href]="justificacionAdjuntoUrl(a.url)" target="_blank" rel="noopener"
                                  class="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1">
                                  <span class="icon icon-sm">attach_file</span>{{ a.nombreArchivo }}
                                </a>
                              }
                            </div>
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
      <div appOverlayPortal class="fixed inset-0 z-[80]">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          (click)="cerrarModalJustificar()"></div>

        <aside class="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl border-l border-gray-200
          flex flex-col animate-slide-in-r"
          (click)="$event.stopPropagation()">

          <div class="shrink-0 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white px-5 py-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0">
                <div class="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
                  <span class="icon text-2xl">fact_check</span>
                </div>
                <div class="min-w-0">
                  <p class="text-[11px] uppercase tracking-wider text-indigo-100 font-semibold">Justificar inasistencias</p>
                  <h3 class="font-bold text-lg leading-tight truncate">{{ data()?.estudiante?.nombreCompleto }}</h3>
                  @if (data()?.estudiante) {
                    <div class="flex flex-wrap items-center gap-2 mt-2">
                      <span class="text-[11px] px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
                        {{ data()!.estudiante.grado }} · Sec. {{ data()!.estudiante.seccion }}
                      </span>
                    </div>
                  }
                </div>
              </div>
              <button type="button" class="btn-icon text-white/80 hover:text-white hover:bg-white/10 shrink-0"
                (click)="cerrarModalJustificar()">
                <span class="icon">close</span>
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-4">
              <div class="rounded-xl bg-white/10 border border-white/15 px-3 py-2.5">
                <p class="text-[10px] uppercase tracking-wide text-indigo-100">Sin justificar</p>
                <p class="text-2xl font-bold">{{ pendienteActual()?.faltasSinJustificar ?? 0 }}</p>
              </div>
              <div class="rounded-xl bg-white/10 border border-white/15 px-3 py-2.5">
                <p class="text-[10px] uppercase tracking-wide text-indigo-100">Seleccionadas</p>
                <p class="text-2xl font-bold">{{ faltasSeleccionadas().length }}</p>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">
            <section>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <span class="icon icon-sm text-red-500">event_busy</span>
                  Faltas en base de datos
                </h4>
                @if ((pendienteActual()?.faltasPendientes?.length ?? 0) > 1) {
                  <button type="button" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    (click)="toggleTodasFaltasJustificar()">
                    {{ todasFaltasJustificarSeleccionadas() ? 'Quitar todas' : 'Seleccionar todas' }}
                  </button>
                }
              </div>
              <div class="space-y-2">
                @for (f of pendienteActual()?.faltasPendientes ?? []; track f.id) {
                  <label class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                    [ngClass]="faltasSeleccionadas().includes(f.id)
                      ? 'border-indigo-300 bg-indigo-50/80 ring-1 ring-indigo-200'
                      : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white'">
                    <input type="checkbox" class="mt-1 accent-indigo-600"
                      [checked]="faltasSeleccionadas().includes(f.id)"
                      (change)="toggleFaltaJustificar(f.id)">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-900">{{ f.fechaLabel }}</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">F</span>
                      </div>
                      @if (f.observacion) {
                        <p class="text-xs text-gray-500 mt-1">{{ f.observacion }}</p>
                      }
                    </div>
                  </label>
                } @empty {
                  <div class="text-center py-8 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                    <span class="icon text-3xl text-gray-300">event_available</span>
                    <p class="text-sm text-gray-400 mt-2">No hay registros F en BD</p>
                  </div>
                }
              </div>
            </section>

            <section>
              <h4 class="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                <span class="icon icon-sm text-indigo-500">label</span>
                Motivo <span class="text-red-500">*</span>
              </h4>
              <div class="flex flex-wrap gap-2 mb-3">
                @for (m of motivosJustificacion; track m) {
                  <button type="button"
                    class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    [ngClass]="formJustificar.motivo === m
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-700'"
                    (click)="seleccionarMotivoJustificar(m)">
                    {{ m }}
                  </button>
                }
              </div>
              @if (formJustificar.motivo === 'Otro') {
                <input class="form-input" placeholder="Describe el motivo..." [(ngModel)]="formJustificar.motivoOtro">
              }
            </section>

            <section>
              <h4 class="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                <span class="icon icon-sm text-indigo-500">attach_file</span>
                Documentos de sustento
                <span class="text-xs font-normal text-gray-400">(opcional)</span>
              </h4>
              <label class="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed
                border-gray-200 bg-gray-50/80 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-colors">
                <span class="icon text-3xl text-indigo-400">cloud_upload</span>
                <span class="text-sm font-medium text-gray-700">Arrastra o haz clic para adjuntar</span>
                <span class="text-[11px] text-gray-400">PDF, imágenes u Office · máx. 5 archivos · 10 MB c/u</span>
                <input type="file" class="hidden" multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt,.zip"
                  (change)="onAdjuntosJustificarChange($event)">
              </label>
              @if (adjuntosJustificar().length) {
                <ul class="mt-3 space-y-2">
                  @for (f of adjuntosJustificar(); track f.name + f.size) {
                    <li class="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-200 text-sm">
                      <span class="icon icon-sm text-indigo-500 shrink-0">description</span>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-800 truncate">{{ f.name }}</p>
                        <p class="text-[11px] text-gray-400">{{ formatTamano(f.size) }}</p>
                      </div>
                      <button type="button" class="btn-icon text-red-500 hover:bg-red-50 shrink-0"
                        (click)="quitarAdjuntoJustificar(f)">
                        <span class="icon icon-sm">close</span>
                      </button>
                    </li>
                  }
                </ul>
              }
            </section>

            <section>
              <h4 class="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                <span class="icon icon-sm text-indigo-500">notes</span>
                Observaciones
              </h4>
              <textarea class="form-input min-h-[88px] resize-none" rows="3"
                placeholder="Adjunta detalle del certificado o constancia..."
                [(ngModel)]="formJustificar.observacion"></textarea>
            </section>

            @if (errorJustificar()) {
              <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                <span class="icon icon-sm shrink-0 mt-0.5">error</span>
                {{ errorJustificar() }}
              </div>
            }
          </div>

          <div class="shrink-0 px-5 py-4 border-t border-gray-100 bg-gray-50/90 backdrop-blur flex items-center gap-3">
            <button type="button" class="btn btn-secondary flex-1" (click)="cerrarModalJustificar()">Cancelar</button>
            <button type="button" class="btn btn-primary flex-1 flex items-center justify-center gap-2"
              (click)="confirmarJustificacion()"
              [disabled]="justSvc.saving() || !motivoJustificarValido() || faltasSeleccionadas().length === 0">
              @if (justSvc.saving()) {
                <span class="icon icon-sm animate-spin">progress_activity</span>
                Enviando...
              } @else {
                <span class="icon icon-sm">send</span>
                Enviar justificación
              }
            </button>
          </div>
        </aside>
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

  readonly motivosJustificacion = MOTIVOS_JUSTIFICACION;
  readonly hijoSeleccionado = signal<number | null>(null);
  readonly vista = signal<SeguimientoVista>('resumen');
  readonly pendienteActual = signal<PendienteJustificacion | null>(null);
  readonly faltasSeleccionadas = signal<number[]>([]);
  readonly adjuntosJustificar = signal<File[]>([]);
  readonly historialJustificaciones = signal<JustificacionItem[]>([]);
  readonly modalJustificar = signal(false);
  readonly errorJustificar = signal('');
  readonly toastJustificar = signal<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  formJustificar = { motivo: '', motivoOtro: '', observacion: '' };

  readonly tabs: { id: SeguimientoVista; label: string; icon: string }[] = [
    { id: 'resumen', label: 'Resumen', icon: 'dashboard' },
    { id: 'notas', label: 'Notas', icon: 'grading' },
    { id: 'asistencia', label: 'Asistencia', icon: 'fact_check' },
    { id: 'tareas', label: 'Tareas', icon: 'assignment' },
  ];

  readonly data = computed(() => this.svc.seguimiento());

  readonly alertasNoLeidas = computed(() =>
    (this.data()?.alertasAusentismo ?? []).filter((a) => !a.leidoEnPortal).length,
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
  alertaAusentismoLabel = alertaAusentismoLabel;
  alertaAusentismoBadge = alertaAusentismoBadge;
  tareaEstadoLabel = tareaEstadoLabel;
  tareaEstadoBadge = tareaEstadoBadge;
  taskFileUrl = taskFileUrl;

  valorBimestre(nota: number | null | undefined, nivel: string | null | undefined): string {
    if (nota !== null && nota !== undefined) return String(nota);
    if (nivel) return nivel;
    return '—';
  }

  ngOnInit(): void {
    this.layout.setTitle('Seguimiento académico');
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

  marcarAlertaLeida(alertId: number): void {
    const studentId = this.hijoSeleccionado();
    if (!studentId) return;
    this.svc.markAlertaLeida(studentId, alertId).subscribe({
      next: () => {
        this.svc.seguimiento.update((current) => {
          if (!current) return current;
          return {
            ...current,
            alertasAusentismo: (current.alertasAusentismo ?? []).map((a) =>
              a.id === alertId ? { ...a, leidoEnPortal: true } : a,
            ),
          };
        });
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
    this.faltasSeleccionadas.set(p.faltasPendientes?.map((f) => f.id) ?? []);
    this.adjuntosJustificar.set([]);
    this.formJustificar = { motivo: '', motivoOtro: '', observacion: '' };
    this.errorJustificar.set('');
    this.modalJustificar.set(true);
  }

  toggleFaltaJustificar(id: number): void {
    this.faltasSeleccionadas.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  seleccionarMotivoJustificar(motivo: string): void {
    this.formJustificar.motivo = this.formJustificar.motivo === motivo ? '' : motivo;
    if (motivo !== 'Otro') this.formJustificar.motivoOtro = '';
  }

  readonly todasFaltasJustificarSeleccionadas = computed(() => {
    const pendientes = this.pendienteActual()?.faltasPendientes ?? [];
    if (!pendientes.length) return false;
    const ids = this.faltasSeleccionadas();
    return pendientes.every((f) => ids.includes(f.id));
  });

  toggleTodasFaltasJustificar(): void {
    const pendientes = this.pendienteActual()?.faltasPendientes ?? [];
    if (this.todasFaltasJustificarSeleccionadas()) {
      this.faltasSeleccionadas.set([]);
    } else {
      this.faltasSeleccionadas.set(pendientes.map((f) => f.id));
    }
  }

  onAdjuntosJustificarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevos = Array.from(input.files ?? []);
    this.adjuntosJustificar.update((list) => [...list, ...nuevos].slice(0, 5));
    input.value = '';
  }

  quitarAdjuntoJustificar(file: File): void {
    this.adjuntosJustificar.update((list) => list.filter((f) => f !== file));
  }

  formatTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  readonly justificacionAdjuntoUrl = justificacionAdjuntoUrl;

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
    const attendanceIds = this.faltasSeleccionadas();
    if (!studentId || !p || !this.motivoJustificarValido() || !attendanceIds.length) return;

    const cantidad = attendanceIds.length;
    const motivo = this.formJustificar.motivo === 'Otro'
      ? this.formJustificar.motivoOtro.trim()
      : this.formJustificar.motivo;

    this.errorJustificar.set('');
    this.justSvc.create(studentId, {
      cantidad,
      motivo,
      observacion: this.formJustificar.observacion.trim() || undefined,
      attendanceIds,
      adjuntos: this.adjuntosJustificar(),
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
