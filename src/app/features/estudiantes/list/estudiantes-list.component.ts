import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, TitleCasePipe } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import {
  Documento,
  Estudiante,
  ExpedientesService,
  estudianteVacio,
} from '../services/expedientes.service';

interface DocRequerido { tipo: string; obligatorio: boolean; }

// ─── Catálogo de documentos requeridos por grado ──────────────────────────
const CATALOGO_DEFAULT: Record<string, DocRequerido[]> = {
  '1° Primaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Partida de Nacimiento',      obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
    { tipo:'Carnet de Vacunas',          obligatorio:false },
  ],
  '2° Primaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'Certificado de Estudios',    obligatorio:true  },
    { tipo:'Libreta de Notas',           obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
  ],
  '3° Primaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'Certificado de Estudios',    obligatorio:true  },
    { tipo:'Libreta de Notas',           obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
  ],
  '4° Primaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'Certificado de Estudios',    obligatorio:true  },
    { tipo:'Libreta de Notas',           obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
  ],
  '5° Primaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'Certificado de Estudios',    obligatorio:true  },
    { tipo:'Libreta de Notas',           obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
  ],
  '6° Primaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'Certificado de Estudios',    obligatorio:true  },
    { tipo:'Libreta de Notas',           obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
  ],
  '1° Secundaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'Certificado de Estudios',    obligatorio:true  },
    { tipo:'Libreta de Notas',           obligatorio:true  },
    { tipo:'Partida de Nacimiento',      obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Datos Familiares',  obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
  ],
  '2° Secundaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'Certificado de Estudios',    obligatorio:true  },
    { tipo:'Libreta de Notas',           obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Datos Familiares',  obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
  ],
  '3° Secundaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'Certificado de Estudios',    obligatorio:true  },
    { tipo:'Libreta de Notas',           obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Datos Familiares',  obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
  ],
  '4° Secundaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'Certificado de Estudios',    obligatorio:true  },
    { tipo:'Libreta de Notas',           obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Datos Familiares',  obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
  ],
  '5° Secundaria': [
    { tipo:'DNI del alumno',             obligatorio:true  },
    { tipo:'Ficha de Matrícula (FUT)',   obligatorio:true  },
    { tipo:'Certificado de Estudios',    obligatorio:true  },
    { tipo:'Libreta de Notas',           obligatorio:true  },
    { tipo:'DNI del padre o madre',      obligatorio:true  },
    { tipo:'Foto del alumno (2 und.)',   obligatorio:true  },
    { tipo:'Ficha de Datos Familiares',  obligatorio:true  },
    { tipo:'Ficha de Salud',             obligatorio:false },
  ],
};

