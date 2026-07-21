import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { InstitucionalService } from '../../administracion/institucional/institucional.service';
import {
  buildGradoOptions,
  GradoFiltroOption,
  NCFG,
  NivelLogro,
} from '../competencias/competencias.model';
import {
  EstadoLibreta,
  Libreta,
  LibretaFilters,
  LibretaInstitucion,
  nivelCompetencia,
} from './libretas.model';
import { LibretasService } from './libretas.service';

@Component({
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
@if (toast()) {
  <div class="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-scale-in"
       [ngClass]="toast()!.tipo === 'ok' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'">
    <span class="icon text-base">{{ toast()!.tipo === 'ok' ? 'check_circle' : 'error' }}</span>
    {{ toast()!.msg }}
  </div>
}

<div class="space-y-5 animate-fade-in">

  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Libretas de Notas</h2>
      <p class="text-sm text-gray-500">Generación y firma de boletines con notas por bimestre transcurrido</p>
    </div>
    <div class="flex gap-2 flex-wrap">
      <button class="btn btn-secondary" (click)="generarTodas()" [disabled]="loading() || saving()">
        <span class="icon text-base">auto_awesome</span> Generar Pendientes
      </button>
      <button class="btn btn-secondary" (click)="descargarPdfSalon()" [disabled]="!libretas().length || pdfLoading()">
        <span class="icon text-base">picture_as_pdf</span> PDF Salón
      </button>
      <button class="btn btn-primary" (click)="descargarPdfActual()" [disabled]="!libretaActual() || pdfLoading()">
        <span class="icon text-base">picture_as_pdf</span> PDF Libreta
      </button>
    </div>
  </div>

  @if (error()) {
    <div class="card p-4 border-red-200 bg-red-50 text-red-700 text-sm">{{ error() }}</div>
  }

  @let k = kpis();
  <div class="grid grid-cols-4 gap-4">
    <div class="card p-4">
      <div class="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</div>
      <div class="text-2xl font-bold text-gray-800 mt-1">{{ k.total }}</div>
      <div class="text-xs text-gray-400">libretas</div>
    </div>
    <div class="card p-4 border-l-4 border-yellow-400">
      <div class="text-xs text-yellow-600 font-medium uppercase tracking-wide">Pendientes</div>
      <div class="text-2xl font-bold text-yellow-700 mt-1">{{ k.pendiente }}</div>
      <div class="text-xs text-gray-400">sin generar</div>
    </div>
    <div class="card p-4 border-l-4 border-blue-400">
      <div class="text-xs text-blue-600 font-medium uppercase tracking-wide">Generadas</div>
      <div class="text-2xl font-bold text-blue-700 mt-1">{{ k.generada }}</div>
      <div class="text-xs text-gray-400">sin firmar</div>
    </div>
    <div class="card p-4 border-l-4 border-emerald-400">
      <div class="text-xs text-emerald-600 font-medium uppercase tracking-wide">Firmadas</div>
      <div class="text-2xl font-bold text-emerald-700 mt-1">{{ k.firmada }}</div>
      <div class="text-xs text-gray-400">director + tutor</div>
    </div>
  </div>

  <div class="card p-4 flex flex-wrap items-center gap-4">
    <div class="flex items-center gap-2">
      <label class="form-label mb-0">Nivel académico</label>
      <select class="form-input py-1.5 w-36" [ngModel]="selNivel()" (ngModelChange)="onNivelChange($event)">
        @for (n of nivelesInst(); track n) {
          <option [value]="n">{{ n }}</option>
        }
      </select>
    </div>
    <div class="flex items-center gap-2">
      <label class="form-label mb-0">Grado</label>
      <select class="form-input py-1.5 w-32" [ngModel]="selGrado()" (ngModelChange)="onGradoChange($event)"
        [disabled]="!gradosDisponibles().length">
        @for (g of gradosDisponibles(); track g.valor) {
          <option [value]="g.valor">{{ g.etiqueta }}</option>
        }
      </select>
    </div>
    <div class="flex items-center gap-2">
      <label class="form-label mb-0">Sección</label>
      <select class="form-input py-1.5 w-20" [ngModel]="selSeccion()" (ngModelChange)="onSeccionChange($event)"
        [disabled]="!seccionesDisponibles().length">
        @for (s of seccionesDisponibles(); track s) {
          <option [value]="s">{{ s }}</option>
        }
      </select>
    </div>
    <div class="flex items-center gap-2">
      <label class="form-label mb-0">Bimestre</label>
      <div class="flex gap-1">
        @for (b of [1,2,3,4]; track b) {
          <button type="button"
                  class="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                  [disabled]="!bimestreDisponible(b)"
                  [ngClass]="!bimestreDisponible(b)
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-60'
                    : selBimestre() === b
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                  (click)="selectBimestre(b)">B{{ b }}</button>
        }
      </div>
    </div>
    <div class="flex items-center gap-2 ml-auto">
      <label class="form-label mb-0">Estado</label>
      <div class="flex gap-1">
        @for (opt of estadoOpciones; track opt.val) {
          <button class="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                  [ngClass]="filtroEstado() === opt.val ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                  (click)="setFiltroEstado(opt.val)">{{ opt.label }}</button>
        }
      </div>
    </div>
  </div>

  <div class="flex gap-5 items-start">

    <div class="w-72 shrink-0 card overflow-hidden">
      <div class="px-3 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-700">{{ selGrado() }} {{ selSeccion() }} — B{{ selBimestre() }}</span>
        <span class="badge badge-gray text-xs">{{ libretas().length }}</span>
      </div>
      @if (loading()) {
        <div class="p-6 text-center text-sm text-gray-400">Cargando libretas…</div>
      } @else {
        <div class="divide-y divide-gray-100 max-h-[640px] overflow-y-auto">
          @for (lib of libretas(); track lib.alumnoId) {
            <button class="w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition-colors flex items-center gap-3"
                    [ngClass]="selAlumnoId() === lib.alumnoId ? 'bg-indigo-50 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'"
                    (click)="selectAlumno(lib.alumnoId)">
              <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                {{ lib.alumno[0] }}{{ lib.alumno.split(' ')[1]?.[0] ?? '' }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-gray-800 truncate">{{ lib.alumno }}</div>
                <div class="flex items-center gap-1 mt-0.5">
                  <span [ngClass]="estadoBadge(lib.estado)" class="text-xs">{{ estadoLabel(lib.estado) }}</span>
                  @if (lib.promedioGlobal) {
                    <span class="badge text-xs font-bold" [ngClass]="NCFG[lib.promedioGlobal].badge">{{ lib.promedioGlobal }}</span>
                  }
                </div>
              </div>
              @if (lib.firmaDirector.firmado && lib.firmaTutor.firmado) {
                <span class="icon text-emerald-500 text-sm">verified</span>
              }
            </button>
          } @empty {
            <div class="p-6 text-center text-sm text-gray-400">Sin registros para este filtro</div>
          }
        </div>
      }
    </div>

    <div class="flex-1 min-w-0">
      @if (libretaActual(); as lib) {
        <div class="card overflow-hidden animate-fade-in">

          <div class="bg-indigo-700 text-white px-6 py-5 flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl shrink-0">🏫</div>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-lg leading-tight">
                {{ institucion()?.nombre || 'Institución Educativa' }}
                @if (institucion()?.siglas) {
                  <span class="text-indigo-200 font-semibold text-base">({{ institucion()!.siglas }})</span>
                }
              </div>
              @if (institucion()?.codigoModular || institucion()?.ruc) {
                <div class="text-indigo-200 text-xs mt-0.5">
                  @if (institucion()?.codigoModular) { Cód. Modular: {{ institucion()!.codigoModular }} }
                  @if (institucion()?.codigoModular && institucion()?.ruc) { · }
                  @if (institucion()?.ruc) { RUC: {{ institucion()!.ruc }} }
                </div>
              }
              <div class="text-indigo-200 text-sm mt-0.5">
                @if (institucion()?.ugel) { {{ institucion()!.ugel }} }
                @if (institucion()?.ugel && institucion()?.dre) { · }
                @if (institucion()?.dre) { DRE {{ institucion()!.dre }} }
                @if ((institucion()?.ugel || institucion()?.dre) && institucion()?.distrito) { · }
                {{ institucion()?.distrito || '' }}
                @if (institucion()?.provincia) { , {{ institucion()!.provincia }} }
              </div>
              @if (institucion()?.direccion) {
                <div class="text-indigo-100 text-xs mt-0.5">{{ institucion()!.direccion }}</div>
              }
              <div class="text-indigo-100 text-xs mt-1">
                @if (institucion()?.resolucion) { RVM {{ institucion()!.resolucion }} · }
                Nivel {{ selNivel() }} · Año Lectivo {{ institucion()?.anioLectivo || anioEscolar() }}
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-indigo-300 text-xs uppercase tracking-wider font-medium">Libreta</div>
              <div class="text-3xl font-extrabold">B{{ lib.bimestre }}</div>
              <div class="text-indigo-200 text-xs">{{ lib.bimestre }}° Bimestre</div>
            </div>
          </div>

          <div class="p-6 space-y-5">

            <div class="bg-gray-50 rounded-xl p-4 flex flex-wrap gap-x-8 gap-y-2 border border-gray-100">
              <div>
                <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Alumno(a)</div>
                <div class="font-bold text-gray-800">{{ lib.alumno }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Grado y Sección</div>
                <div class="font-semibold text-gray-800">{{ lib.grado }} "{{ lib.seccion }}"</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Bimestre</div>
                <div class="font-semibold text-gray-800">{{ lib.bimestre }}° Bimestre</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Estado</div>
                <span [ngClass]="estadoBadge(lib.estado)">{{ estadoLabel(lib.estado) }}</span>
              </div>
              @if (lib.promedioGlobal) {
                <div>
                  <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Promedio B{{ lib.bimestre }}</div>
                  <span class="badge font-bold" [ngClass]="NCFG[lib.promedioGlobal].badge">
                    {{ lib.promedioGlobal }} — {{ NCFG[lib.promedioGlobal].label }}
                  </span>
                </div>
              }
              @if (bimestresVisibles().length > 1) {
                <div class="w-full">
                  <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Promedios por bimestre</div>
                  <div class="flex flex-wrap gap-2">
                    @for (b of bimestresVisibles(); track b) {
                      @if (lib.promediosPorBimestre[b]; as prom) {
                        <span class="badge text-xs font-bold" [ngClass]="NCFG[prom].badge">B{{ b }}: {{ prom }}</span>
                      } @else {
                        <span class="badge badge-gray text-xs">B{{ b }}: —</span>
                      }
                    }
                  </div>
                </div>
              }
            </div>

            <div class="overflow-x-auto rounded-xl border border-gray-100">
              <table class="w-full text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-700" style="width:42%">Área / Competencia</th>
                    @for (b of bimestresVisibles(); track b) {
                      <th class="text-center px-2 py-2.5 font-semibold text-gray-700 w-16"
                          [ngClass]="b === selBimestre() ? 'bg-indigo-100 text-indigo-800' : ''">
                        B{{ b }}
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (area of lib.areas; track area.nombre) {
                    <tr>
                      <td [attr.colspan]="1 + bimestresVisibles().length"
                          class="px-4 py-2 font-semibold text-gray-700 text-xs uppercase tracking-wide bg-gray-50 border-t border-gray-200">
                        {{ area.emoji }} {{ area.nombre }}
                      </td>
                    </tr>
                    @for (comp of area.competencias; track comp.codigo) {
                      <tr class="border-t border-gray-100 hover:bg-gray-50">
                        <td class="px-4 py-2">
                          <span class="text-xs text-gray-400 font-mono mr-1">{{ comp.codigo }}</span>
                          <span class="text-gray-700">{{ comp.nombre }}</span>
                        </td>
                        @for (b of bimestresVisibles(); track b) {
                          <td class="px-2 py-2 text-center"
                              [ngClass]="b === selBimestre() ? 'bg-indigo-50/50' : ''">
                            @if (nivelCompetencia(comp, b); as nivel) {
                              <span class="inline-block px-2 py-0.5 rounded-lg text-xs font-bold" [ngClass]="NCFG[nivel].badge">
                                {{ nivel }}
                              </span>
                            } @else { <span class="text-gray-300">—</span> }
                          </td>
                        }
                      </tr>
                    }
                    <tr class="border-t border-gray-200 bg-gray-50/80">
                      <td class="px-4 py-2 text-xs font-semibold text-gray-600">Promedio del área</td>
                      @for (b of bimestresVisibles(); track b) {
                        <td class="px-2 py-2 text-center">
                          @if (area.promediosPorBimestre[b]; as prom) {
                            <span class="inline-block px-2 py-0.5 rounded-lg text-xs font-bold" [ngClass]="NCFG[prom].badge">{{ prom }}</span>
                          } @else { <span class="text-gray-300">—</span> }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div>
              <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1.5">Observaciones del Docente</div>
              @if (editandoFirmas()) {
                <textarea class="form-input text-sm w-full h-16 resize-none"
                          [ngModel]="lib.observaciones"
                          (ngModelChange)="updateObs($event)"></textarea>
              } @else {
                <div class="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-100 italic">
                  {{ lib.observaciones || 'Sin observaciones.' }}
                </div>
              }
            </div>

            <div class="border-t-2 border-dashed border-gray-200 pt-5">
              <div class="flex items-center justify-between mb-5">
                <h3 class="font-semibold text-gray-800 flex items-center gap-2 text-base">
                  <span class="icon text-indigo-500">draw</span> Firmas y Conformidad
                </h3>
                <div class="flex gap-2">
                  @if (!editandoFirmas()) {
                    <button class="btn btn-secondary text-xs py-1.5" (click)="editandoFirmas.set(true)">
                      <span class="icon text-sm">edit</span> Editar firmas
                    </button>
                  } @else {
                    <button class="btn btn-primary text-xs py-1.5" (click)="guardarCambios()" [disabled]="saving()">
                      <span class="icon text-sm">save</span> Guardar cambios
                    </button>
                    <button class="btn btn-ghost text-xs py-1.5" (click)="editandoFirmas.set(false)">Cancelar</button>
                  }
                </div>
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div class="rounded-xl border-2 p-4 transition-colors"
                     [ngClass]="lib.firmaDirector.firmado ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <span class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span class="icon text-indigo-600 text-base">manage_accounts</span>
                      </span>
                      <div>
                        <div class="text-sm font-bold text-gray-700">Director(a)</div>
                        <div class="text-xs text-gray-400">Firma institucional</div>
                      </div>
                    </div>
                    <button class="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                            [ngClass]="lib.firmaDirector.firmado ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'"
                            (click)="toggleFirmaDirector()">
                      <span class="icon text-sm">{{ lib.firmaDirector.firmado ? 'verified' : 'radio_button_unchecked' }}</span>
                      {{ lib.firmaDirector.firmado ? 'Firmado' : 'Pendiente' }}
                    </button>
                  </div>
                  @if (editandoFirmas()) {
                    <div class="space-y-2">
                      <div>
                        <label class="form-label text-xs">Nombre completo</label>
                        <div class="form-input text-sm py-1.5 bg-gray-100 text-gray-700">{{ institucion()?.director || lib.firmaDirector.nombre }}</div>
                        <p class="text-xs text-gray-400 mt-1">Datos del director según configuración institucional.</p>
                      </div>
                      <div>
                        <label class="form-label text-xs">Cargo</label>
                        <div class="form-input text-sm py-1.5 bg-gray-100 text-gray-700">Director(a)</div>
                      </div>
                    </div>
                  } @else {
                    <div class="space-y-1 mb-4">
                      <div class="font-semibold text-gray-800 text-sm">{{ lib.firmaDirector.nombre }}</div>
                      <div class="text-xs text-gray-500">{{ lib.firmaDirector.cargo }}</div>
                      @if (lib.firmaDirector.fechaFirma) {
                        <div class="text-xs text-gray-400 flex items-center gap-1">
                          <span class="icon text-xs">calendar_today</span> {{ lib.firmaDirector.fechaFirma }}
                        </div>
                      }
                    </div>
                    <div class="pt-3 border-t border-gray-200 text-center">
                      @if (lib.firmaDirector.firmado) {
                        <div class="text-indigo-600 text-xl mb-1" style="font-family:cursive;font-style:italic">
                          {{ lib.firmaDirector.nombre.split(' ')[0] }} {{ lib.firmaDirector.nombre.split(' ')[2] ?? '' }}
                        </div>
                      } @else { <div class="h-6"></div> }
                      <div class="h-px bg-gray-400 mx-6 mb-1"></div>
                      <div class="text-xs text-gray-400">Firma y Sello</div>
                    </div>
                  }
                </div>

                <div class="rounded-xl border-2 p-4 transition-colors"
                     [ngClass]="lib.firmaTutor.firmado ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <span class="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                        <span class="icon text-purple-600 text-base">school</span>
                      </span>
                      <div>
                        <div class="text-sm font-bold text-gray-700">Docente Tutor(a)</div>
                        <div class="text-xs text-gray-400">Responsable de aula</div>
                      </div>
                    </div>
                    <button class="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                            [ngClass]="lib.firmaTutor.firmado ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'"
                            (click)="toggleFirmaTutor()">
                      <span class="icon text-sm">{{ lib.firmaTutor.firmado ? 'verified' : 'radio_button_unchecked' }}</span>
                      {{ lib.firmaTutor.firmado ? 'Firmado' : 'Pendiente' }}
                    </button>
                  </div>
                  @if (editandoFirmas()) {
                    <div class="space-y-2">
                      <div>
                        <label class="form-label text-xs">Nombre completo</label>
                        <input class="form-input text-sm py-1.5" type="text"
                               [ngModel]="lib.firmaTutor.nombre" (ngModelChange)="updateFirmaTut('nombre', $event)">
                      </div>
                      <div>
                        <label class="form-label text-xs">Cargo</label>
                        <input class="form-input text-sm py-1.5" type="text"
                               [ngModel]="lib.firmaTutor.cargo" (ngModelChange)="updateFirmaTut('cargo', $event)">
                      </div>
                    </div>
                  } @else {
                    <div class="space-y-1 mb-4">
                      <div class="font-semibold text-gray-800 text-sm">{{ lib.firmaTutor.nombre }}</div>
                      <div class="text-xs text-gray-500">{{ lib.firmaTutor.cargo }}</div>
                      @if (lib.firmaTutor.fechaFirma) {
                        <div class="text-xs text-gray-400 flex items-center gap-1">
                          <span class="icon text-xs">calendar_today</span> {{ lib.firmaTutor.fechaFirma }}
                        </div>
                      }
                    </div>
                    <div class="pt-3 border-t border-gray-200 text-center">
                      @if (lib.firmaTutor.firmado) {
                        <div class="text-purple-600 text-xl mb-1" style="font-family:cursive;font-style:italic">
                          {{ lib.firmaTutor.nombre.split(' ')[0] }} {{ lib.firmaTutor.nombre.split(' ')[2] ?? '' }}
                        </div>
                      } @else { <div class="h-6"></div> }
                      <div class="h-px bg-gray-400 mx-6 mb-1"></div>
                      <div class="text-xs text-gray-400">Firma y Sello</div>
                    </div>
                  }
                </div>
              </div>

              @if (lib.firmaDirector.firmado && lib.firmaTutor.firmado) {
                <div class="mt-5 flex justify-center animate-scale-in">
                  <div class="inline-block border-4 border-emerald-500 rounded-full px-10 py-3 text-center" style="transform: rotate(-7deg)">
                    <div class="text-emerald-600 font-extrabold text-base tracking-wider">✓ CONFORME</div>
                    <div class="text-emerald-500 text-xs font-medium">B{{ lib.bimestre }} · {{ institucion()?.anioLectivo || anioEscolar() }}</div>
                  </div>
                </div>
              }
            </div>

            <div class="flex flex-wrap gap-3 pt-1 border-t border-gray-100">
              @for (n of nivelLogros; track n) {
                <div class="flex items-center gap-1.5 text-xs text-gray-500">
                  <span class="inline-block px-1.5 py-0.5 rounded font-bold" [ngClass]="NCFG[n].badge">{{ n }}</span>
                  {{ NCFG[n].label }}
                </div>
              }
            </div>

            <div class="flex justify-end gap-2 border-t border-gray-100 pt-3">
              @if (lib.estado === 'pendiente') {
                <button class="btn btn-primary" (click)="generarLibreta(lib.alumnoId)" [disabled]="saving()">
                  <span class="icon text-base">auto_awesome</span> Generar Libreta
                </button>
              }
              <button class="btn btn-secondary" (click)="descargarPdfActual()" [disabled]="pdfLoading()">
                <span class="icon text-base">picture_as_pdf</span> Descargar PDF
              </button>
            </div>

          </div>
        </div>
      } @else if (!loading()) {
        <div class="card p-20 flex flex-col items-center justify-center text-center text-gray-400">
          <div class="text-6xl mb-4">📋</div>
          <div class="font-semibold text-gray-600 text-lg mb-1">Selecciona un alumno</div>
          <div class="text-sm">Elige un alumno de la lista para ver y gestionar su libreta de notas</div>
        </div>
      }
    </div>
  </div>
</div>
  `,
})
export class LibretasComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  private readonly libretasService = inject(LibretasService);
  private readonly institucional = inject(InstitucionalService);

  readonly NCFG = NCFG;
  readonly nivelCompetencia = nivelCompetencia;
  readonly nivelLogros: NivelLogro[] = ['AD', 'A', 'B', 'C'];
  readonly estadoOpciones = [
    { val: 'todos', label: 'Todos' },
    { val: 'pendiente', label: 'Pendientes' },
    { val: 'generada', label: 'Generadas' },
    { val: 'firmada', label: 'Firmadas' },
  ] as const;

  libretas = signal<Libreta[]>([]);
  bimestresVisibles = signal<number[]>([]);
  bimestresDisponibles = signal<number[]>([1, 2]);
  institucion = signal<LibretaInstitucion | null>(null);
  resumen = signal({ total: 0, pendiente: 0, generada: 0, firmada: 0 });
  anioEscolar = signal(new Date().getFullYear());

  selNivel = signal('Primaria');
  selGrado = signal('4°');
  selSeccion = signal('A');
  selBimestre = signal(2);
  filtroEstado = signal<EstadoLibreta | 'todos'>('todos');
  selAlumnoId = signal<number | null>(null);
  editandoFirmas = signal(false);
  toast = signal<{ msg: string; tipo: 'ok' | 'err' } | null>(null);
  error = signal<string | null>(null);

  gradosPorNivel = signal<Record<string, GradoFiltroOption[]>>({});
  seccionesPorGrado = signal<Record<string, string[]>>({});
  nivelesInst = signal<string[]>(['Primaria']);

  loading = this.libretasService.loading;
  saving = this.libretasService.saving;
  pdfLoading = this.libretasService.pdfLoading;

  gradosDisponibles = computed(() => this.gradosPorNivel()[this.selNivel()] ?? []);
  seccionesDisponibles = computed(() => {
    const key = `${this.selNivel()}|${this.selGrado()}`;
    return this.seccionesPorGrado()[key] ?? [];
  });

  libretaActual = computed(() => {
    const id = this.selAlumnoId();
    if (!id) return null;
    return this.libretas().find((l) => l.alumnoId === id) ?? null;
  });

  kpis = computed(() => this.resumen());

  ngOnInit() {
    this.layout.setTitle('Libretas de Notas');
    this.institucional.loadEducationLevels().subscribe({
      next: (niveles) => {
        const { gradosPorNivel, seccionesPorGrado } = buildGradoOptions(niveles);
        this.gradosPorNivel.set(gradosPorNivel);
        this.seccionesPorGrado.set(seccionesPorGrado);
        this.nivelesInst.set(niveles.filter((n) => n.activo !== false).map((n) => n.nombre));
        const primero = this.nivelesInst()[0] ?? 'Primaria';
        this.selNivel.set(primero);
        const g0 = gradosPorNivel[primero]?.[0];
        if (g0) {
          this.selGrado.set(g0.valor);
          const secs = seccionesPorGrado[`${primero}|${g0.valor}`];
          if (secs?.length) this.selSeccion.set(secs[0]);
        }
        this.cargar();
      },
      error: () => this.cargar(),
    });
  }

  private filtros(): LibretaFilters {
    return {
      nivel: this.selNivel(),
      grado: this.selGrado(),
      seccion: this.selSeccion(),
      bimestre: this.selBimestre(),
      anio: this.institucion()?.anioLectivo ?? this.anioEscolar(),
      estado: this.filtroEstado(),
    };
  }

  cargar() {
    this.error.set(null);
    this.libretasService.list(this.filtros()).subscribe({
      next: (res) => {
        this.libretas.set(res.libretas);
        this.bimestresVisibles.set(res.bimestresVisibles ?? [res.bimestre]);
        this.bimestresDisponibles.set(res.bimestresDisponibles ?? [res.bimestre]);
        if (res.bimestre !== this.selBimestre()) {
          this.selBimestre.set(res.bimestre);
        }
        this.institucion.set(res.institucion);
        this.resumen.set(res.resumen);
        this.anioEscolar.set(res.institucion.anioLectivo);
        const id = this.selAlumnoId();
        if (id && !res.libretas.some((l) => l.alumnoId === id)) {
          this.selAlumnoId.set(res.libretas[0]?.alumnoId ?? null);
        } else if (!id && res.libretas.length) {
          this.selAlumnoId.set(res.libretas[0].alumnoId);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudieron cargar las libretas.');
        this.libretas.set([]);
      },
    });
  }

  onNivelChange(val: string) {
    this.selNivel.set(val);
    const g = this.gradosDisponibles()[0];
    this.selGrado.set(g?.valor ?? '');
    const secs = g ? this.seccionesPorGrado()[`${val}|${g.valor}`] : [];
    this.selSeccion.set(secs?.[0] ?? 'A');
    this.selAlumnoId.set(null);
    this.cargar();
  }

  onGradoChange(val: string) {
    this.selGrado.set(val);
    const secs = this.seccionesPorGrado()[`${this.selNivel()}|${val}`];
    this.selSeccion.set(secs?.[0] ?? 'A');
    this.selAlumnoId.set(null);
    this.cargar();
  }

  onSeccionChange(val: string) {
    this.selSeccion.set(val);
    this.selAlumnoId.set(null);
    this.cargar();
  }

  selectBimestre(b: number) {
    if (!this.bimestreDisponible(b)) return;
    this.selBimestre.set(b);
    this.editandoFirmas.set(false);
    this.cargar();
  }

  bimestreDisponible(b: number): boolean {
    return this.bimestresDisponibles().includes(b);
  }

  selectAlumno(id: number) {
    this.selAlumnoId.set(id);
    this.editandoFirmas.set(false);
  }

  setFiltroEstado(val: string) {
    this.filtroEstado.set(val as EstadoLibreta | 'todos');
    this.cargar();
  }

  estadoBadge(e: EstadoLibreta) {
    return e === 'firmada' ? 'badge badge-green' : e === 'generada' ? 'badge badge-blue' : 'badge badge-yellow';
  }

  estadoLabel(e: EstadoLibreta) {
    return e === 'firmada' ? 'Firmada' : e === 'generada' ? 'Generada' : 'Pendiente';
  }

  private patchLocal(alumnoId: number, patch: (l: Libreta) => Libreta) {
    this.libretas.update((list) => list.map((x) => (x.alumnoId === alumnoId ? patch(x) : x)));
  }

  toggleFirmaDirector() {
    const l = this.libretaActual();
    if (!l) return;
    const firmado = !l.firmaDirector.firmado;
    const fechaFirma = firmado ? new Date().toLocaleDateString('es-PE') : '';
    this.patchLocal(l.alumnoId, (x) => ({
      ...x,
      firmaDirector: { ...x.firmaDirector, firmado, fechaFirma },
      estado:
        firmado && x.firmaTutor.firmado
          ? 'firmada'
          : !firmado && x.estado === 'firmada'
            ? 'generada'
            : x.estado,
    }));
    this.persistir(l.alumnoId);
  }

  toggleFirmaTutor() {
    const l = this.libretaActual();
    if (!l) return;
    const firmado = !l.firmaTutor.firmado;
    const fechaFirma = firmado ? new Date().toLocaleDateString('es-PE') : '';
    this.patchLocal(l.alumnoId, (x) => ({
      ...x,
      firmaTutor: { ...x.firmaTutor, firmado, fechaFirma },
      estado:
        firmado && x.firmaDirector.firmado
          ? 'firmada'
          : !firmado && x.estado === 'firmada'
            ? 'generada'
            : x.estado,
    }));
    this.persistir(l.alumnoId);
  }

  updateFirmaTut(campo: 'nombre' | 'cargo', val: string) {
    const l = this.libretaActual();
    if (!l) return;
    this.patchLocal(l.alumnoId, (x) => ({
      ...x,
      firmaTutor: { ...x.firmaTutor, [campo]: val },
    }));
  }

  updateObs(val: string) {
    const l = this.libretaActual();
    if (!l) return;
    this.patchLocal(l.alumnoId, (x) => ({ ...x, observaciones: val }));
  }

  private persistir(alumnoId: number) {
    const l = this.libretas().find((x) => x.alumnoId === alumnoId);
    if (!l) return;
    this.libretasService
      .update(alumnoId, {
        ...this.filtros(),
        observaciones: l.observaciones,
        firmaDirectorFirmado: l.firmaDirector.firmado,
        firmaDirectorFecha: l.firmaDirector.fechaFirma,
        firmaTutorNombre: l.firmaTutor.nombre,
        firmaTutorCargo: l.firmaTutor.cargo,
        firmaTutorFirmado: l.firmaTutor.firmado,
        firmaTutorFecha: l.firmaTutor.fechaFirma,
        estado: l.estado,
      })
      .subscribe({
        next: (updated) => {
          this.patchLocal(alumnoId, () => updated);
          this.resumen.set(this.calcResumen());
        },
        error: () => this.mostrarToast('Error al guardar la libreta.', 'err'),
      });
  }

  private calcResumen() {
    const all = this.libretas();
    return {
      total: all.length,
      pendiente: all.filter((l) => l.estado === 'pendiente').length,
      generada: all.filter((l) => l.estado === 'generada').length,
      firmada: all.filter((l) => l.estado === 'firmada').length,
    };
  }

  generarLibreta(alumnoId: number) {
    this.libretasService.generate({ ...this.filtros(), studentIds: [alumnoId] }).subscribe({
      next: () => {
        this.mostrarToast('Libreta generada exitosamente.', 'ok');
        this.cargar();
      },
      error: () => this.mostrarToast('No se pudo generar la libreta.', 'err'),
    });
  }

  generarTodas() {
    this.libretasService.generate(this.filtros()).subscribe({
      next: (res) => {
        this.mostrarToast(`${res.generated} libreta(s) generada(s).`, 'ok');
        this.cargar();
      },
      error: () => this.mostrarToast('No se pudieron generar las libretas.', 'err'),
    });
  }

  guardarCambios() {
    const l = this.libretaActual();
    if (!l) return;
    this.libretasService
      .update(l.alumnoId, {
        ...this.filtros(),
        observaciones: l.observaciones,
        firmaDirectorFirmado: l.firmaDirector.firmado,
        firmaDirectorFecha: l.firmaDirector.fechaFirma,
        firmaTutorNombre: l.firmaTutor.nombre,
        firmaTutorCargo: l.firmaTutor.cargo,
        firmaTutorFirmado: l.firmaTutor.firmado,
        firmaTutorFecha: l.firmaTutor.fechaFirma,
        estado: l.estado,
      })
      .subscribe({
        next: (updated) => {
          this.patchLocal(l.alumnoId, () => updated);
          this.resumen.set(this.calcResumen());
          this.editandoFirmas.set(false);
          this.mostrarToast('Cambios guardados correctamente.', 'ok');
        },
        error: () => this.mostrarToast('Error al guardar cambios.', 'err'),
      });
  }

  descargarPdfActual() {
    const l = this.libretaActual();
    if (!l) return;
    this.libretasService.downloadPdfOne(l.alumnoId, this.filtros()).subscribe({
      next: () => this.mostrarToast('PDF descargado.', 'ok'),
      error: () => this.mostrarToast('No se pudo generar el PDF.', 'err'),
    });
  }

  descargarPdfSalon() {
    this.libretasService.downloadPdfSalon(this.filtros()).subscribe({
      next: () => this.mostrarToast('PDF del salón descargado.', 'ok'),
      error: () => this.mostrarToast('No se pudo generar el PDF del salón.', 'err'),
    });
  }

  mostrarToast(msg: string, tipo: 'ok' | 'err') {
    this.toast.set({ msg, tipo });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
