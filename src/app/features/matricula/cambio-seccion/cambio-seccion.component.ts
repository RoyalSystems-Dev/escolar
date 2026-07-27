import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { OverlayPortalDirective } from '../../../core/overlay/overlay-portal.directive';
import { InstitucionalService } from '../../administracion/institucional/institucional.service';
import { Nivel } from '../../administracion/institucional/institucional.model';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ApiExpediente } from '../../../core/api/api.models';
import { CambioSeccionService } from './cambio-seccion.service';
import { SalonesService } from '../maestros/salones/salones.service';
import {
  CARGOS_AUTORIZADORES,
  EstudianteMatricula,
  HistorialCambioSeccion,
  MOTIVOS_CAMBIO,
  MotivoCambioSeccion,
  OcupacionSeccion,
} from './cambio-seccion.model';

function gradoKey(value: string): string {
  const t = value
    .toLowerCase()
    .replace(/[°º]/g, '')
    .replace(/\s*(grado|año|ano|anos)\b/g, '')
    .trim();
  const num = t.match(/^(\d+)/);
  return num ? num[1] : t;
}

/** Formato que espera la API de salones/ocupacion (ej. "4°" en lugar de "4° Secundaria"). */
function gradoApiParam(value: string): string {
  let t = value.trim();
  const withNivel = t.match(/^(.+?)\s+(Inicial|Primaria|Secundaria)$/i);
  if (withNivel) t = withNivel[1].trim();
  const num = t.match(/^(\d+)/);
  return num ? `${num[1]}°` : t;
}


