import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { OverlayPortalDirective } from '../../../core/overlay/overlay-portal.directive';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ContinuidadService } from './continuidad.service';
import {
  EstCont,
  RegistroCont,
  Situacion,
  filtraEstudiante,
  filtraRegistro,
  filtrosActivos,
  gradoSig,
  sitBadgeClass,
  sitLabel,
} from './continuidad.model';

// ─── Component ───────────────────────────────────────────────────────────────
@Component({
  selector: 'app-continuidad',
  standalone: true,
  imports: [FormsModule, NgClass, OverlayPortalDirective],
  template: `
<div class="space-y-5">

  <!-- ── HEADER ────────────────────────────────────────────── -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Matrícula por Continuidad</h2>
      <p class="text-sm text-gray-400 mt-0.5">
        Renovación automática · Año Lectivo
        <span class="font-semibold text-indigo-600">{{ anioOrigen }} → {{ anioNuevo }}</span>
      </p>
    </div>
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
        <span class="icon" style="font-size:15px">calendar_today</span> A.E. {{ anioNuevo }}
      </span>
      @if (totalPendientes() > 0) {
        <button class="btn btn-primary text-sm" (click)="cambiarTab('aprobacion')">
          <span class="icon icon-sm">pending_actions</span>
          {{ totalPendientes() }} pendiente{{ totalPendientes() !== 1 ? 's' : '' }}
        </button>
      }
    </div>
  </div>

  @if (errorMsg()) {
    <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMsg() }}
    </div>
  }

  @if (loading()) {
    <div class="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
      Cargando candidatos desde el servidor...
    </div>
  }

  <!-- ── STATS ─────────────────────────────────────────────── -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card p-4 flex items-center gap-3">
      <div class="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
        <span class="icon text-indigo-600">groups</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Total Alumnos</p>
        <p class="text-2xl font-bold text-gray-900">{{ _estudiantes().length }}</p>
        <p class="text-[10px] text-gray-400">A.E. {{ anioOrigen }}</p>
      </div>
    </div>
    <div class="card p-4 flex items-center gap-3">
      <div class="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
        <span class="icon text-green-600">trending_up</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Promovidos</p>
        <p class="text-2xl font-bold text-green-700">{{ totalPromovidos() }}</p>
        <p class="text-[10px] text-gray-400">Avanzan de grado</p>
      </div>
    </div>
    <div class="card p-4 flex items-center gap-3">
      <div class="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
        <span class="icon text-amber-600">replay</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Repitentes</p>
        <p class="text-2xl font-bold text-amber-700">{{ totalRepitentes() }}</p>
        <p class="text-[10px] text-gray-400">Mismo grado</p>
      </div>
    </div>
    <div class="card p-4 flex items-center gap-3">
      <div class="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
        <span class="icon text-rose-500">block</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">No Renuevan</p>
        <p class="text-2xl font-bold text-rose-600">{{ totalRetirados() + totalEgresados() }}</p>
        <p class="text-[10px] text-gray-400">
          {{ totalRetirados() }} retirado{{ totalRetirados() !== 1 ? 's' : '' }} ·
          {{ totalEgresados() }} egresado{{ totalEgresados() !== 1 ? 's' : '' }}
        </p>
      </div>
    </div>
  </div>

  <!-- ── CONFIG BAR (filtros compartidos por pestaña activa) ── -->
  <div class="card p-4">
    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div class="relative flex-1 w-full">
        <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style="font-size:18px">search</span>
        <input class="form-input pl-10 w-full" placeholder="Buscar por nombre, código o DNI..."
          [(ngModel)]="busquedaVal" (ngModelChange)="onBusquedaChange($event)">
      </div>
      <select class="form-input w-full sm:w-44"
        [(ngModel)]="filtroNivelVal" (ngModelChange)="onFiltroNivelChange($event)">
        <option value="todos">Todos los niveles</option>
        <option value="inicial">Inicial</option>
        <option value="primaria">Primaria</option>
        <option value="secundaria">Secundaria</option>
      </select>
      <select class="form-input w-full sm:w-44"
        [(ngModel)]="filtroSitVal" (ngModelChange)="onFiltroSitChange($event)">
        <option value="todos">Todas las situaciones</option>
        <option value="promovido">Promovido</option>
        <option value="repitente">Repitente</option>
        <option value="retirado">Retirado</option>
        <option value="egresado">Egresado</option>
      </select>
      @if (hayFiltrosActivos()) {
        <button type="button" class="btn btn-secondary text-sm whitespace-nowrap" (click)="limpiarFiltros()">
          <span class="icon icon-sm">filter_alt_off</span> Limpiar
        </button>
      }
    </div>
      @if (hayFiltrosActivos()) {
      <p class="text-xs text-indigo-600 mt-2">
        Filtros activos · {{ resultadosTabActiva() }} resultado{{ resultadosTabActiva() !== 1 ? 's' : '' }}
        en {{ tabLabel() }}
      </p>
    }
    <div class="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
      <p class="text-xs text-gray-500">
        @if (verTodo()) {
          Mostrando los {{ resultadosTabActiva() }} resultado{{ resultadosTabActiva() !== 1 ? 's' : '' }}
        } @else if (resultadosTabActiva() > 0) {
          {{ rangoInicio() + 1 }}–{{ rangoFin() }} de {{ resultadosTabActiva() }}
        } @else {
          Sin resultados
        }
      </p>
      <button type="button" class="btn btn-secondary btn-sm" (click)="toggleVerTodo()">
        <span class="icon icon-sm">{{ verTodo() ? 'view_module' : 'view_list' }}</span>
        {{ verTodo() ? 'Paginar de 10 en 10' : 'Ver en una sola lista' }}
      </button>
    </div>
  </div>

  <!-- ── TABS ───────────────────────────────────────────────── -->
  <div class="tabs">
    <button class="tab" [class.tab-active]="tab() === 'generacion'" (click)="cambiarTab('generacion')">
      <span class="icon icon-sm">list_alt</span> Generar Continuidad
    </button>
    <button class="tab" [class.tab-active]="tab() === 'aprobacion'" (click)="cambiarTab('aprobacion')">
      <span class="icon icon-sm">pending_actions</span> Pendiente Aprobación
      @if (totalPendientes() > 0) {
        <span class="ml-1.5 px-1.5 py-px text-[10px] font-bold bg-amber-500 text-white rounded-full leading-none">
          {{ totalPendientes() }}
        </span>
      }
    </button>
    <button class="tab" [class.tab-active]="tab() === 'historial'" (click)="cambiarTab('historial')">
      <span class="icon icon-sm">history</span> Historial
    </button>
  </div>

  <!-- ══════════ TAB 1: GENERACIÓN ══════════ -->
  @if (tab() === 'generacion') {
    <div class="space-y-3 animate-fade-in">

      <!-- Toolbar -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <button class="btn btn-secondary text-sm" (click)="toggleTodo()">
            <span class="icon icon-sm">{{ todoSeleccionado() ? 'check_box' : 'check_box_outline_blank' }}</span>
            {{ todoSeleccionado() ? 'Deseleccionar todo' : 'Seleccionar aptos' }}
          </button>
          @if (seleccionados().length > 0) {
            <span class="text-sm text-gray-500">
              <span class="font-semibold text-indigo-600">{{ seleccionados().length }}</span>
              seleccionado{{ seleccionados().length !== 1 ? 's' : '' }}
            </span>
          }
        </div>
        <button class="btn btn-primary"
          [disabled]="seleccionados().length === 0"
          (click)="abrirModalConfirm()">
          <span class="icon icon-sm">autorenew</span>
          Generar Matrículas
          @if (seleccionados().length > 0) { <span class="ml-0.5">({{ seleccionados().length }})</span> }
        </button>
      </div>

      <!-- Tabla -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th class="w-10"></th>
                <th>Estudiante</th>
                <th>Grado Actual</th>
                <th>Prom. Final</th>
                <th>Situación</th>
                <th>Grado Propuesto</th>
                <th>Secc.</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (e of filtradosVista(); track e.id) {
                <tr [ngClass]="{ 'opacity-40': e.situacion === 'retirado', 'bg-green-50/40': e.generado }">
                  <!-- Checkbox -->
                  <td class="text-center">
                    @if (!e.generado && e.situacion !== 'retirado' && e.situacion !== 'egresado') {
                      <input type="checkbox" class="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                        [checked]="e.seleccionado" (change)="toggleSeleccion(e.id)">
                    } @else {
                      <span class="icon text-base"
                        [ngClass]="e.generado ? 'text-green-400' : 'text-gray-200'">
                        {{ e.generado ? 'check_circle' : 'remove_circle_outline' }}
                      </span>
                    }
                  </td>
                  <!-- Estudiante -->
                  <td>
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        [ngClass]="e.sexo === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'">
                        {{ iniciales(e.nombres, e.apellidos) }}
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-gray-800 whitespace-nowrap">{{ e.apellidos }}, {{ e.nombres }}</p>
                        <p class="text-xs text-gray-400">{{ e.codigo }} · DNI {{ e.dni }}</p>
                      </div>
                    </div>
                  </td>
                  <!-- Grado actual -->
                  <td class="text-sm text-gray-700 whitespace-nowrap">
                    {{ e.gradoActual }} <span class="text-gray-400">{{ e.seccionActual }}</span>
                  </td>
                  <!-- Promedio -->
                  <td>
                    @if (e.situacion === 'retirado') {
                      <span class="text-gray-400">—</span>
                    } @else {
                      <span class="text-sm font-bold"
                        [ngClass]="e.promedioFinal >= 11 ? 'text-green-600' : 'text-red-500'">
                        {{ e.promedioFinal.toFixed(1) }}
                      </span>
                    }
                  </td>
                  <!-- Situación (editable) -->
                  <td>
                    <select
                      class="text-xs border rounded-lg px-2 py-1 font-semibold cursor-pointer outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      [value]="e.situacion"
                      (change)="cambiarSituacion(e.id, $any($event.target).value)"
                      [disabled]="e.generado"
                      [ngClass]="{
                        'border-green-200 bg-green-50 text-green-700':  e.situacion === 'promovido',
                        'border-amber-200 bg-amber-50 text-amber-700':  e.situacion === 'repitente',
                        'border-red-200   bg-red-50   text-red-600':    e.situacion === 'retirado',
                        'border-indigo-200 bg-indigo-50 text-indigo-700': e.situacion === 'egresado'
                      }">
                      <option value="promovido">Promovido</option>
                      <option value="repitente">Repitente</option>
                      <option value="retirado">Retirado</option>
                      <option value="egresado">Egresado</option>
                    </select>
                  </td>
                  <!-- Grado propuesto -->
                  <td>
                    @if (e.situacion === 'retirado') {
                      <span class="text-gray-400 text-sm italic">No renueva</span>
                    } @else if (e.situacion === 'egresado') {
                      <span class="badge badge-indigo">Egresado</span>
                    } @else {
                      <div class="flex items-center gap-1 whitespace-nowrap">
                        <span class="icon text-indigo-300" style="font-size:14px">arrow_forward</span>
                        <span class="text-sm font-medium text-gray-700">{{ e.gradoPropuesto }}</span>
                      </div>
                    }
                  </td>
                  <!-- Sección propuesta -->
                  <td class="text-sm text-gray-600 font-medium">{{ e.seccionPropuesta }}</td>
                  <!-- Estado generación -->
                  <td>
                    @if (e.generado) {
                      <span class="badge badge-green">
                        <span class="icon" style="font-size:11px;margin-right:3px">check_circle</span>Generado
                      </span>
                    } @else if (e.situacion === 'retirado') {
                      <span class="badge badge-red">
                        <span class="icon" style="font-size:11px;margin-right:3px">block</span>Excluido
                      </span>
                    } @else if (e.situacion === 'egresado') {
                      <span class="badge badge-indigo">Egresado</span>
                    } @else {
                      <span class="badge badge-gray">Pendiente</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="py-14 text-center">
                    <span class="icon text-gray-200 block mb-2" style="font-size:44px">search_off</span>
                    <p class="text-gray-400 text-sm">No se encontraron estudiantes con esos filtros</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <!-- Footer -->
        <div class="px-4 py-2.5 border-t bg-gray-50/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>{{ filtrados().length }} resultado{{ filtrados().length !== 1 ? 's' : '' }}</span>
          <span>{{ totalGenerados() }} generado{{ totalGenerados() !== 1 ? 's' : '' }} de {{ _estudiantes().length }}</span>
        </div>
        @if (!verTodo() && filtrados().length > POR_PAGINA) {
          <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span class="text-xs text-gray-500">{{ rangoInicio() + 1 }}–{{ rangoFin() }} de {{ filtrados().length }}</span>
            <div class="flex items-center gap-1">
              <button class="btn-icon" [disabled]="paginaActual() === 1" (click)="paginaActual.update(p => p - 1)">
                <span class="icon icon-sm">chevron_left</span>
              </button>
              @for (p of paginas(); track p) {
                <button class="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                        [ngClass]="p === paginaActual() ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                        (click)="paginaActual.set(p)">{{ p }}</button>
              }
              <button class="btn-icon" [disabled]="paginaActual() === totalPaginas()" (click)="paginaActual.update(p => p + 1)">
                <span class="icon icon-sm">chevron_right</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  }

  <!-- ══════════ TAB 2: PENDIENTE APROBACIÓN ══════════ -->
  @if (tab() === 'aprobacion') {
    <div class="space-y-4 animate-fade-in">

      <!-- Toolbar aprobación -->
      <div class="flex items-center justify-end gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          @if (pendientesApro().length > 0 && puedeAprobar()) {
            <button class="btn btn-success" (click)="aprobarTodo()" [disabled]="saving()">
              <span class="icon icon-sm">done_all</span>
              Aprobar todo ({{ pendientesApro().length }})
            </button>
          }
        </div>
      </div>

      <!-- Alerta info -->
      @if (puedeAprobar()) {
        <div class="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
          <span class="icon text-amber-500 shrink-0 mt-0.5" style="font-size:18px">info</span>
          <p>Como <strong>Director o Administrador</strong>, puedes revisar y aprobar las matrículas generadas antes de activarse en el sistema.</p>
        </div>
      } @else {
        <div class="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
          <span class="icon text-blue-500 shrink-0 mt-0.5" style="font-size:18px">lock</span>
          <p>Solo el <strong>Director</strong> o el <strong>Administrador</strong> pueden aprobar o rechazar matrículas por continuidad. Puedes consultar el estado de los pendientes.</p>
        </div>
      }

      @if (pendientesApro().length === 0) {
        <div class="card p-14 flex flex-col items-center justify-center text-center">
          <span class="icon mb-3" style="font-size:52px"
            [ngClass]="hayFiltrosActivos() ? 'text-gray-300' : 'text-green-300'">
            {{ hayFiltrosActivos() ? 'search_off' : 'check_circle' }}
          </span>
          <h3 class="font-semibold text-gray-700 mb-1">
            {{ hayFiltrosActivos() ? 'Sin coincidencias con los filtros' : 'Sin pendientes de aprobación' }}
          </h3>
          <p class="text-sm text-gray-400">
            {{ hayFiltrosActivos()
              ? 'Prueba otro nivel, situación o término de búsqueda.'
              : 'Todas las matrículas generadas han sido revisadas' }}
          </p>
          @if (hayFiltrosActivos()) {
            <button type="button" class="btn btn-secondary text-sm mt-3" (click)="limpiarFiltros()">Limpiar filtros</button>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          @for (r of pendientesAproVista(); track r.id) {
            <div class="card overflow-hidden hover:shadow-md transition-shadow duration-200">
              <!-- Cabecera -->
              <div class="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-transparent border-b">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-amber-100 text-amber-700">
                  {{ iniciales(r.nombres, r.apellidos) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-800 truncate">{{ r.apellidos }}, {{ r.nombres }}</p>
                  <p class="text-xs text-gray-400">{{ r.codigo }}</p>
                </div>
                <span class="badge" [ngClass]="sitBadgeClass(r.situacion)">{{ sitLabel(r.situacion) }}</span>
              </div>
              <!-- Cuerpo -->
              <div class="px-4 py-3 space-y-3">
                <!-- Progresión de grado -->
                <div class="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <div class="text-center flex-1">
                    <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{{ r.anioAnterior }}</p>
                    <p class="text-sm font-bold text-gray-700">{{ r.gradoAnterior }} {{ r.seccionAnterior }}</p>
                  </div>
                  <div class="flex flex-col items-center gap-1 px-2">
                    <span class="icon text-indigo-400" style="font-size:22px">east</span>
                  </div>
                  <div class="text-center flex-1">
                    <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{{ r.anioNuevo }}</p>
                    <p class="text-sm font-bold text-indigo-700">{{ r.gradoNuevo }} {{ r.seccionNueva }}</p>
                    @if (r.aforoSalon !== undefined) {
                      <p class="text-[10px] mt-0.5"
                         [ngClass]="(r.vacantesDisponibles ?? 0) > 0 ? 'text-green-600' : 'text-red-600'">
                        Vacantes: {{ r.vacantesDisponibles ?? 0 }} / {{ r.aforoSalon }}
                      </p>
                    }
                  </div>
                </div>
                <!-- Meta info -->
                <div class="flex items-center justify-between text-xs text-gray-400 flex-wrap gap-1">
                  <span>
                    Prom:
                    <span class="font-bold" [ngClass]="r.promedioFinal >= 11 ? 'text-green-600' : 'text-red-500'">
                      {{ r.promedioFinal.toFixed(1) }}
                    </span>
                  </span>
                  <span>Generado: <span class="text-gray-600">{{ r.fechaGeneracion }}</span></span>
                  <span>Por: <span class="text-gray-600">{{ r.generadoPor }}</span></span>
                </div>
              </div>
              <!-- Acciones -->
              @if (puedeAprobar()) {
                <div class="flex gap-2 px-4 py-3 border-t bg-gray-50/50">
                  <button class="btn btn-success flex-1 text-sm" (click)="aprobar(r.id)" [disabled]="saving() || (r.vacantesDisponibles !== undefined && r.vacantesDisponibles <= 0)">
                    <span class="icon icon-sm">check</span> Aprobar
                  </button>
                  <button class="btn btn-danger flex-1 text-sm" (click)="abrirRechazo(r.id)" [disabled]="saving()">
                    <span class="icon icon-sm">close</span> Rechazar
                  </button>
                </div>
              }
            </div>
          }
        </div>
        @if (!verTodo() && pendientesApro().length > POR_PAGINA) {
          <div class="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-xl bg-gray-50/50">
            <span class="text-xs text-gray-500">{{ rangoInicio() + 1 }}–{{ rangoFin() }} de {{ pendientesApro().length }}</span>
            <div class="flex items-center gap-1">
              <button class="btn-icon" [disabled]="paginaActual() === 1" (click)="paginaActual.update(p => p - 1)">
                <span class="icon icon-sm">chevron_left</span>
              </button>
              @for (p of paginas(); track p) {
                <button class="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                        [ngClass]="p === paginaActual() ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                        (click)="paginaActual.set(p)">{{ p }}</button>
              }
              <button class="btn-icon" [disabled]="paginaActual() === totalPaginas()" (click)="paginaActual.update(p => p + 1)">
                <span class="icon icon-sm">chevron_right</span>
              </button>
            </div>
          </div>
        }
      }
    </div>
  }

  <!-- ══════════ TAB 3: HISTORIAL ══════════ -->
  @if (tab() === 'historial') {
    <div class="animate-fade-in">
      @if (historialReg().length === 0) {
        <div class="card p-14 flex flex-col items-center justify-center text-center">
          <span class="icon mb-3" style="font-size:52px"
            [ngClass]="hayFiltrosActivos() ? 'text-gray-300' : 'text-gray-200'">
            {{ hayFiltrosActivos() ? 'search_off' : 'history' }}
          </span>
          <p class="text-sm text-gray-400">
            {{ hayFiltrosActivos() ? 'No hay registros en el historial con esos filtros' : 'No hay registros en el historial aún' }}
          </p>
          @if (hayFiltrosActivos()) {
            <button type="button" class="btn btn-secondary text-sm mt-3" (click)="limpiarFiltros()">Limpiar filtros</button>
          }
        </div>
      } @else {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Año</th>
                  <th>Grado Anterior</th>
                  <th>Grado Nuevo</th>
                  <th>Situación</th>
                  <th>Promedio</th>
                  <th>Estado</th>
                  <th>Aprobado / Rechazado por</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (r of historialRegVista(); track r.id) {
                  <tr>
                    <td>
                      <p class="text-sm font-semibold text-gray-800">{{ r.apellidos }}, {{ r.nombres }}</p>
                      <p class="text-xs text-gray-400">{{ r.codigo }}</p>
                    </td>
                    <td class="text-xs text-gray-500 whitespace-nowrap">{{ r.anioAnterior }} → {{ r.anioNuevo }}</td>
                    <td class="text-sm text-gray-600 whitespace-nowrap">{{ r.gradoAnterior }} {{ r.seccionAnterior }}</td>
                    <td class="text-sm font-medium text-indigo-700 whitespace-nowrap">{{ r.gradoNuevo }} {{ r.seccionNueva }}</td>
                    <td><span class="badge" [ngClass]="sitBadgeClass(r.situacion)">{{ sitLabel(r.situacion) }}</span></td>
                    <td>
                      <span class="text-sm font-bold"
                        [ngClass]="r.promedioFinal >= 11 ? 'text-green-600' : 'text-red-500'">
                        {{ r.promedioFinal > 0 ? r.promedioFinal.toFixed(1) : '—' }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="r.estado === 'aprobado' ? 'badge-green' : 'badge-red'">
                        <span class="icon" style="font-size:11px;margin-right:3px">
                          {{ r.estado === 'aprobado' ? 'check_circle' : 'cancel' }}
                        </span>
                        {{ r.estado === 'aprobado' ? 'Aprobado' : 'Rechazado' }}
                      </span>
                    </td>
                    <td class="text-xs text-gray-600">
                      {{ r.aprobadoPor ?? '—' }}
                      @if (r.motivoRechazo) {
                        <p class="text-red-400 mt-0.5">{{ r.motivoRechazo }}</p>
                      }
                    </td>
                    <td class="text-xs text-gray-400 whitespace-nowrap">
                      {{ r.fechaAprobacion ?? '—' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (!verTodo() && historialReg().length > POR_PAGINA) {
            <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <span class="text-xs text-gray-500">{{ rangoInicio() + 1 }}–{{ rangoFin() }} de {{ historialReg().length }}</span>
              <div class="flex items-center gap-1">
                <button class="btn-icon" [disabled]="paginaActual() === 1" (click)="paginaActual.update(p => p - 1)">
                  <span class="icon icon-sm">chevron_left</span>
                </button>
                @for (p of paginas(); track p) {
                  <button class="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                          [ngClass]="p === paginaActual() ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                          (click)="paginaActual.set(p)">{{ p }}</button>
                }
                <button class="btn-icon" [disabled]="paginaActual() === totalPaginas()" (click)="paginaActual.update(p => p + 1)">
                  <span class="icon icon-sm">chevron_right</span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  }

  <!-- ══════════ MODAL CONFIRMACIÓN ══════════ -->
  @if (modalConfirm()) {
    <div appOverlayPortal class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" (click)="cerrarModal()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in" (click)="$event.stopPropagation()">
        <div class="px-6 py-5 border-b">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
              <span class="icon text-indigo-600" style="font-size:24px">autorenew</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-lg">Confirmar Generación</h3>
              <p class="text-xs text-gray-400 mt-0.5">Año Lectivo {{ anioOrigen }} → {{ anioNuevo }}</p>
            </div>
          </div>
        </div>
        <div class="px-6 py-5 space-y-4">
          <p class="text-sm text-gray-600">
            Se generarán <span class="font-bold text-indigo-600">{{ seleccionados().length }}</span>
            matrícula{{ seleccionados().length !== 1 ? 's' : '' }} por continuidad.
            Quedarán en estado <span class="font-semibold text-amber-700">Pendiente de Aprobación</span>
            hasta que el Director o Administrador las revise.
          </p>
          <!-- Vista previa -->
          <div class="max-h-44 overflow-y-auto rounded-xl bg-gray-50 divide-y divide-gray-100">
            @for (e of seleccionados(); track e.id) {
              <div class="flex items-center justify-between px-3 py-2 text-sm">
                <span class="text-gray-700 font-medium">{{ e.apellidos }}, {{ e.nombres }}</span>
                <div class="flex items-center gap-1.5 text-xs shrink-0 ml-2">
                  <span class="text-gray-400">{{ e.gradoActual }}</span>
                  <span class="icon text-indigo-400" style="font-size:14px">arrow_forward</span>
                  <span class="font-semibold text-indigo-600">{{ e.gradoPropuesto }}</span>
                </div>
              </div>
            }
          </div>
          <!-- Info box -->
          <div class="flex gap-2 bg-amber-50 rounded-xl p-3 text-xs text-amber-800 border border-amber-100">
            <span class="icon text-amber-500 shrink-0" style="font-size:16px">info</span>
            Las matrículas generadas requieren aprobación del Director o Administrador antes de activarse.
          </div>
        </div>
        <div class="flex gap-3 px-6 py-4 border-t">
          <button class="btn btn-secondary flex-1" (click)="cerrarModal()">Cancelar</button>
          <button class="btn btn-primary flex-1" (click)="confirmarGeneracion()">
            <span class="icon icon-sm">autorenew</span> Confirmar y Generar
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ══════════ DRAWER RECHAZO ══════════ -->
  @if (drawerRechazo()) {
    <div appOverlayPortal class="fixed inset-0 z-40">
    <div class="absolute inset-0 bg-black/40" (click)="cerrarRechazo()"></div>
    <div class="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl flex flex-col animate-slide-in-r">
      <div class="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-rose-600 to-rose-500">
        <div class="flex items-center gap-3">
          <span class="icon text-white" style="font-size:22px">cancel</span>
          <h3 class="font-bold text-white">Rechazar Matrícula</h3>
        </div>
        <button class="btn-icon text-white/80 hover:text-white hover:bg-white/10" (click)="cerrarRechazo()">
          <span class="icon">close</span>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        <p class="text-sm text-gray-500">Indica el motivo del rechazo. Quedará registrado en el historial de trazabilidad.</p>
        <div>
          <label class="form-label mb-1 block">Motivo del rechazo <span class="text-red-400">*</span></label>
          <textarea class="form-input w-full resize-none" rows="5"
            placeholder="Ej: Documentación incompleta, datos incorrectos, alumno no cumple requisitos..."
            [(ngModel)]="motivoRechazoVal" (ngModelChange)="motivoRechazo.set($event)"></textarea>
        </div>
        <div class="flex gap-2 bg-rose-50 rounded-xl p-3 text-xs text-rose-700 border border-rose-100">
          <span class="icon text-rose-400 shrink-0" style="font-size:15px">warning</span>
          El registro pasará a estado "Rechazado" y podrá ser revisado en el historial.
        </div>
      </div>
      <div class="flex gap-3 p-5 border-t">
        <button class="btn btn-secondary flex-1" (click)="cerrarRechazo()">Cancelar</button>
        <button class="btn btn-danger flex-1" [disabled]="!motivoRechazo()" (click)="confirmarRechazo()">
          <span class="icon icon-sm">cancel</span> Confirmar Rechazo
        </button>
      </div>
    </div>
    </div>
  }

</div>
  `
})
export class ContinuidadComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  private readonly auth = inject(AuthService);
  private readonly continuidadService = inject(ContinuidadService);

  readonly anioOrigen = 2025;
  readonly anioNuevo  = 2026;
  readonly POR_PAGINA = 10;

  // ── Signals ──────────────────────────────────────────────
  readonly tab           = signal<'generacion' | 'aprobacion' | 'historial'>('generacion');
  readonly paginaActual  = signal(1);
  readonly verTodo       = signal(false);
  readonly _estudiantes  = signal<EstCont[]>([]);
  readonly _registros    = signal<RegistroCont[]>([]);
  readonly _busqueda     = signal('');
  readonly _filtroNivel  = signal('todos');
  readonly _filtroSit    = signal('todos');
  readonly modalConfirm  = signal(false);
  readonly drawerRechazo = signal(false);
  readonly rechazandoId  = signal<number | null>(null);
  readonly motivoRechazo = signal('');
  readonly errorMsg      = signal('');
  readonly loading       = this.continuidadService.loading;
  readonly saving        = this.continuidadService.saving;
  readonly puedeAprobar  = computed(() => this.auth.hasPermiso('matricula.aprobar'));

  // Backing properties for ngModel two-way binding
  busquedaVal     = '';
  filtroNivelVal  = 'todos';
  filtroSitVal    = 'todos';
  motivoRechazoVal = '';

  private filtrosActuales() {
    return {
      busqueda: this._busqueda(),
      nivel: this._filtroNivel(),
      situacion: this._filtroSit(),
    };
  }

  // ── Computed ─────────────────────────────────────────────
  readonly hayFiltrosActivos = computed(() => {
    const f = this.filtrosActuales();
    return filtrosActivos(f.busqueda, f.nivel, f.situacion);
  });

  readonly filtrados = computed(() => {
    const f = this.filtrosActuales();
    return this._estudiantes().filter((e) =>
      filtraEstudiante(e, f.busqueda, f.nivel, f.situacion),
    );
  });

  readonly listaActiva = computed((): EstCont[] | RegistroCont[] => {
    const t = this.tab();
    if (t === 'generacion') return this.filtrados();
    if (t === 'aprobacion') return this.pendientesApro();
    return this.historialReg();
  });

  readonly totalPaginas = computed(() => {
    if (this.verTodo()) return 1;
    return Math.max(1, Math.ceil(this.listaActiva().length / this.POR_PAGINA));
  });

  readonly rangoInicio = computed(() => (this.paginaActual() - 1) * this.POR_PAGINA);
  readonly rangoFin = computed(() =>
    Math.min(this.rangoInicio() + this.POR_PAGINA, this.listaActiva().length),
  );

  readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const ini = Math.max(1, actual - 2);
    const fin = Math.min(total, actual + 2);
    return Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
  });

  readonly filtradosVista = computed(() => this.paginar(this.filtrados()));
  readonly pendientesAproVista = computed(() => this.paginar(this.pendientesApro()));
  readonly historialRegVista = computed(() => this.paginar(this.historialReg()));

  readonly seleccionados = computed(() =>
    this._estudiantes().filter(e => e.seleccionado && !e.generado && e.situacion !== 'retirado' && e.situacion !== 'egresado')
  );

  readonly todoSeleccionado = computed(() => {
    const aptos = this.filtrados().filter(e => !e.generado && e.situacion !== 'retirado' && e.situacion !== 'egresado');
    return aptos.length > 0 && aptos.every(e => e.seleccionado);
  });

  readonly pendientesApro = computed(() => {
    const f = this.filtrosActuales();
    return this._registros().filter((r) => {
      if (r.estado !== 'pendiente') return false;
      return filtraRegistro(r, f.busqueda, f.nivel, f.situacion);
    });
  });

  readonly historialReg = computed(() => {
    const f = this.filtrosActuales();
    return this._registros().filter((r) => {
      if (r.estado !== 'aprobado' && r.estado !== 'rechazado') return false;
      return filtraRegistro(r, f.busqueda, f.nivel, f.situacion);
    });
  });

  readonly resultadosTabActiva = computed(() => {
    const t = this.tab();
    if (t === 'generacion') return this.filtrados().length;
    if (t === 'aprobacion') return this.pendientesApro().length;
    return this.historialReg().length;
  });

  readonly tabLabel = computed(() => {
    const labels = {
      generacion: 'Generar Continuidad',
      aprobacion: 'Pendiente Aprobación',
      historial: 'Historial',
    } as const;
    return labels[this.tab()];
  });

  readonly totalPromovidos = computed(() => this._estudiantes().filter(e => e.situacion === 'promovido').length);
  readonly totalRepitentes = computed(() => this._estudiantes().filter(e => e.situacion === 'repitente').length);
  readonly totalRetirados  = computed(() => this._estudiantes().filter(e => e.situacion === 'retirado').length);
  readonly totalEgresados  = computed(() => this._estudiantes().filter(e => e.situacion === 'egresado').length);
  readonly totalGenerados  = computed(() => this._estudiantes().filter(e => e.generado).length);
  readonly totalPendientes = computed(() => this._registros().filter(r => r.estado === 'pendiente').length);

  ngOnInit(): void {
    this.layout.setTitle('Matrícula por Continuidad');
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.errorMsg.set('');
    this.continuidadService.getCandidates(this.anioOrigen, this.anioNuevo).subscribe({
      next: (candidates) => {
        this._estudiantes.set(candidates.map((e) => ({ ...e, seleccionado: false })));
      },
      error: (err: Error) => this.errorMsg.set(err.message),
    });
    this.continuidadService.getRecords(this.anioNuevo).subscribe({
      next: (records) => this._registros.set(records),
      error: (err: Error) => this.errorMsg.set(err.message),
    });
  }

  // ── Helpers ──────────────────────────────────────────────
  iniciales(nombres: string, apellidos: string): string {
    return `${nombres[0] ?? ''}${apellidos[0] ?? ''}`.toUpperCase();
  }

  sitLabel = sitLabel;
  sitBadgeClass = sitBadgeClass;

  onBusquedaChange(value: string): void {
    this.busquedaVal = value;
    this._busqueda.set(value);
    this.resetPagina();
  }

  onFiltroNivelChange(value: string): void {
    this.filtroNivelVal = value;
    this._filtroNivel.set(value);
    this.resetPagina();
  }

  onFiltroSitChange(value: string): void {
    this.filtroSitVal = value;
    this._filtroSit.set(value);
    this.resetPagina();
  }

  limpiarFiltros(): void {
    this.busquedaVal = '';
    this.filtroNivelVal = 'todos';
    this.filtroSitVal = 'todos';
    this._busqueda.set('');
    this._filtroNivel.set('todos');
    this._filtroSit.set('todos');
    this.resetPagina();
  }

  cambiarTab(t: 'generacion' | 'aprobacion' | 'historial'): void {
    this.tab.set(t);
    this.resetPagina();
  }

  toggleVerTodo(): void {
    this.verTodo.update((v) => !v);
    this.resetPagina();
  }

  private resetPagina(): void {
    this.paginaActual.set(1);
  }

  private paginar<T>(items: T[]): T[] {
    if (this.verTodo()) return items;
    return items.slice(this.rangoInicio(), this.rangoFin());
  }

  // ── Actions ──────────────────────────────────────────────
  toggleTodo(): void {
    const aptos   = this.filtrados().filter(e => !e.generado && e.situacion !== 'retirado' && e.situacion !== 'egresado');
    const todosOk = aptos.length > 0 && aptos.every(e => e.seleccionado);
    const ids     = new Set(aptos.map(e => e.id));
    this._estudiantes.update(list =>
      list.map(e => ids.has(e.id) ? { ...e, seleccionado: !todosOk } : e)
    );
  }

  toggleSeleccion(id: number): void {
    this._estudiantes.update(list =>
      list.map(e => e.id === id ? { ...e, seleccionado: !e.seleccionado } : e)
    );
  }

  cambiarSituacion(id: number, sit: Situacion): void {
    this._estudiantes.update(list => list.map(e => {
      if (e.id !== id) return e;
      return {
        ...e, situacion: sit,
        gradoPropuesto:  gradoSig(e.gradoActual, sit),
        seccionPropuesta: (sit === 'retirado' || sit === 'egresado') ? '—' : e.seccionActual,
      };
    }));
  }

  abrirModalConfirm(): void {
    if (this.seleccionados().length === 0) return;
    this.modalConfirm.set(true);
  }

  cerrarModal(): void { this.modalConfirm.set(false); }

  confirmarGeneracion(): void {
    const sel = this.seleccionados();
    if (!sel.length) return;

    this.continuidadService
      .generate({
        anioOrigen: this.anioOrigen,
        anioNuevo: this.anioNuevo,
        generadoPor: this.auth.nombreCompleto() || 'Administrador',
        items: sel.map((e) => ({
          studentId: e.id,
          situacion: e.situacion,
          seccionNueva: e.seccionPropuesta !== '—' ? e.seccionPropuesta : undefined,
        })),
      })
      .subscribe({
        next: (result) => {
          this._registros.update((list) => [...list, ...result.created]);
          const ids = new Set(sel.map((e) => e.id));
          this._estudiantes.update((list) =>
            list.map((e) =>
              ids.has(e.id) ? { ...e, generado: true, seleccionado: false } : e,
            ),
          );
          this.modalConfirm.set(false);
          this.tab.set('aprobacion');
        },
        error: (err: Error) => this.errorMsg.set(err.message),
      });
  }

  aprobar(id: number): void {
    if (!this.puedeAprobar()) return;
    const aprobadoPor = this.auth.nombreCompleto() || 'Administrador';
    this.continuidadService.approve(id, aprobadoPor).subscribe({
      next: (updated) => {
        this._registros.update((list) =>
          list.map((r) => (r.id === id ? updated : r)),
        );
      },
      error: (err: Error) => this.errorMsg.set(err.message),
    });
  }

  aprobarTodo(): void {
    if (!this.puedeAprobar()) return;
    const aprobadoPor = this.auth.nombreCompleto() || 'Administrador';
    this.continuidadService.approveAll(this.anioNuevo, aprobadoPor).subscribe({
      next: (result) => {
        const updatedMap = new Map(result.items.map((r) => [r.id, r]));
        this._registros.update((list) =>
          list.map((r) => updatedMap.get(r.id) ?? r),
        );
      },
      error: (err: Error) => this.errorMsg.set(err.message),
    });
  }

  abrirRechazo(id: number): void {
    this.rechazandoId.set(id);
    this.motivoRechazoVal = '';
    this.motivoRechazo.set('');
    this.drawerRechazo.set(true);
  }

  cerrarRechazo(): void {
    this.drawerRechazo.set(false);
    this.rechazandoId.set(null);
  }

  confirmarRechazo(): void {
    if (!this.puedeAprobar()) return;
    const id = this.rechazandoId();
    if (!id) return;
    const motivo = this.motivoRechazo() || 'Sin especificar';
    this.continuidadService.reject(id, motivo).subscribe({
      next: (updated) => {
        this._registros.update((list) =>
          list.map((r) => (r.id === id ? updated : r)),
        );
        this.cerrarRechazo();
      },
      error: (err: Error) => this.errorMsg.set(err.message),
    });
  }
}