@Component({
  selector: 'app-estudiantes-list',
  standalone: true,
  imports: [FormsModule, NgClass, TitleCasePipe],
  template: `
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Gestion de Estudiantes</h2>
          <p class="text-sm text-gray-500 mt-0.5">{{ totalFiltrados() }} estudiante(s) · pagina {{ paginaActual() }} de {{ totalPaginas() }}</p>
          @if (loading()) {
            <p class="text-xs text-indigo-500 mt-1">Cargando expedientes...</p>
          }
          @if (loadError()) {
            <p class="text-xs text-red-500 mt-1">{{ loadError() }}</p>
          }
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" (click)="exportarCsv()" [disabled]="loading() || exportando()">
            <span class="icon icon-sm">download</span> {{ exportando() ? 'Exportando…' : 'Exportar' }}
          </button>
          <button class="btn btn-primary" (click)="abrirDrawerNuevo()">
            <span class="icon icon-sm">person_add</span> Nuevo Estudiante
          </button>
        </div>
      </div>

      <!-- Stats rápidas -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="card p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span class="icon text-indigo-600">groups</span>
            </div>
            <div>
              <div class="text-xl font-bold text-gray-900">{{ totalEstudiantes() }}</div>
              <div class="text-xs text-gray-400">Total</div>
            </div>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <span class="icon text-green-600">check_circle</span>
            </div>
            <div>
              <div class="text-xl font-bold text-gray-900">{{ estudiantesActivos() }}</div>
              <div class="text-xs text-gray-400">Activos</div>
            </div>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
              <span class="icon text-pink-600">girl</span>
            </div>
            <div>
              <div class="text-xl font-bold text-gray-900">{{ estudiantesMujeres() }}</div>
              <div class="text-xs text-gray-400">Mujeres</div>
            </div>
          </div>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <span class="icon text-blue-600">boy</span>
            </div>
            <div>
              <div class="text-xl font-bold text-gray-900">{{ estudiantesVarones() }}</div>
              <div class="text-xs text-gray-400">Varones</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="relative lg:col-span-2">
            <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">search</span>
            <input class="form-input pl-10 bg-gray-50" type="text" placeholder="Buscar por nombre, DNI o codigo..."
              [(ngModel)]="filtro.q" (ngModelChange)="paginaActual.set(1)">
          </div>
          <div class="relative">
            <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">school</span>
            <select class="form-select pl-10 bg-gray-50" [(ngModel)]="filtro.grado" (ngModelChange)="paginaActual.set(1)">
              <option value="">Todos los grados</option>
              @for (g of grados; track g) { <option [value]="g">{{ g }}</option> }
            </select>
          </div>
          <div class="relative">
            <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">toggle_on</span>
            <select class="form-select pl-10 bg-gray-50" [(ngModel)]="filtro.estado" (ngModelChange)="paginaActual.set(1)">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="retirado">Retirado</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card overflow-hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th class="text-left">Estudiante</th>
              <th class="text-left hidden md:table-cell">DNI</th>
              <th class="text-left hidden sm:table-cell">Grado</th>
              <th class="text-center">Estado</th>
              <th class="text-left hidden lg:table-cell">Asistencia</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (e of paginados(); track e.id) {
              <tr class="hover:bg-gray-50">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      [ngClass]="e.sexo === 'F' ? 'bg-pink-500' : 'bg-indigo-500'">
                      {{ iniciales(e.nombres, e.apellidos) }}
                    </div>
                    <div>
                      <div class="font-medium text-gray-900 text-sm">{{ e.apellidos }}, {{ e.nombres }}</div>
                      <div class="text-xs text-gray-400">{{ e.codigo }}</div>
                    </div>
                  </div>
                </td>
                <td class="hidden md:table-cell text-sm text-gray-600">{{ e.dni }}</td>
                <td class="hidden sm:table-cell text-sm text-gray-600">{{ e.grado }} – {{ e.seccion }}</td>
                <td class="text-center">
                  <span class="badge text-xs"
                    [ngClass]="e.estado === 'activo' ? 'badge-green' : e.estado === 'retirado' ? 'badge-red' : 'badge-gray'">
                    {{ e.estado }}
                  </span>
                </td>
                <td class="hidden lg:table-cell">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 progress h-1.5">
                      <div class="progress-bar h-1.5"
                        [ngClass]="e.asistenciaPct >= 90 ? 'bg-green-500' : e.asistenciaPct >= 75 ? 'bg-yellow-400' : 'bg-red-400'"
                        [style.width]="e.asistenciaPct + '%'"></div>
                    </div>
                    <span class="text-xs text-gray-500 w-8 text-right">{{ e.asistenciaPct }}%</span>
                  </div>
                </td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button class="btn-icon text-blue-500" title="Ver expediente" (click)="abrirExpediente(e)">
                      <span class="icon icon-sm">folder_open</span>
                    </button>
                    <button class="btn-icon text-indigo-500" title="Editar" (click)="abrirDrawerEditar(e)">
                      <span class="icon icon-sm">edit</span>
                    </button>
                    <button class="btn-icon text-red-400" title="Eliminar" (click)="eliminar(e.id)">
                      <span class="icon icon-sm">delete_outline</span>
                    </button>
                  </div>
                </td>
              </tr>
                  } @empty {
              <tr><td colspan="6" class="py-16 text-center">
                <div class="flex flex-col items-center gap-2 text-gray-300">
                  <span class="icon icon-2xl">search_off</span>
                  <p class="text-sm text-gray-400">Sin resultados para los filtros aplicados</p>
                  <button class="btn btn-ghost text-xs" (click)="filtro.q=''; filtro.grado=''; filtro.estado=''">Limpiar filtros</button>
                </div>
              </td></tr>
            }
          </tbody>
        </table>
        <!-- Paginado -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <span class="text-xs text-gray-500">{{ inicio() + 1 }}–{{ fin() }} de {{ totalFiltrados() }}</span>
          <div class="flex items-center gap-1">
            <button class="btn-icon" [disabled]="paginaActual() === 1" (click)="paginaActual.update(p => p-1)">
              <span class="icon icon-sm">chevron_left</span>
            </button>
            @for (p of paginas(); track p) {
              <button class="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                [ngClass]="p === paginaActual() ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                (click)="paginaActual.set(p)">{{ p }}</button>
            }
            <button class="btn-icon" [disabled]="paginaActual() === totalPaginas()" (click)="paginaActual.update(p => p+1)">
              <span class="icon icon-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════ DRAWER: NUEVO / EDITAR ══════════════════════ -->
    @if (drawerForm()) {
      <div class="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm" (click)="cerrarDrawerForm()"></div>
      <div class="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-40 flex flex-col animate-slide-in-r">
        <div class="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-gradient-to-r from-indigo-600 to-indigo-500">
          <div>
            <h3 class="font-semibold text-white">{{ form.id ? 'Editar Estudiante' : 'Nuevo Estudiante' }}</h3>
            <p class="text-xs text-indigo-200">{{ form.id ? form.codigo : 'Completa todos los datos' }}</p>
          </div>
          <button class="btn-icon text-white hover:bg-white/20" (click)="cerrarDrawerForm()"><span class="icon">close</span></button>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          <!-- Datos personales -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos Personales</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label class="form-label">Nombres *</label>
                <input class="form-input" [(ngModel)]="form.nombres" placeholder="Nombres completos">
              </div>
              <div class="form-group">
                <label class="form-label">Apellidos *</label>
                <input class="form-input" [(ngModel)]="form.apellidos" placeholder="Apellidos">
              </div>
              <div class="form-group">
                <label class="form-label">DNI *</label>
                <input class="form-input" [(ngModel)]="form.dni" placeholder="12345678" maxlength="8">
              </div>
              <div class="form-group">
                <label class="form-label">Fecha de Nacimiento *</label>
                <input class="form-input" type="date" [(ngModel)]="form.fechaNac">
              </div>
              <div class="form-group">
                <label class="form-label">Sexo</label>
                <select class="form-select" [(ngModel)]="form.sexo">
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Grupo Sanguineo</label>
                <select class="form-select" [(ngModel)]="form.grupoSanguineo">
                  @for (gs of gruposSanguineos; track gs) { <option [value]="gs">{{ gs }}</option> }
                </select>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Direccion</label>
                <input class="form-input" [(ngModel)]="form.direccion" placeholder="Av. / Jr. / Calle, numero">
              </div>
            </div>
          </div>

          <!-- Academico -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos Academicos</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label class="form-label">Grado *</label>
                <select class="form-select" [(ngModel)]="form.grado">
                  @for (g of grados; track g) { <option [value]="g">{{ g }}</option> }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Seccion</label>
                <select class="form-select" [(ngModel)]="form.seccion">
                  <option value="A">A</option><option value="B">B</option>
                  <option value="C">C</option><option value="D">D</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Ano de Ingreso</label>
                <select class="form-select" [(ngModel)]="form.anioIngreso">
                  @for (a of anios; track a) { <option [value]="a">{{ a }}</option> }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Estado</label>
                <select class="form-select" [(ngModel)]="form.estado">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="retirado">Retirado</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Salud -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Salud</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label class="form-label">Alergias</label>
                <input class="form-input" [(ngModel)]="form.alergias" placeholder="Ej: Penicilina, Polen...">
              </div>
              <div class="form-group">
                <label class="form-label">Condiciones de Salud</label>
                <input class="form-input" [(ngModel)]="form.condicionesSalud" placeholder="Ej: Asma, Diabetes...">
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Observaciones</label>
                <textarea class="form-textarea" rows="2" [(ngModel)]="form.observaciones" placeholder="Observaciones importantes..."></textarea>
              </div>
            </div>
          </div>

          <!-- Padre -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos del Padre</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group"><label class="form-label">Nombres</label><input class="form-input" [(ngModel)]="form.padre.nombres"></div>
              <div class="form-group"><label class="form-label">Apellidos</label><input class="form-input" [(ngModel)]="form.padre.apellidos"></div>
              <div class="form-group"><label class="form-label">DNI</label><input class="form-input" [(ngModel)]="form.padre.dni" maxlength="8"></div>
              <div class="form-group"><label class="form-label">Telefono</label><input class="form-input" [(ngModel)]="form.padre.telefono"></div>
              <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" [(ngModel)]="form.padre.email"></div>
              <div class="form-group"><label class="form-label">Trabajo / Ocupacion</label><input class="form-input" [(ngModel)]="form.padre.trabajo"></div>
            </div>
          </div>

          <!-- Madre -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos de la Madre</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group"><label class="form-label">Nombres</label><input class="form-input" [(ngModel)]="form.madre.nombres"></div>
              <div class="form-group"><label class="form-label">Apellidos</label><input class="form-input" [(ngModel)]="form.madre.apellidos"></div>
              <div class="form-group"><label class="form-label">DNI</label><input class="form-input" [(ngModel)]="form.madre.dni" maxlength="8"></div>
              <div class="form-group"><label class="form-label">Telefono</label><input class="form-input" [(ngModel)]="form.madre.telefono"></div>
              <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" [(ngModel)]="form.madre.email"></div>
              <div class="form-group"><label class="form-label">Trabajo / Ocupacion</label><input class="form-input" [(ngModel)]="form.madre.trabajo"></div>
            </div>
          </div>

          <!-- Apoderado -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Apoderado (si aplica)</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group"><label class="form-label">Nombres</label><input class="form-input" [(ngModel)]="form.apoderado.nombres"></div>
              <div class="form-group"><label class="form-label">Apellidos</label><input class="form-input" [(ngModel)]="form.apoderado.apellidos"></div>
              <div class="form-group"><label class="form-label">DNI</label><input class="form-input" [(ngModel)]="form.apoderado.dni" maxlength="8"></div>
              <div class="form-group"><label class="form-label">Telefono</label><input class="form-input" [(ngModel)]="form.apoderado.telefono"></div>
              <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" [(ngModel)]="form.apoderado.email"></div>
              <div class="form-group"><label class="form-label">Relacion con el alumno</label><input class="form-input" [(ngModel)]="form.apoderado.trabajo" placeholder="Ej: Tio, Abuelo..."></div>
            </div>
          </div>

          @if (errorForm) {
            <div class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <span class="icon icon-sm text-red-500">error_outline</span> {{ errorForm }}
            </div>
          }
        </div>
        <div class="flex gap-2 px-6 py-4 border-t bg-gray-50 shrink-0">
          <button class="btn btn-primary flex-1" (click)="guardarForm()">
            <span class="icon">{{ form.id ? 'save' : 'person_add' }}</span>
            {{ form.id ? 'Guardar cambios' : 'Registrar estudiante' }}
          </button>
          <button class="btn btn-secondary" (click)="cerrarDrawerForm()">Cancelar</button>
        </div>
      </div>
    }

    <!-- ══════════════════════ MODAL: REQUISITOS POR GRADO ══════════════════════ -->
    @if (modalRequisitos()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="modalRequisitos.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
          <!-- header -->
          <div class="flex items-center justify-between px-6 py-4 border-b shrink-0">
            <div>
              <h3 class="font-semibold text-gray-900">Documentos Requeridos por Grado</h3>
              <p class="text-xs text-gray-500">Define qué documentos se solicitan en cada grado</p>
            </div>
            <button class="btn-icon" (click)="modalRequisitos.set(false)"><span class="icon">close</span></button>
          </div>
          <!-- body: dos paneles -->
          <div class="flex flex-1 overflow-hidden">
            <!-- Panel izquierdo: lista de grados -->
            <div class="w-52 shrink-0 border-r overflow-y-auto py-2">
              @for (g of grados; track g) {
                <button class="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between"
                  [ngClass]="gradoReqActivo() === g ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-500' : 'text-gray-700 hover:bg-gray-50'"
                  (click)="gradoReqActivo.set(g)">
                  <span>{{ g }}</span>
                  <span class="text-xs px-1.5 py-0.5 rounded-full"
                    [ngClass]="gradoReqActivo() === g ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'">
                    {{ docsDeGrado(g).length }}
                  </span>
                </button>
              }
            </div>
            <!-- Panel derecho: documentos del grado seleccionado -->
            <div class="flex-1 overflow-y-auto p-5 space-y-3">
              @if (gradoReqActivo()) {
                <div class="flex items-center justify-between mb-1">
                  <h4 class="font-semibold text-gray-800">{{ gradoReqActivo() }}</h4>
                  <span class="text-xs text-gray-500">{{ docsDeGrado(gradoReqActivo()).filter(d=>d.obligatorio).length }} obligatorios · {{ docsDeGrado(gradoReqActivo()).filter(d=>!d.obligatorio).length }} opcionales</span>
                </div>
                @for (dr of docsDeGrado(gradoReqActivo()); track dr.tipo; let idx = $index) {
                  <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                    <span class="icon text-gray-400">{{ docIcono(dr.tipo) }}</span>
                    <span class="flex-1 text-sm text-gray-800">{{ dr.tipo }}</span>
                    <!-- obligatorio toggle -->
                    <label class="flex items-center gap-1.5 cursor-pointer select-none">
                      <div class="relative w-9 h-5">
                        <input type="checkbox" class="sr-only peer" [checked]="dr.obligatorio"
                          (change)="toggleObligatorio(gradoReqActivo(), idx)">
                        <div class="w-9 h-5 rounded-full transition-colors peer-checked:bg-indigo-500 bg-gray-300"></div>
                        <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
                      </div>
                      <span class="text-xs" [ngClass]="dr.obligatorio ? 'text-indigo-600 font-medium' : 'text-gray-400'">
                        {{ dr.obligatorio ? 'Obligatorio' : 'Opcional' }}
                      </span>
                    </label>
                    <button class="btn-icon text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      (click)="eliminarDocReq(gradoReqActivo(), idx)">
                      <span class="icon icon-sm">delete_outline</span>
                    </button>
                  </div>
                } @empty {
                  <div class="text-center text-gray-400 py-8 text-sm">Sin documentos configurados</div>
                }
                <!-- Agregar nuevo tipo de documento requerido -->
                <div class="flex gap-2 pt-2">
                  <input class="form-input flex-1" [(ngModel)]="nuevoDocReqTipo"
                    placeholder="Ej: Ficha Psicológica" (keyup.enter)="agregarDocReq()">
                  <label class="flex items-center gap-1.5 cursor-pointer select-none px-2">
                    <input type="checkbox" class="accent-indigo-600" [(ngModel)]="nuevoDocReqObligatorio">
                    <span class="text-xs text-gray-600">Oblig.</span>
                  </label>
                  <button class="btn btn-primary btn-sm" (click)="agregarDocReq()">
                    <span class="icon icon-sm">add</span> Agregar
                  </button>
                </div>
              } @else {
                <div class="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <span class="icon icon-2xl">arrow_back</span>
                  <p class="text-sm">Selecciona un grado</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════ VISOR DE DOCUMENTO ══════════════════════ -->
    @if (docVisor()) {
      <div class="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4" (click)="cerrarVisor()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
          <!-- header visor -->
          <div class="flex items-center justify-between px-5 py-3 border-b shrink-0">
            <div>
              <div class="font-semibold text-gray-900 text-sm">{{ docVisor()!.tipo }}</div>
              <div class="text-xs text-gray-500">{{ docVisor()!.numero ? 'N: ' + docVisor()!.numero : 'Sin numero' }}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge text-xs" [ngClass]="docVisor()!.estado === 'entregado' ? 'badge-green' : docVisor()!.estado === 'vencido' ? 'badge-red' : 'badge-gray'">{{ docVisor()!.estado }}</span>
              <label class="btn btn-secondary btn-sm cursor-pointer" title="Reemplazar imagen">
                <span class="icon icon-sm">upload</span> Cambiar imagen
                <input type="file" accept="image/*" class="hidden" (change)="onArchivoVisor($event)">
              </label>
              <button class="btn-icon" (click)="cerrarVisor()"><span class="icon">close</span></button>
            </div>
          </div>
          <!-- cuerpo visor -->
          <div class="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
            <img [src]="docVisor()!.imagenUrl" alt="documento" class="max-w-full max-h-full rounded-lg shadow object-contain">
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════ DRAWER: EXPEDIENTE ══════════════════════ -->
    @if (drawerExp()) {
      <div class="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm" (click)="cerrarExpediente()"></div>
      <div class="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-40 flex flex-col animate-slide-in-r">

        <!-- Header expediente -->
        <div class="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-gradient-to-r from-slate-700 to-slate-600">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white/30"
              [ngClass]="expActivo()!.sexo === 'F' ? 'bg-pink-500' : 'bg-indigo-500'">
              {{ iniciales(expActivo()!.nombres, expActivo()!.apellidos) }}
            </div>
            <div>
              <div class="font-semibold text-white">{{ expActivo()!.apellidos }}, {{ expActivo()!.nombres }}</div>
              <div class="text-xs text-slate-300">{{ expActivo()!.codigo }} · {{ expActivo()!.grado }} {{ expActivo()!.seccion }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-sm bg-white/15 text-white border-white/20 hover:bg-white/25" (click)="abrirDrawerEditar(expActivo()!)">
              <span class="icon icon-sm">edit</span> Editar
            </button>
            <button class="btn-icon text-white hover:bg-white/20" (click)="cerrarExpediente()"><span class="icon">close</span></button>
          </div>
        </div>

        <!-- Tabs del expediente -->
        <div class="tabs px-6 pt-3 shrink-0 border-b border-gray-100">
          @for (tab of tabsExp; track tab.id) {
            <button class="tab" [class.active]="tabExp() === tab.id" (click)="tabExp.set(tab.id)">
              <span class="icon icon-sm">{{ tab.icon }}</span> {{ tab.label }}
            </button>
          }
        </div>

        <!-- Cuerpo expediente -->
        <div class="flex-1 overflow-y-auto px-6 py-5">

          <!-- TAB: Datos Personales -->
          @if (tabExp() === 'personal') {
            <div class="space-y-4 animate-fade-in">
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-xs text-gray-400 mb-0.5">DNI</div>
                  <div class="font-medium text-gray-800">{{ expActivo()!.dni }}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-xs text-gray-400 mb-0.5">Fecha de Nacimiento</div>
                  <div class="font-medium text-gray-800">{{ formatFecha(expActivo()!.fechaNac) }}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-xs text-gray-400 mb-0.5">Sexo</div>
                  <div class="font-medium text-gray-800">{{ expActivo()!.sexo === 'M' ? 'Masculino' : 'Femenino' }}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-xs text-gray-400 mb-0.5">Grupo Sanguineo</div>
                  <div class="font-medium text-gray-800">{{ expActivo()!.grupoSanguineo }}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3 col-span-2">
                  <div class="text-xs text-gray-400 mb-0.5">Direccion</div>
                  <div class="font-medium text-gray-800">{{ expActivo()!.direccion || '—' }}</div>
                </div>
              </div>

              <div class="border-t pt-4">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Salud</p>
                <div class="grid grid-cols-1 gap-3">
                  <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div class="text-xs text-amber-600 font-medium mb-0.5">Alergias</div>
                    <div class="text-sm text-gray-800">{{ expActivo()!.alergias || 'Ninguna' }}</div>
                  </div>
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div class="text-xs text-blue-600 font-medium mb-0.5">Condiciones de Salud</div>
                    <div class="text-sm text-gray-800">{{ expActivo()!.condicionesSalud || 'Sin condiciones registradas' }}</div>
                  </div>
                  @if (expActivo()!.observaciones) {
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div class="text-xs text-yellow-600 font-medium mb-0.5">Observaciones importantes</div>
                      <div class="text-sm text-gray-800">{{ expActivo()!.observaciones }}</div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- TAB: Representantes -->
          @if (tabExp() === 'representantes') {
            <div class="space-y-4 animate-fade-in">
              @for (rep of representantes(expActivo()!); track rep.tipo) {
                <div class="card p-4">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="icon text-indigo-500">{{ rep.tipo === 'Padre' ? 'man' : rep.tipo === 'Madre' ? 'woman' : 'supervisor_account' }}</span>
                    <span class="font-semibold text-gray-800">{{ rep.tipo }}</span>
                    @if (!rep.datos.nombres) { <span class="badge badge-gray text-xs">No registrado</span> }
                  </div>
                  @if (rep.datos.nombres) {
                    <div class="grid grid-cols-2 gap-2 text-sm">
                      <div><span class="text-gray-400 text-xs">Nombre</span><div class="font-medium">{{ rep.datos.nombres }} {{ rep.datos.apellidos }}</div></div>
                      <div><span class="text-gray-400 text-xs">DNI</span><div class="font-medium">{{ rep.datos.dni }}</div></div>
                      <div><span class="text-gray-400 text-xs">Telefono</span><div class="font-medium">{{ rep.datos.telefono }}</div></div>
                      <div><span class="text-gray-400 text-xs">Email</span><div class="font-medium text-xs">{{ rep.datos.email || '—' }}</div></div>
                      <div class="col-span-2"><span class="text-gray-400 text-xs">Trabajo / Ocupacion</span><div class="font-medium">{{ rep.datos.trabajo || '—' }}</div></div>
                    </div>
                  } @else {
                    <p class="text-sm text-gray-400 italic">Sin datos registrados</p>
                  }
                </div>
              }
            </div>
          }

          <!-- TAB: Historial -->
          @if (tabExp() === 'historial') {
            <div class="space-y-4 animate-fade-in">
              <!-- KPIs -->
              <div class="grid grid-cols-3 gap-3">
                <div class="card p-4 text-center">
                  <div class="text-2xl font-bold text-indigo-600">{{ expActivo()!.asistenciaPct }}%</div>
                  <div class="text-xs text-gray-500 mt-1">Asistencia</div>
                </div>
                <div class="card p-4 text-center">
                  <div class="text-2xl font-bold"
                    [ngClass]="expActivo()!.conductaNota === 'AD' ? 'text-green-600' : expActivo()!.conductaNota === 'A' ? 'text-blue-600' : expActivo()!.conductaNota === 'B' ? 'text-yellow-600' : 'text-red-600'">
                    {{ expActivo()!.conductaNota }}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">Conducta</div>
                </div>
                <div class="card p-4 text-center">
                  <div class="text-2xl font-bold text-gray-700">{{ expActivo()!.historialAcademico.length }}</div>
                  <div class="text-xs text-gray-500 mt-1">Anos registrados</div>
                </div>
              </div>
              <!-- Historial anual -->
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Historial Academico</p>
                @if (expActivo()!.historialAcademico.length === 0) {
                  <div class="text-sm text-gray-400 text-center py-6">Sin historial registrado</div>
                } @else {
                  <div class="overflow-hidden rounded-lg border border-gray-200">
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500">Ano</th>
                          <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500">Grado</th>
                          <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500">Seccion</th>
                          <th class="text-right px-4 py-2 text-xs font-semibold text-gray-500">Promedio</th>
                          <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (h of expActivo()!.historialAcademico; track h.anio) {
                          <tr class="border-t border-gray-100">
                            <td class="px-4 py-2 font-medium">{{ h.anio }}</td>
                            <td class="px-4 py-2 text-gray-600">{{ h.grado }}</td>
                            <td class="px-4 py-2 text-gray-600">{{ h.seccion }}</td>
                            <td class="px-4 py-2 text-right font-bold"
                              [ngClass]="h.promedio >= 14 ? 'text-green-600' : h.promedio >= 11 ? 'text-yellow-600' : 'text-red-600'">
                              {{ h.promedio }}
                            </td>
                            <td class="px-4 py-2">
                              <span class="badge badge-green text-xs">{{ h.estado }}</span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>
          }

          <!-- TAB: Documentos -->
          @if (tabExp() === 'documentos') {
            <div class="space-y-3 animate-fade-in">
              <!-- Cabecera -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Documentos del Expediente</p>
                  <span class="text-xs text-gray-500">{{ entregados() }} / {{ expActivo()!.documentos.length }} entregados</span>
                </div>
                <div class="flex gap-2">
                  <button class="btn btn-secondary btn-sm" (click)="abrirModalRequisitos()">
                    <span class="icon icon-sm">rule</span> Requisitos por grado
                  </button>
                  <button class="btn btn-primary btn-sm" (click)="abrirNuevoDoc()">
                    <span class="icon icon-sm">upload_file</span> Agregar
                  </button>
                </div>
              </div>

              <!-- Panel: Requisitos del grado del alumno -->
              @if (reqDelGrado().length > 0) {
                <div class="card overflow-hidden">
                  <button class="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    (click)="panelReqAbierto.update(v => !v)">
                    <div class="flex items-center gap-2">
                      <span class="icon icon-sm text-indigo-500">checklist</span>
                      <span class="text-sm font-semibold text-indigo-700">Requisitos para {{ expActivo()!.grado }}</span>
                      <span class="badge badge-indigo text-xs">{{ reqCumplidos() }}/{{ reqDelGrado().length }}</span>
                    </div>
                    <span class="icon icon-sm text-indigo-400">{{ panelReqAbierto() ? 'expand_less' : 'expand_more' }}</span>
                  </button>
                  @if (panelReqAbierto()) {
                    <div class="divide-y divide-gray-100">
                      @for (dr of reqDelGrado(); track dr.tipo) {
                        @let docAlumno = docDeAlumno(dr.tipo);
                        <div class="flex items-center gap-3 px-4 py-2.5">
                          <span class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs"
                            [ngClass]="docAlumno ? (docAlumno.estado === 'entregado' ? 'bg-green-100 text-green-600' : docAlumno.estado === 'vencido' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600') : 'bg-gray-100 text-gray-400'">
                            <span class="icon" style="font-size:14px">{{ docAlumno ? (docAlumno.estado === 'entregado' ? 'check' : docAlumno.estado === 'vencido' ? 'block' : 'schedule') : 'close' }}</span>
                          </span>
                          <span class="flex-1 text-sm text-gray-700">{{ dr.tipo }}</span>
                          @if (dr.obligatorio) {
                            <span class="text-[10px] text-red-500 font-medium">Obligatorio</span>
                          } @else {
                            <span class="text-[10px] text-gray-400">Opcional</span>
                          }
                          @if (docAlumno) {
                            <span class="badge text-xs"
                              [ngClass]="docAlumno.estado === 'entregado' ? 'badge-green' : docAlumno.estado === 'vencido' ? 'badge-red' : 'badge-yellow'">
                              {{ docAlumno.estado }}
                            </span>
                          } @else {
                            <button class="text-xs text-indigo-500 hover:text-indigo-700 underline" (click)="agregarDocDesdeReq(dr.tipo)">
                              Agregar
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              <!-- Formulario nuevo documento (inline) -->
              @if (docNuevoAbierto()) {
                <div class="card p-4 border-2 border-indigo-300 bg-indigo-50 space-y-3 animate-fade-in">
                  <p class="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Nuevo Documento</p>
                  <div class="grid grid-cols-2 gap-2">
                    <div class="form-group col-span-2">
                      <label class="form-label">Tipo de documento *</label>
                      <input class="form-input" [(ngModel)]="docNuevo.tipo" placeholder="Ej: Ficha de Salud">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Numero / Codigo</label>
                      <input class="form-input" [(ngModel)]="docNuevo.numero" placeholder="Opcional">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estado</label>
                      <select class="form-select" [(ngModel)]="docNuevo.estado">
                        <option value="pendiente">Pendiente</option>
                        <option value="entregado">Entregado</option>
                        <option value="vencido">Vencido</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Fecha entrega</label>
                      <input class="form-input" [(ngModel)]="docNuevo.fechaEntrega" placeholder="DD/MM/YYYY">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Imagen / Archivo</label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <span class="btn btn-secondary btn-sm">
                          <span class="icon icon-sm">attach_file</span>
                          {{ docNuevo.imagenUrl ? 'Cambiar' : 'Seleccionar' }}
                        </span>
                        <span class="text-xs text-gray-400 truncate">{{ docNuevo.imagenUrl ? 'Archivo cargado' : 'Sin archivo' }}</span>
                        <input #fileNuevo type="file" accept="image/*,application/pdf" class="hidden" (change)="onArchivoNuevoDoc($event)">
                      </label>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button class="btn btn-primary btn-sm" (click)="agregarDocumento()"><span class="icon icon-sm">save</span> Guardar</button>
                    <button class="btn btn-secondary btn-sm" (click)="docNuevoAbierto.set(false)">Cancelar</button>
                  </div>
                </div>
              }

              <!-- Lista de documentos -->
              @for (doc of expActivo()!.documentos; track doc.tipo) {
                @if (doc.imagenUrl) {
                  <!-- CON imagen: clic abre visor -->
                  <div class="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow group"
                    (click)="verDoc(doc)">
                    <div class="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-gray-200 relative">
                      <img [src]="doc.imagenUrl" alt="doc" class="w-full h-full object-cover">
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span class="icon text-white opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-gray-800 text-sm">{{ doc.tipo }}</div>
                      <div class="text-xs text-gray-500">{{ doc.numero ? 'N: ' + doc.numero : 'Sin numero' }}{{ doc.fechaEntrega ? ' · ' + doc.fechaEntrega : '' }}</div>
                      <div class="text-xs text-indigo-400 mt-0.5">Clic para ver o cambiar</div>
                    </div>
                    <span class="badge text-xs shrink-0"
                      [ngClass]="doc.estado === 'entregado' ? 'badge-green' : doc.estado === 'vencido' ? 'badge-red' : 'badge-gray'">
                      {{ doc.estado }}
                    </span>
                  </div>
                } @else {
                  <!-- SIN imagen: clic abre selector de archivo directamente -->
                  <label class="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-indigo-300 border-2 border-dashed border-gray-200 transition-all group">
                    <input type="file" accept="image/*" class="hidden" (change)="onArchivoDoc($event, doc)">
                    <div class="w-14 h-14 rounded-lg shrink-0 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center"
                      [ngClass]="doc.estado === 'entregado' ? 'bg-green-50 text-green-400' : doc.estado === 'vencido' ? 'bg-red-50 text-red-300' : 'bg-gray-50 text-gray-300 group-hover:text-indigo-400 group-hover:border-indigo-300'">
                      <span class="icon">{{ docIcono(doc.tipo) }}</span>
                      <span class="text-[9px] mt-0.5 group-hover:text-indigo-500 transition-colors">cargar</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-gray-800 text-sm">{{ doc.tipo }}</div>
                      <div class="text-xs text-gray-500">{{ doc.numero ? 'N: ' + doc.numero : 'Sin numero' }}{{ doc.fechaEntrega ? ' · ' + doc.fechaEntrega : '' }}</div>
                      <div class="text-xs text-gray-400 mt-0.5 group-hover:text-indigo-400 transition-colors">Sin imagen · clic para cargar</div>
                    </div>
                    <span class="badge text-xs shrink-0"
                      [ngClass]="doc.estado === 'entregado' ? 'badge-green' : doc.estado === 'vencido' ? 'badge-red' : 'badge-gray'">
                      {{ doc.estado }}
                    </span>
                  </label>
                }
              }

              <!-- Progreso -->
              <div class="card p-4">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Completitud del expediente</span>
                  <span class="font-semibold">{{ pctDocs() }}%</span>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-indigo-500 transition-all" [style.width]="pctDocs() + '%'"></div>
                </div>
              </div>
            </div>
          }

        </div>
      </div>
    }
  `
})
export class EstudiantesListComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  private readonly expedientesSvc = inject(ExpedientesService);
  readonly Math = Math;
  readonly POR_PAGINA = 10;
  readonly loading = this.expedientesSvc.loading;
  readonly loadError = this.expedientesSvc.error;
  readonly exportando = signal(false);

  drawerForm     = signal(false);
  drawerExp      = signal(false);
  tabExp         = signal('personal');
  paginaActual   = signal(1);
  errorForm      = '';
  docVisor        = signal<Documento | null>(null);
  docNuevoAbierto = signal(false);
  docNuevo: Documento = { tipo:'', numero:'', estado:'pendiente', fechaEntrega:'', imagenUrl:'' };

  // ── Catálogo requisitos ──
  modalRequisitos  = signal(false);
  gradoReqActivo   = signal('');
  panelReqAbierto  = signal(true);
  nuevoDocReqTipo  = '';
  nuevoDocReqObligatorio = true;
  private readonly _catalogo = signal<Record<string, DocRequerido[]>>(
    JSON.parse(JSON.stringify(CATALOGO_DEFAULT))
  );

  tabsExp = [
    { id:'personal',        label:'Personal',      icon:'person'         },
    { id:'representantes',  label:'Representantes',icon:'family_restroom' },
    { id:'historial',       label:'Historial',     icon:'timeline'       },
    { id:'documentos',      label:'Documentos',    icon:'folder'         },
  ];

  filtro = { q: '', grado: '', estado: '' };

  grados = ['1° Primaria','2° Primaria','3° Primaria','4° Primaria','5° Primaria','6° Primaria',
            '1° Secundaria','2° Secundaria','3° Secundaria','4° Secundaria','5° Secundaria'];
  gruposSanguineos = ['O+','O-','A+','A-','B+','B-','AB+','AB-'];
  anios = ['2024','2025','2026','2023','2022','2021','2020','2019','2018','2017'];

  private readonly _expActivo   = signal<Estudiante | null>(null);
  readonly expActivo = this._expActivo.asReadonly();

  form: Estudiante = estudianteVacio(0);

  // ── Computed ──
  readonly filtrados = computed(() => {
    const { q, grado, estado } = this.filtro;
    const query = q.toLowerCase();
    return this.expedientesSvc.estudiantes().filter(e => {
      const matchQ = !query || `${e.nombres} ${e.apellidos} ${e.dni} ${e.codigo}`.toLowerCase().includes(query);
      const matchG = !grado  || e.grado === grado;
      const matchE = !estado || e.estado === estado;
      return matchQ && matchG && matchE;
    });
  });
  readonly totalFiltrados = computed(() => this.filtrados().length);
  readonly totalPaginas   = computed(() => Math.max(1, Math.ceil(this.totalFiltrados() / this.POR_PAGINA)));
  readonly inicio         = computed(() => (this.paginaActual() - 1) * this.POR_PAGINA);
  readonly fin            = computed(() => Math.min(this.inicio() + this.POR_PAGINA, this.totalFiltrados()));
  readonly paginados      = computed(() => this.filtrados().slice(this.inicio(), this.fin()));
  readonly paginas        = computed(() => {
    const total = this.totalPaginas(); const actual = this.paginaActual();
    const ini = Math.max(1, actual - 2); const fin = Math.min(total, actual + 2);
    return Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
  });
  readonly totalEstudiantes  = computed(() => this.expedientesSvc.estudiantes().length);
  readonly estudiantesActivos = computed(() => this.expedientesSvc.estudiantes().filter(e => e.estado === 'activo').length);
  readonly estudiantesMujeres = computed(() => this.expedientesSvc.estudiantes().filter(e => e.sexo === 'F').length);
  readonly estudiantesVarones = computed(() => this.expedientesSvc.estudiantes().filter(e => e.sexo === 'M').length);

  ngOnInit(): void {
    this.layout.setTitle('Gestion de Estudiantes');
    this.expedientesSvc.load();
  }

  exportarCsv(): void {
    this.exportando.set(true);
    this.expedientesSvc.exportCsv({
      q: this.filtro.q,
      grado: this.filtro.grado,
      estado: this.filtro.estado,
    }).subscribe({
      next: (blob) => {
        const stamp = new Date().toISOString().slice(0, 10);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `padron-estudiantes-${stamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportando.set(false);
      },
      error: () => {
        this.exportando.set(false);
        alert('No se pudo exportar el padrón. Verifique permisos y conexión con el servidor.');
      },
    });
  }

  iniciales(n: string, a: string) { return ((n?.[0] ?? '') + (a?.[0] ?? '')).toUpperCase(); }
  formatFecha(f: string) {
    if (!f) return '—';
    const [y, m, d] = f.split('-');
    return `${d}/${m}/${y}`;
  }
  representantes(e: Estudiante) {
    return [{ tipo:'Padre', datos:e.padre }, { tipo:'Madre', datos:e.madre }, { tipo:'Apoderado', datos:e.apoderado }];
  }

  abrirDrawerNuevo(): void {
    this.form = estudianteVacio(0);
    this.errorForm = '';
    this.drawerForm.set(true);
  }

  abrirDrawerEditar(e: Estudiante): void {
    this.form = JSON.parse(JSON.stringify(e)); // deep copy
    this.errorForm = '';
    this.drawerForm.set(true);
    this.drawerExp.set(false);
  }

  cerrarDrawerForm(): void { this.drawerForm.set(false); }

  guardarForm(): void {
    if (!this.form.nombres.trim() || !this.form.apellidos.trim()) {
      this.errorForm = 'Nombres y apellidos son obligatorios.'; return;
    }
    if (this.form.dni.length < 8) {
      this.errorForm = 'El DNI debe tener 8 digitos.'; return;
    }
    if (!this.form.grado) {
      this.errorForm = 'Selecciona el grado.'; return;
    }
    if (!this.form.email) {
      this.form.email = `${this.form.dni}@estudiante.pe`;
    }

    const isNew = !this.form.id;
    const req = isNew
      ? this.expedientesSvc.create(this.form)
      : this.expedientesSvc.update(this.form);

    req.subscribe({
      next: () => {
        this.drawerForm.set(false);
        this.errorForm = '';
      },
      error: () => {
        this.errorForm = 'No se pudo guardar el expediente.';
      },
    });
  }

  eliminar(id: number): void {
    this.expedientesSvc.remove(id).subscribe({
      error: () => { this.errorForm = 'No se pudo eliminar el estudiante.'; },
    });
  }

  // ── Computed docs ──
  readonly entregados = computed(() => this.expActivo()?.documentos.filter(d => d.estado === 'entregado').length ?? 0);
  readonly pctDocs    = computed(() => {
    const docs = this.expActivo()?.documentos;
    if (!docs?.length) return 0;
    return Math.round(docs.filter(d => d.estado === 'entregado').length / docs.length * 100);
  });
  readonly reqDelGrado = computed(() => this._catalogo()[this.expActivo()?.grado ?? ''] ?? []);
  readonly reqCumplidos = computed(() => {
    const docs = this.expActivo()?.documentos ?? [];
    return this.reqDelGrado().filter(r => docs.some(d => d.tipo === r.tipo && d.estado === 'entregado')).length;
  });

  docIcono(tipo: string): string {
    if (tipo.includes('DNI'))          return 'badge';
    if (tipo.includes('Partida'))      return 'article';
    if (tipo.includes('Contrato'))     return 'handshake';
    if (tipo.includes('Cert'))         return 'workspace_premium';
    if (tipo.includes('Libreta') || tipo.includes('Notas')) return 'menu_book';
    if (tipo.includes('Salud') || tipo.includes('Vacuna'))  return 'health_and_safety';
    if (tipo.includes('Matrícula') || tipo.includes('FUT')) return 'how_to_reg';
    if (tipo.includes('Foto'))         return 'photo_camera';
    if (tipo.includes('Famil') || tipo.includes('Datos'))   return 'family_restroom';
    return 'description';
  }

  docDeAlumno(tipo: string): Documento | undefined {
    return this.expActivo()?.documentos.find(d => d.tipo === tipo);
  }

  // ── Catálogo requisitos ──
  docsDeGrado(grado: string): DocRequerido[] { return this._catalogo()[grado] ?? []; }

  abrirModalRequisitos(): void {
    this.gradoReqActivo.set(this.expActivo()?.grado ?? this.grados[0]);
    this.modalRequisitos.set(true);
  }

  toggleObligatorio(grado: string, idx: number): void {
    this._catalogo.update(cat => {
      const lista = [...(cat[grado] ?? [])];
      lista[idx] = { ...lista[idx], obligatorio: !lista[idx].obligatorio };
      return { ...cat, [grado]: lista };
    });
  }

  eliminarDocReq(grado: string, idx: number): void {
    this._catalogo.update(cat => {
      const lista = [...(cat[grado] ?? [])];
      lista.splice(idx, 1);
      return { ...cat, [grado]: lista };
    });
  }

  agregarDocReq(): void {
    const tipo = this.nuevoDocReqTipo.trim();
    if (!tipo || !this.gradoReqActivo()) return;
    const grado = this.gradoReqActivo();
    this._catalogo.update(cat => ({
      ...cat,
      [grado]: [...(cat[grado] ?? []), { tipo, obligatorio: this.nuevoDocReqObligatorio }],
    }));
    this.nuevoDocReqTipo = '';
    this.nuevoDocReqObligatorio = true;
  }

  agregarDocDesdeReq(tipo: string): void {
    const exp = this.expActivo();
    if (!exp) return;
    this.expedientesSvc.addDocument(exp.id, { tipo, estado: 'pendiente' }).subscribe({
      next: () => this._syncExpActivo(exp.id),
    });
  }

  verDoc(doc: Documento): void { this.docVisor.set(doc); }
  cerrarVisor(): void { this.docVisor.set(null); }

  private _leerArchivo(file: File, cb: (url: string) => void): void {
    const reader = new FileReader();
    reader.onload = e => cb(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onArchivoDoc(event: Event, doc: Documento): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this._leerArchivo(file, url => {
      doc.imagenUrl = url;
      this._actualizarDoc(doc);
    });
  }

  onArchivoVisor(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.docVisor()) return;
    this._leerArchivo(file, url => {
      const doc = this.docVisor()!;
      doc.imagenUrl = url;
      this.docVisor.set({ ...doc });
      this._actualizarDoc(doc);
    });
  }

  private _actualizarDoc(doc: Documento): void {
    const exp = this.expActivo();
    if (!exp) return;
    const payload = {
      tipo: doc.tipo,
      numero: doc.numero,
      estado: doc.estado,
      fechaEntrega: doc.fechaEntrega,
      imagenUrl: doc.imagenUrl,
    };
    const req = doc.id
      ? this.expedientesSvc.updateDocument(exp.id, doc.id, payload)
      : this.expedientesSvc.addDocument(exp.id, payload);
    req.subscribe({ next: () => this._syncExpActivo(exp.id) });
  }

  abrirNuevoDoc(): void {
    this.docNuevo = { tipo:'', numero:'', estado:'pendiente', fechaEntrega:'', imagenUrl:'' };
    this.docNuevoAbierto.set(true);
  }

  onArchivoNuevoDoc(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this._leerArchivo(file, url => { this.docNuevo = { ...this.docNuevo, imagenUrl: url }; });
  }

  agregarDocumento(): void {
    if (!this.docNuevo.tipo.trim()) return;
    const exp = this.expActivo();
    if (!exp) return;
    this.expedientesSvc.addDocument(exp.id, {
      tipo: this.docNuevo.tipo,
      numero: this.docNuevo.numero,
      estado: this.docNuevo.estado,
      fechaEntrega: this.docNuevo.fechaEntrega,
      imagenUrl: this.docNuevo.imagenUrl,
    }).subscribe({
      next: () => {
        this.docNuevoAbierto.set(false);
        this._syncExpActivo(exp.id);
      },
    });
  }

  abrirExpediente(e: Estudiante): void {
    this.expedientesSvc.refreshOne(e.id).subscribe({
      next: () => this._syncExpActivo(e.id, true),
    });
  }

  private _syncExpActivo(id: number, openDrawer = false): void {
    const fresh = this.expedientesSvc.estudiantes().find((s) => s.id === id);
    if (!fresh) return;
    this._expActivo.set({ ...fresh });
    if (openDrawer) {
      this.tabExp.set('personal');
      this.drawerExp.set(true);
    }
  }
  cerrarExpediente(): void { this.drawerExp.set(false); }
}