@Component({
  selector: 'app-cambio-seccion',
  standalone: true,
  imports: [FormsModule, NgClass, DatePipe, OverlayPortalDirective],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Cambio de Seccion</h2>
          <p class="text-sm text-gray-400 mt-0.5">
            Reasignacion de estudiantes dentro del mismo nivel y grado
          </p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" (click)="recargar()">
            <span class="icon icon-sm">refresh</span> Actualizar
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        @for (kpi of kpis(); track kpi.label) {
          <div class="card p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" [ngClass]="kpi.bg">
              <span class="icon" [ngClass]="kpi.color">{{ kpi.icon }}</span>
            </div>
            <div>
              <p class="text-xs text-gray-400">{{ kpi.label }}</p>
              <p class="text-xl font-bold text-gray-900">{{ kpi.value }}</p>
            </div>
          </div>
        }
      </div>

      <div class="tabs">
        <button class="tab" [class.tab-active]="tab() === 'estudiantes'" (click)="tab.set('estudiantes')">
          <span class="icon icon-sm">groups</span> Estudiantes
        </button>
        <button class="tab" [class.tab-active]="tab() === 'historial'" (click)="tab.set('historial')">
          <span class="icon icon-sm">history</span> Historial
        </button>
      </div>

      @if (tab() === 'estudiantes') {
        <div class="card p-4 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label class="form-label mb-1 block">Nivel</label>
              <select class="form-select" [ngModel]="filtro().nivel" (ngModelChange)="setFiltro('nivel', $event)">
                <option value="">Todos</option>
                @for (n of niveles(); track n.id) {
                  <option [value]="n.nombre">{{ n.nombre }}</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label mb-1 block">Grado</label>
              <select class="form-select" [ngModel]="filtro().grado" (ngModelChange)="setFiltro('grado', $event)" [disabled]="!filtro().nivel">
                <option value="">Todos</option>
                @for (g of gradosDisponibles(); track g) {
                  <option [value]="g">{{ g }}</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label mb-1 block">Seccion actual</label>
              <select class="form-select" [ngModel]="filtro().seccion" (ngModelChange)="setFiltro('seccion', $event)">
                <option value="">Todas</option>
                @for (s of seccionesDisponibles(); track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>
            </div>
            <div class="lg:col-span-2">
              <label class="form-label mb-1 block">Buscar</label>
              <div class="relative">
                <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input class="form-input pl-10" placeholder="Nombre, apellido o DNI..."
                  [ngModel]="filtro().busqueda" (ngModelChange)="setFiltro('busqueda', $event)">
              </div>
            </div>
          </div>
        </div>

        @if (filtro().nivel && filtro().grado) {
          <div class="card p-4">
            <p class="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Vacantes por salon (aforo − matriculados)</p>
            @if (cargandoOcupacionLista()) {
              <p class="text-sm text-gray-400 text-center py-6">Cargando vacantes...</p>
            } @else if (ocupacion().length) {
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            @for (o of ocupacion(); track o.seccion) {
              <div class="card p-3 text-center border"
                [ngClass]="o.disponibles > 0 ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/30'">
                <p class="text-xs text-gray-500 font-medium">Seccion {{ o.seccion }}</p>
                <p class="text-lg font-bold" [ngClass]="o.disponibles > 0 ? 'text-green-600' : 'text-red-500'">
                  {{ o.matriculados }}/{{ o.capacidad }}
                </p>
                <p class="text-xs font-semibold" [ngClass]="o.disponibles > 0 ? 'text-green-700' : 'text-red-600'">
                  {{ o.disponibles }} vacante{{ o.disponibles === 1 ? '' : 's' }}
                </p>
              </div>
            }
            </div>
            } @else {
              <p class="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                Sin datos de vacantes para este grado. Verifique el maestro de salones o sincronice desde Institucional.
              </p>
            }
          </div>
        } @else {
          <div class="card p-4 border border-dashed border-gray-200 bg-gray-50/50">
            <p class="text-sm text-gray-500 text-center">
              <span class="icon icon-sm align-middle mr-1 text-gray-400">info</span>
              Seleccione <strong>Nivel</strong> y <strong>Grado</strong> para ver las vacantes por salon.
            </p>
          </div>
        }

        <div class="card overflow-hidden">
          <table class="data-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Codigo</th>
                <th>DNI</th>
                <th>Nivel / Grado</th>
                <th>Seccion</th>
                <th>Estado</th>
                <th class="text-center">Accion</th>
              </tr>
            </thead>
            <tbody>
              @if (svc.loading()) {
                <tr>
                  <td colspan="7" class="py-12 text-center text-gray-400">Cargando estudiantes...</td>
                </tr>
              } @else {
                @for (e of estudiantesPaginados(); track e.id) {
                  <tr class="hover:bg-gray-50">
                    <td>
                      <div class="font-medium text-gray-900">{{ e.apellidos }}, {{ e.nombres }}</div>
                      <div class="text-xs text-gray-400 font-mono mt-0.5">
                        {{ labelDocumentoEstudiante(e) }}: {{ e.dni || '—' }}
                      </div>
                    </td>
                    <td class="font-mono text-xs text-gray-500">{{ e.codigo }}</td>
                    <td class="font-mono text-sm text-gray-600">{{ e.dni || '—' }}</td>
                    <td>
                      <div class="text-sm">{{ e.nivel }}</div>
                      <div class="text-xs text-gray-400">{{ e.grado }}</div>
                    </td>
                    <td>
                      <span class="badge badge-indigo">{{ e.seccion }}</span>
                    </td>
                    <td>
                      <span class="badge text-xs" [ngClass]="e.activo ? 'badge-green' : 'badge-gray'">
                        {{ e.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-center">
                      <button class="btn btn-secondary btn-sm" (click)="abrirCambio(e)" [disabled]="!e.activo">
                        <span class="icon icon-sm">swap_horiz</span> Cambiar
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="py-12 text-center text-gray-400">
                      No hay alumnos pendientes de cambio de seccion con los filtros seleccionados
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
          @if (!svc.loading() && totalEstudiantesFiltrados() > 0) {
            <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <span class="text-xs text-gray-500">
                {{ inicioEstudiantes() + 1 }}–{{ finEstudiantes() }} de {{ totalEstudiantesFiltrados() }}
                · pagina {{ paginaEstudiantes() }} de {{ totalPaginasEstudiantes() }}
              </span>
              @if (totalEstudiantesFiltrados() > POR_PAGINA) {
                <div class="flex items-center gap-1">
                  <button class="btn-icon" [disabled]="paginaEstudiantes() === 1" (click)="paginaEstudiantes.update(p => p - 1)">
                    <span class="icon icon-sm">chevron_left</span>
                  </button>
                  @for (p of paginasEstudiantes(); track p) {
                    <button class="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                      [ngClass]="p === paginaEstudiantes() ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                      (click)="paginaEstudiantes.set(p)">{{ p }}</button>
                  }
                  <button class="btn-icon" [disabled]="paginaEstudiantes() === totalPaginasEstudiantes()" (click)="paginaEstudiantes.update(p => p + 1)">
                    <span class="icon icon-sm">chevron_right</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (tab() === 'historial') {
        <div class="card overflow-hidden">
          <table class="data-table text-sm">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estudiante</th>
                <th>DNI</th>
                <th>Nivel / Grado</th>
                <th>Cambio</th>
                <th>Motivo</th>
                <th>Autorizado por</th>
                <th>Registrado por</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @if (cargandoHistorial()) {
                <tr><td colspan="9" class="py-10 text-center text-gray-400">Cargando historial...</td></tr>
              } @else {
                @for (h of historialPaginado(); track h.id) {
                  <tr>
                    <td class="text-xs text-gray-500">{{ h.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ h.estudiante }}</td>
                    <td class="font-mono text-xs text-gray-600">{{ h.dni || '—' }}</td>
                    <td>{{ h.nivel }} · {{ h.grado }}</td>
                    <td>
                      <span class="badge badge-gray">{{ h.seccionAnterior }}</span>
                      <span class="icon icon-sm align-middle mx-1 text-gray-400">arrow_forward</span>
                      <span class="badge badge-indigo">{{ h.seccionNueva }}</span>
                    </td>
                    <td>{{ labelMotivo(h.motivo) }}</td>
                    <td class="text-xs text-gray-700">{{ h.autorizadoPor || '—' }}</td>
                    <td class="text-xs text-gray-500">{{ h.realizadoPor }}</td>
                    <td>
                      <span class="badge badge-green text-xs">{{ h.estado === 'completado' ? 'Completado' : 'Registrado' }}</span>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="9" class="py-10 text-center text-gray-400">Sin cambios registrados</td></tr>
                }
              }
            </tbody>
          </table>
          @if (!cargandoHistorial() && totalHistorial() > 0) {
            <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <span class="text-xs text-gray-500">
                {{ inicioHistorial() + 1 }}–{{ finHistorial() }} de {{ totalHistorial() }}
                · pagina {{ paginaHistorial() }} de {{ totalPaginasHistorial() }}
              </span>
              @if (totalHistorial() > POR_PAGINA) {
                <div class="flex items-center gap-1">
                  <button class="btn-icon" [disabled]="paginaHistorial() === 1" (click)="paginaHistorial.update(p => p - 1)">
                    <span class="icon icon-sm">chevron_left</span>
                  </button>
                  @for (p of paginasHistorial(); track p) {
                    <button class="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                      [ngClass]="p === paginaHistorial() ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                      (click)="paginaHistorial.set(p)">{{ p }}</button>
                  }
                  <button class="btn-icon" [disabled]="paginaHistorial() === totalPaginasHistorial()" (click)="paginaHistorial.update(p => p + 1)">
                    <span class="icon icon-sm">chevron_right</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    @if (drawerAbierto()) {
      <div appOverlayPortal class="fixed inset-0 z-40">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" (click)="cerrarDrawer()"></div>
      <div class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-l">
        <div class="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <div>
            <h3 class="font-semibold text-gray-900">Cambiar seccion</h3>
            <p class="text-xs text-gray-500">
              {{ seleccionado()?.apellidos }}, {{ seleccionado()?.nombres }}
              · DNI {{ seleccionado()?.dni || '—' }}
            </p>
          </div>
          <button class="btn-icon text-gray-400" (click)="cerrarDrawer()"><span class="icon">close</span></button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div class="card p-4 bg-gray-50 space-y-2">
            <div>
              <p class="text-xs text-gray-400">Ubicacion actual</p>
              <p class="font-semibold text-gray-800">
                {{ seleccionado()?.nivel }} · {{ seleccionado()?.grado }} · Seccion {{ seleccionado()?.seccion }}
              </p>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs text-gray-400">Codigo</p>
                <p class="font-mono font-medium text-gray-800">{{ seleccionado()?.codigo || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">{{ labelDocumentoEstudiante(seleccionado()!) }}</p>
                <p class="font-mono font-medium text-gray-800">{{ seleccionado()?.dni || '—' }}</p>
              </div>
            </div>
          </div>

          @if (cargandoOcupacion()) {
            <div>
              <p class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Vacantes por salon</p>
              <p class="text-sm text-gray-400 py-4 text-center">Cargando vacantes...</p>
            </div>
          } @else if (ocupacion().length) {
            <div>
              <p class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Vacantes por salon</p>
              <div class="grid grid-cols-2 gap-2">
                @for (o of ocupacion(); track o.seccion) {
                  <div class="rounded-lg border px-3 py-2 text-xs"
                    [ngClass]="{
                      'border-indigo-300 bg-indigo-50': esSeccionActual(o.seccion),
                      'border-green-200 bg-green-50': !esSeccionActual(o.seccion) && o.disponibles > 0,
                      'border-red-200 bg-red-50': !esSeccionActual(o.seccion) && o.disponibles <= 0
                    }">
                    <div class="flex items-center justify-between gap-1">
                      <span class="font-bold text-gray-800">Secc. {{ o.seccion }}</span>
                      @if (esSeccionActual(o.seccion)) {
                        <span class="badge badge-indigo text-[10px]">Actual</span>
                      }
                    </div>
                    <p class="text-gray-600 mt-0.5">{{ o.matriculados }}/{{ o.capacidad }} matriculados</p>
                    <p class="font-semibold mt-0.5"
                      [ngClass]="o.disponibles > 0 ? 'text-green-700' : 'text-red-600'">
                      {{ o.disponibles }} vacante{{ o.disponibles === 1 ? '' : 's' }} libre{{ o.disponibles === 1 ? '' : 's' }}
                    </p>
                  </div>
                }
              </div>
            </div>
          } @else {
            <p class="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
              No se pudieron cargar las vacantes de este grado. Aun puede elegir seccion destino abajo.
            </p>
          }

          <div class="form-group">
            <label class="form-label">Nueva seccion *</label>
            @if (cargandoOcupacion()) {
              <p class="text-sm text-gray-400 py-4 text-center">Cargando secciones y vacantes...</p>
            } @else if (seccionesConVacante().length === 0) {
              <p class="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                No hay secciones con vacantes disponibles para este grado.
              </p>
            } @else {
              <select class="form-select mb-3" [(ngModel)]="form.nuevaSeccion">
                <option value="">Seleccione seccion destino</option>
                @for (s of seccionesConVacante(); track s) {
                  <option [value]="s">
                    Seccion {{ s }}{{ labelVacanteSeccion(s) }}
                  </option>
                }
              </select>
              <div class="grid grid-cols-3 gap-2">
                @for (s of seccionesConVacante(); track s) {
                  @let occ = ocupacionSeccion(s);
                  <button type="button" class="py-3 rounded-xl border-2 text-sm font-semibold transition-all"
                    [ngClass]="normSec(form.nuevaSeccion) === normSec(s)
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-gray-200 hover:border-indigo-300 bg-green-50 border-green-200'"
                    (click)="seleccionarDestino(s)">
                    {{ s }}
                    @if (occ) {
                      <span class="block text-[10px] font-normal mt-0.5 opacity-80">
                        {{ occ.disponibles }} vacante{{ occ.disponibles === 1 ? '' : 's' }}
                      </span>
                    }
                  </button>
                }
              </div>
            }
          </div>

          @if (previewVacantes(); as pv) {
            <div class="rounded-xl border border-indigo-100 bg-indigo-50 p-3 space-y-3 text-xs text-indigo-900">
              <p class="font-semibold flex items-center gap-1">
                <span class="icon icon-sm">event_seat</span> Impacto en vacantes por salon
              </p>
              <div class="rounded-lg bg-white/80 border border-indigo-100 p-2.5 space-y-1">
                <p class="font-medium">Seccion {{ pv.origen.seccion }} (sale el alumno)</p>
                @if (pv.origen.actual !== null) {
                  <p>
                    Vacantes: <strong>{{ pv.origen.actual }}</strong>
                    <span class="icon icon-sm align-middle mx-0.5 text-indigo-400">arrow_forward</span>
                    <strong class="text-green-700">{{ pv.origen.despues }}</strong>
                    <span class="text-green-600">(+1)</span>
                  </p>
                } @else {
                  <p class="text-green-700">+1 vacante al liberar el cupo</p>
                }
              </div>
              <div class="rounded-lg bg-white/80 border border-indigo-100 p-2.5 space-y-1">
                <p class="font-medium">Seccion {{ pv.destino.seccion }} (ingresa el alumno)</p>
                @if (pv.destino.actual !== null) {
                  <p>
                    Vacantes: <strong>{{ pv.destino.actual }}</strong>
                    <span class="icon icon-sm align-middle mx-0.5 text-indigo-400">arrow_forward</span>
                    <strong class="text-amber-700">{{ pv.destino.despues }}</strong>
                    <span class="text-red-600">(−1)</span>
                  </p>
                } @else {
                  <p class="text-red-600">−1 vacante al ocupar el cupo</p>
                }
              </div>
            </div>
          } @else if (seccionesConVacante().length && !cargandoOcupacion()) {
            <p class="text-xs text-gray-400 text-center bg-gray-50 rounded-lg py-2.5">
              Seleccione una seccion destino para ver el impacto en vacantes.
            </p>
          }

          @if (ocupacionDestino(); as o) {
            <div class="text-xs rounded-lg p-3"
              [ngClass]="o.disponibles > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
              Destino seccion {{ form.nuevaSeccion }}: {{ o.matriculados }}/{{ o.capacidad }} matriculados ·
              {{ o.disponibles }} vacante{{ o.disponibles === 1 ? '' : 's' }} antes del cambio
            </div>
          }

          <div class="form-group">
            <label class="form-label">Motivo del cambio *</label>
            <select class="form-select" [(ngModel)]="form.motivo">
              @for (m of motivos; track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Persona autorizada *</label>
            <input class="form-input" [(ngModel)]="form.autorizadoPor" list="autorizadores-list"
              placeholder="Nombre y cargo del funcionario autorizador">
            <datalist id="autorizadores-list">
              @for (c of cargosAutorizadores; track c) {
                <option [value]="sugerenciaAutorizador(c)"></option>
              }
            </datalist>
            <p class="text-[11px] text-gray-400 mt-1">Director, subdirector o administrador que autoriza el traslado</p>
          </div>

          <div class="form-group">
            <label class="form-label">Observacion {{ form.motivo === 'otro' ? '*' : '' }}</label>
            <textarea class="form-input min-h-24" [(ngModel)]="form.observacion"
              [placeholder]="form.motivo === 'otro' ? 'Detalle obligatorio del motivo' : 'Detalle adicional (opcional)'"></textarea>
          </div>

          <div class="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            Registrado por: <span class="font-medium text-gray-700">{{ auth.nombreCompleto() || 'Usuario actual' }}</span>
          </div>

          @if (errorForm()) {
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ errorForm() }}</div>
          }
        </div>

        <div class="px-6 py-4 border-t bg-gray-50 flex gap-2 shrink-0">
          <button class="btn btn-primary flex-1" (click)="confirmarCambio()"
            [disabled]="svc.saving() || !puedeConfirmar()">
            <span class="icon">swap_horiz</span>
            {{ svc.saving() ? 'Guardando...' : 'Confirmar cambio' }}
          </button>
          <button class="btn btn-secondary" (click)="cerrarDrawer()">Cancelar</button>
        </div>
      </div>
      </div>
    }

    @if (notificacion(); as n) {
      <div class="fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 text-white"
        [ngClass]="n.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'">
        <span class="icon">{{ n.tipo === 'success' ? 'check_circle' : 'error' }}</span>
        {{ n.mensaje }}
      </div>
    }
  `,
})
export class CambioSeccionComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(CambioSeccionService);
  private readonly salonesSvc = inject(SalonesService);
  private readonly institucional = inject(InstitucionalService);
  readonly auth = inject(AuthService);

  readonly motivos = MOTIVOS_CAMBIO;
  readonly cargosAutorizadores = CARGOS_AUTORIZADORES;
  readonly anioEscolar = 2026;
  readonly POR_PAGINA = 10;
  readonly tab = signal<'estudiantes' | 'historial'>('estudiantes');
  readonly paginaEstudiantes = signal(1);
  readonly paginaHistorial = signal(1);
  readonly drawerAbierto = signal(false);
  readonly cargandoOcupacion = signal(false);
  readonly cargandoOcupacionLista = signal(false);
  readonly errorForm = signal('');
  readonly notificacion = signal<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);
  readonly cargandoHistorial = signal(false);

  private readonly _estudiantes = signal<EstudianteMatricula[]>([]);
  private readonly _historial = signal<HistorialCambioSeccion[]>([]);
  private readonly _niveles = signal<Nivel[]>([]);
  private readonly _ocupacion = signal<OcupacionSeccion[]>([]);
  readonly ocupacion = this._ocupacion.asReadonly();
  readonly historial = this._historial.asReadonly();
  readonly niveles = this._niveles.asReadonly();

  readonly filtro = signal({ nivel: '', grado: '', seccion: '', busqueda: '' });
  readonly seleccionado = signal<EstudianteMatricula | null>(null);

  form = {
    nuevaSeccion: '',
    motivo: 'equilibrio' as MotivoCambioSeccion,
    autorizadoPor: '',
    observacion: '',
  };

  readonly gradosDisponibles = computed(() => {
    const nivel = this._niveles().find((n) => n.nombre === this.filtro().nivel);
    return nivel?.grados.map((g) => g.nombre) ?? [];
  });

  readonly seccionesDisponibles = computed(() => {
    const { nivel, grado } = this.filtro();
    if (!nivel || !grado) {
      return [...new Set(this._estudiantes().map((e) => e.seccion))].sort();
    }
    const nivelData = this._niveles().find((n) => n.nombre === nivel);
    const gradoData = nivelData?.grados.find((g) => gradoKey(g.nombre) === gradoKey(grado));
    return gradoData?.secciones.map((s) => s.nombre) ?? [];
  });

  readonly seccionesConVacante = computed(() => {
    const est = this.seleccionado();
    if (!est) return [];

    const actual = this.normSec(est.seccion);
    return this._ocupacion()
      .filter((o) => o.disponibles > 0 && this.normSec(o.seccion) !== actual)
      .map((o) => this.normSec(o.seccion))
      .sort();
  });

  readonly ocupacionDestino = computed(() => {
    if (!this.form.nuevaSeccion) return null;
    return this.ocupacionSeccion(this.form.nuevaSeccion);
  });

  readonly previewVacantes = computed(() => {
    const est = this.seleccionado();
    const dest = this.normSec(this.form.nuevaSeccion);
    if (!est || !dest) return null;

    const origOcc = this.ocupacionSeccion(est.seccion);
    const destOcc = this.ocupacionSeccion(dest);

    return {
      origen: {
        seccion: this.normSec(est.seccion),
        actual: origOcc?.disponibles ?? null,
        despues: origOcc != null ? origOcc.disponibles + 1 : null,
      },
      destino: {
        seccion: dest,
        actual: destOcc?.disponibles ?? null,
        despues: destOcc != null ? destOcc.disponibles - 1 : null,
      },
    };
  });

  readonly filtrados = computed(() => {
    const { nivel, grado, seccion, busqueda } = this.filtro();
    const q = busqueda.toLowerCase().trim();
    return this._estudiantes().filter((e) => {
      const matchNivel = !nivel || e.nivel === nivel;
      const matchGrado = !grado || gradoKey(e.grado) === gradoKey(grado);
      const matchSeccion = !seccion || e.seccion === seccion;
      const matchQ =
        !q ||
        `${e.nombres} ${e.apellidos} ${e.nombre} ${e.apellido} ${e.dni}`.toLowerCase().includes(q);
      return matchNivel && matchGrado && matchSeccion && matchQ;
    });
  });

  readonly totalEstudiantesFiltrados = computed(() => this.filtrados().length);
  readonly totalPaginasEstudiantes = computed(() =>
    Math.max(1, Math.ceil(this.totalEstudiantesFiltrados() / this.POR_PAGINA)),
  );
  readonly inicioEstudiantes = computed(() => (this.paginaEstudiantes() - 1) * this.POR_PAGINA);
  readonly finEstudiantes = computed(() =>
    Math.min(this.inicioEstudiantes() + this.POR_PAGINA, this.totalEstudiantesFiltrados()),
  );
  readonly estudiantesPaginados = computed(() =>
    this.filtrados().slice(this.inicioEstudiantes(), this.finEstudiantes()),
  );
  readonly paginasEstudiantes = computed(() => {
    const total = this.totalPaginasEstudiantes();
    const actual = this.paginaEstudiantes();
    const ini = Math.max(1, actual - 2);
    const fin = Math.min(total, actual + 2);
    return Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
  });

  readonly totalHistorial = computed(() => this.historial().length);
  readonly totalPaginasHistorial = computed(() =>
    Math.max(1, Math.ceil(this.totalHistorial() / this.POR_PAGINA)),
  );
  readonly inicioHistorial = computed(() => (this.paginaHistorial() - 1) * this.POR_PAGINA);
  readonly finHistorial = computed(() =>
    Math.min(this.inicioHistorial() + this.POR_PAGINA, this.totalHistorial()),
  );
  readonly historialPaginado = computed(() =>
    this.historial().slice(this.inicioHistorial(), this.finHistorial()),
  );
  readonly paginasHistorial = computed(() => {
    const total = this.totalPaginasHistorial();
    const actual = this.paginaHistorial();
    const ini = Math.max(1, actual - 2);
    const fin = Math.min(total, actual + 2);
    return Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
  });

  readonly kpis = computed(() => [
    {
      label: 'Pendientes de cambio',
      value: this._estudiantes().length,
      icon: 'groups',
      bg: 'bg-indigo-100',
      color: 'text-indigo-600',
    },
    {
      label: 'Filtrados',
      value: this.filtrados().length,
      icon: 'filter_alt',
      bg: 'bg-blue-100',
      color: 'text-blue-600',
    },
    {
      label: 'Cambios realizados',
      value: this._historial().length,
      icon: 'history',
      bg: 'bg-amber-100',
      color: 'text-amber-600',
    },
    {
      label: 'Secciones activas',
      value: new Set(this._estudiantes().map((e) => e.seccion)).size,
      icon: 'view_column',
      bg: 'bg-green-100',
      color: 'text-green-600',
    },
  ]);

  ngOnInit(): void {
    this.layout.setTitle('Cambio de Seccion');
    this.institucional.loadEducationLevels().subscribe({
      next: (niveles) => this._niveles.set(niveles),
    });
    this.recargar();
  }

  recargar(): void {
    this.cargarEstudiantes();
    this.cargarHistorial();
  }

  setFiltro(campo: 'nivel' | 'grado' | 'seccion' | 'busqueda', valor: string): void {
    this.filtro.update((f) => {
      const next = { ...f, [campo]: valor };
      if (campo === 'nivel') {
        next.grado = '';
        next.seccion = '';
      }
      if (campo === 'grado') next.seccion = '';
      return next;
    });
    this.paginaEstudiantes.set(1);
    if (campo === 'nivel' || campo === 'grado') {
      this.paginaHistorial.set(1);
    }
    if (campo === 'nivel' || campo === 'grado') {
      this.cargarOcupacion();
      this.cargarHistorial();
      this.cargarEstudiantes();
    }
  }

  abrirCambio(estudiante: EstudianteMatricula): void {
    this.seleccionado.set(estudiante);
    const nombre = this.auth.nombreCompleto();
    const autorizadoDefault =
      this.auth.hasRole('DIRECTOR', 'ADMIN') && nombre
        ? this.sugerenciaAutorizador(
            this.auth.hasRole('DIRECTOR') ? 'Director(a) de la IE' : 'Administrador(a) del sistema',
          )
        : '';
    this.form = {
      nuevaSeccion: '',
      motivo: 'equilibrio',
      autorizadoPor: autorizadoDefault,
      observacion: '',
    };
    this.errorForm.set('');
    this.drawerAbierto.set(true);
    this.cargarOcupacionEstudiante(estudiante);
  }

  normSec(seccion: string): string {
    return seccion?.trim().toUpperCase() ?? '';
  }

  esSeccionActual(seccion: string): boolean {
    const est = this.seleccionado();
    if (!est) return false;
    return this.normSec(seccion) === this.normSec(est.seccion);
  }

  cerrarDrawer(): void {
    this.drawerAbierto.set(false);
    this.seleccionado.set(null);
  }

  seleccionarDestino(seccion: string): void {
    if (!this.tieneVacante(seccion)) return;
    this.form.nuevaSeccion = this.normSec(seccion);
  }

  ocupacionSeccion(seccion: string): OcupacionSeccion | undefined {
    const n = this.normSec(seccion);
    return this._ocupacion().find((o) => this.normSec(o.seccion) === n);
  }

  tieneVacante(seccion: string): boolean {
    if (this.esSeccionActual(seccion)) return false;
    const occ = this.ocupacionSeccion(seccion);
    return !!occ && occ.disponibles > 0;
  }

  labelVacanteSeccion(seccion: string): string {
    const occ = this.ocupacionSeccion(seccion);
    if (!occ) return '';
    const despues = occ.disponibles - 1;
    return ` — ${occ.disponibles} vacante(s) · quedarian ${despues}`;
  }

  puedeConfirmar(): boolean {
    if (!this.form.nuevaSeccion || !this.form.motivo.trim() || !this.form.autorizadoPor.trim()) {
      return false;
    }
    if (this.form.motivo === 'otro' && !this.form.observacion.trim()) return false;
    return this.tieneVacante(this.form.nuevaSeccion);
  }

  sugerenciaAutorizador(cargo: string): string {
    const nombre = this.auth.nombreCompleto();
    return nombre ? `${nombre} — ${cargo}` : cargo;
  }

  confirmarCambio(): void {
    const estudiante = this.seleccionado();
    if (!estudiante) return;
    if (!this.form.nuevaSeccion) {
      this.errorForm.set('Selecciona la nueva seccion');
      return;
    }
    if (this.normSec(this.form.nuevaSeccion) === this.normSec(estudiante.seccion)) {
      this.errorForm.set('La nueva seccion debe ser diferente a la actual');
      return;
    }
    if (!this.tieneVacante(this.form.nuevaSeccion)) {
      this.errorForm.set('La seccion destino no tiene vacantes disponibles');
      return;
    }
    if (!this.form.autorizadoPor.trim()) {
      this.errorForm.set('Indica la persona autorizada para el cambio');
      return;
    }
    if (this.form.motivo === 'otro' && !this.form.observacion.trim()) {
      this.errorForm.set('Debe detallar la observacion cuando el motivo es "otro"');
      return;
    }

    this.svc
      .changeSection(estudiante.id, {
        nuevaSeccion: this.normSec(this.form.nuevaSeccion),
        motivo: this.form.motivo,
        autorizadoPor: this.form.autorizadoPor.trim(),
        observacion: this.form.observacion.trim(),
        realizadoPor: this.auth.nombreCompleto() || 'Usuario del sistema',
      })
      .subscribe({
        next: (res) => {
          this.cerrarDrawer();
          this._estudiantes.update((list) => list.filter((e) => e.id !== estudiante.id));
          this.recargar();
          this.mostrarNotificacion(
            `Traslado a seccion ${res.seccionNueva} registrado. El alumno ya no aparecera en la lista de pendientes.`,
          );
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.errorForm.set(Array.isArray(msg) ? msg.join(', ') : msg ?? 'No se pudo realizar el cambio');
        },
      });
  }

  labelMotivo(value: string): string {
    return (this.motivos.find((m) => m.value === value)?.label ?? value) || '—';
  }

  labelDocumentoEstudiante(e: EstudianteMatricula): string {
    return e.tipoDocumento === 'DNI' || !e.tipoDocumento ? 'DNI' : e.tipoDocumento;
  }

  private cargarEstudiantes(): void {
    const { nivel, grado } = this.filtro();
    this.svc
      .loadStudents({
        nivel: nivel || undefined,
        grado: grado || undefined,
      })
      .subscribe({
      next: (rows) => {
        this._estudiantes.set(rows.map((row) => this.mapEstudiante(row)));
        if (this.filtro().nivel && this.filtro().grado) {
          this.cargarOcupacion();
        }
        const sel = this.seleccionado();
        if (sel && this.drawerAbierto()) {
          this.cargarOcupacionEstudiante(sel);
        }
      },
      error: () => this.mostrarNotificacion('No se pudieron cargar los estudiantes', 'error'),
    });
  }

  private mapEstudiante(row: ApiExpediente): EstudianteMatricula {
    const nombres = row.nombres?.trim() || '';
    const apellidos = row.apellidos?.trim() || '';
    return {
      id: row.id,
      nombre: nombres,
      apellido: apellidos,
      nombres,
      apellidos,
      dni: row.dni?.trim() || '',
      tipoDocumento: row.tipoDocumento?.trim() || 'DNI',
      email: row.email ?? '',
      nivel: row.nivel ?? '',
      grado: row.grado ?? '',
      seccion: this.normSec(row.seccion ?? ''),
      activo: row.activo ?? row.estado === 'activo',
      codigo: row.codigo?.trim() || `2026-${String(row.id).padStart(4, '0')}`,
    };
  }

  private cargarHistorial(): void {
    const { nivel, grado } = this.filtro();
    this.cargandoHistorial.set(true);
    this.svc.loadHistory({ nivel: nivel || undefined, grado: grado || undefined }).subscribe({
      next: (rows) => {
        this._historial.set(rows);
        this.paginaHistorial.set(1);
        this.cargandoHistorial.set(false);
      },
      error: () => {
        this._historial.set([]);
        this.cargandoHistorial.set(false);
      },
    });
  }

  private cargarOcupacionEstudiante(est: EstudianteMatricula): void {
    this.cargarOcupacionInterno(est.nivel, est.grado, 'drawer');
  }

  private cargarOcupacion(nivel?: string, grado?: string): void {
    const n = nivel ?? this.filtro().nivel;
    const g = grado ?? this.filtro().grado;
    if (!n || !g) {
      this._ocupacion.set([]);
      this.cargandoOcupacionLista.set(false);
      return;
    }

    const gradoLabel =
      this._estudiantes().find(
        (e) => e.nivel === n && gradoKey(e.grado) === gradoKey(g),
      )?.grado ?? g;

    this.cargarOcupacionInterno(n, gradoLabel, 'lista');
  }

  private cargarOcupacionInterno(
    nivel: string,
    gradoLabel: string,
    contexto: 'lista' | 'drawer',
  ): void {
    const gradoParam = gradoApiParam(gradoLabel);

    if (contexto === 'drawer') this.cargandoOcupacion.set(true);
    else this.cargandoOcupacionLista.set(true);

    this.salonesSvc
      .listVacancies({ anioEscolar: this.anioEscolar, nivel, grado: gradoParam })
      .subscribe({
        next: (rows) => {
          this._ocupacion.set(this.mapVacantes(rows));
          this.finalizarCargaOcupacion(contexto);
        },
        error: () => {
          this.svc.loadOccupancy(nivel, gradoParam, this.anioEscolar).subscribe({
            next: (rows) => {
              this._ocupacion.set(
                rows.map((o) => ({
                  ...o,
                  seccion: this.normSec(o.seccion),
                })),
              );
              this.finalizarCargaOcupacion(contexto);
            },
            error: () => {
              this._ocupacion.set(this.ocupacionDesdeEstudiantes(nivel, gradoLabel));
              this.finalizarCargaOcupacion(contexto);
            },
          });
        },
      });
  }

  private mapVacantes(
    rows: Array<{
      seccion: string;
      matriculados: number;
      aforo: number;
      disponibles: number;
    }>,
  ): OcupacionSeccion[] {
    return rows
      .map((v) => ({
        seccion: this.normSec(v.seccion),
        matriculados: v.matriculados,
        capacidad: v.aforo,
        disponibles: v.disponibles,
      }))
      .sort((a, b) => a.seccion.localeCompare(b.seccion));
  }

  private finalizarCargaOcupacion(contexto: 'lista' | 'drawer'): void {
    if (contexto === 'drawer') this.cargandoOcupacion.set(false);
    else this.cargandoOcupacionLista.set(false);
  }

  private ocupacionDesdeEstudiantes(nivel: string, gradoLabel: string): OcupacionSeccion[] {
    const capDefault =
      nivel === 'Inicial' ? 25 : nivel === 'Secundaria' ? 35 : 30;
    const counts = new Map<string, number>();

    for (const e of this._estudiantes()) {
      if (e.nivel !== nivel || gradoKey(e.grado) !== gradoKey(gradoLabel)) continue;
      const sec = this.normSec(e.seccion);
      counts.set(sec, (counts.get(sec) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([seccion, matriculados]) => ({
        seccion,
        matriculados,
        capacidad: capDefault,
        disponibles: Math.max(0, capDefault - matriculados),
      }));
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' = 'success'): void {
    this.notificacion.set({ mensaje, tipo });
    setTimeout(() => this.notificacion.set(null), 3000);
  }
}
