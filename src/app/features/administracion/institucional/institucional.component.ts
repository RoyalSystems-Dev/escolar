import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { forkJoin } from 'rxjs';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { InstitucionalService } from './institucional.service';
import { Nivel, Periodo, Sede, ConfigSistema, ModuloSistema, InstitucionData, Grado } from './institucional.model';

@Component({
  selector: 'app-institucional',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="space-y-5">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold text-gray-800">Configuracion Institucional</h2>
          <p class="text-sm text-gray-500">Administra los datos del colegio, sedes y estructura academica</p>
        </div>
        <div class="flex flex-wrap gap-2">
          @if (!modoEdicion()) {
            <button class="btn btn-primary" (click)="activarEdicion()" [disabled]="svc.loading()">
              <span class="icon">edit</span> Editar
            </button>
          } @else {
            <button class="btn btn-secondary" (click)="cancelarEdicion()" [disabled]="svc.saving()">
              <span class="icon">close</span> Cancelar
            </button>
            <button class="btn btn-primary" (click)="guardar()" [disabled]="svc.saving() || svc.loading()">
              <span class="icon">save</span> {{ svc.saving() ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          }
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        @for (tab of tabs; track tab.id) {
          <button class="tab" [class.active]="tabActivo() === tab.id" (click)="tabActivo.set(tab.id)">
            <span class="icon icon-sm">{{ tab.icon }}</span> {{ tab.label }}
          </button>
        }
      </div>

      <!-- TAB: DATOS GENERALES -->
      @if (tabActivo() === 'general') {
        <fieldset [disabled]="!modoEdicion()" class="space-y-4 animate-fade-in border-0 p-0 m-0 min-w-0">
          <div class="card p-6">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="icon text-indigo-500">domain</span> Identidad de la Institucion
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="form-group lg:col-span-2">
                <label class="form-label">Nombre completo *</label>
                <input class="form-input" type="text" [(ngModel)]="inst.nombre" placeholder="Ej: Institucion Educativa Privada San Martin">
              </div>
              <div class="form-group">
                <label class="form-label">Siglas / Nombre corto</label>
                <input class="form-input" type="text" [(ngModel)]="inst.siglas" placeholder="Ej: IEP SMP">
              </div>
              <div class="form-group">
                <label class="form-label">RUC *</label>
                <input class="form-input" type="text" [(ngModel)]="inst.ruc" placeholder="20512345678" maxlength="11">
              </div>
              <div class="form-group">
                <label class="form-label">Codigo Modular (MINEDU)</label>
                <input class="form-input" type="text" [(ngModel)]="inst.codigoModular" placeholder="Ej: 0654321">
              </div>
              <div class="form-group">
                <label class="form-label">Tipo de Gestion</label>
                <select class="form-select" [(ngModel)]="inst.tipoGestion">
                  <option value="privada">Privada</option>
                  <option value="publica">Publica</option>
                  <option value="parroquial">Parroquial</option>
                  <option value="convenio">Convenio</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">UGEL</label>
                <input class="form-input" type="text" [(ngModel)]="inst.ugel" placeholder="Ej: UGEL 01">
              </div>
              <div class="form-group">
                <label class="form-label">DRE</label>
                <input class="form-input" type="text" [(ngModel)]="inst.dre" placeholder="Ej: DRELM">
              </div>
              <div class="form-group">
                <label class="form-label">Resolucion de Creacion</label>
                <input class="form-input" type="text" [(ngModel)]="inst.resolucion" placeholder="Ej: RD N 1234-2005">
              </div>
            </div>
          </div>

          <div class="card p-6">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="icon text-indigo-500">location_on</span> Ubicacion y Contacto
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="form-group lg:col-span-3">
                <label class="form-label">Direccion *</label>
                <input class="form-input" type="text" [(ngModel)]="inst.direccion" placeholder="Av. / Jr. / Calle, numero, urbanizacion">
              </div>
              <div class="form-group">
                <label class="form-label">Distrito</label>
                <input class="form-input" type="text" [(ngModel)]="inst.distrito" placeholder="Ej: San Juan de Miraflores">
              </div>
              <div class="form-group">
                <label class="form-label">Provincia</label>
                <input class="form-input" type="text" [(ngModel)]="inst.provincia" placeholder="Ej: Lima">
              </div>
              <div class="form-group">
                <label class="form-label">Region / Departamento</label>
                <input class="form-input" type="text" [(ngModel)]="inst.region" placeholder="Ej: Lima">
              </div>
              <div class="form-group">
                <label class="form-label">Codigo Postal</label>
                <input class="form-input" type="text" [(ngModel)]="inst.codigoPostal" placeholder="Ej: 15800">
              </div>
              <div class="form-group">
                <label class="form-label">Telefono Principal *</label>
                <input class="form-input" type="tel" [(ngModel)]="inst.telefono" placeholder="Ej: 01-5551234">
              </div>
              <div class="form-group">
                <label class="form-label">Telefono Secundario</label>
                <input class="form-input" type="tel" [(ngModel)]="inst.telefono2" placeholder="Ej: 987654321">
              </div>
              <div class="form-group">
                <label class="form-label">Correo Institucional *</label>
                <input class="form-input" type="email" [(ngModel)]="inst.email" placeholder="info@colegio.edu.pe">
              </div>
              <div class="form-group">
                <label class="form-label">Pagina Web</label>
                <input class="form-input" type="url" [(ngModel)]="inst.web" placeholder="https://www.colegio.edu.pe">
              </div>
              <div class="form-group">
                <label class="form-label">Facebook</label>
                <input class="form-input" type="text" [(ngModel)]="inst.facebook" placeholder="facebook.com/colegio">
              </div>
            </div>
          </div>

          <div class="card p-6">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="icon text-indigo-500">manage_accounts</span> Autoridades
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="form-group">
                <label class="form-label">Director(a) General</label>
                <input class="form-input" type="text" [(ngModel)]="inst.director" placeholder="Nombres y apellidos">
              </div>
              <div class="form-group">
                <label class="form-label">Subdirector(a)</label>
                <input class="form-input" type="text" [(ngModel)]="inst.subdirector" placeholder="Nombres y apellidos">
              </div>
              <div class="form-group">
                <label class="form-label">Administrador(a)</label>
                <input class="form-input" type="text" [(ngModel)]="inst.administrador" placeholder="Nombres y apellidos">
              </div>
            </div>
          </div>

          <div class="card p-6">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="icon text-indigo-500">calendar_today</span> Configuracion del Ano Escolar
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="form-group">
                <label class="form-label">Ano Escolar Activo *</label>
                <select class="form-select" [(ngModel)]="inst.anio">
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Sistema de Evaluacion</label>
                <select class="form-select" [(ngModel)]="inst.sistemaEval">
                  <option value="numerico">Numerico (0-20)</option>
                  <option value="literal">Literal (AD/A/B/C)</option>
                  <option value="mixto">Mixto</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Estructura de Periodos</label>
                <select class="form-select" [(ngModel)]="inst.tipoPeriodo">
                  <option value="bimestre">Bimestral (4 periodos)</option>
                  <option value="trimestre">Trimestral (3 periodos)</option>
                  <option value="semestre">Semestral (2 periodos)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Nota minima aprobatoria</label>
                <input class="form-input" type="number" [(ngModel)]="inst.notaMinima" min="1" max="20" placeholder="11">
              </div>
            </div>
          </div>
        </fieldset>
      }

      <!-- TAB: SEDES -->
      @if (tabActivo() === 'sedes') {
        <div class="space-y-4 animate-fade-in">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">{{ sedes().length }} sede(s) registrada(s)</p>
            <button class="btn btn-primary" (click)="abrirFormSede()">
              <span class="icon">add</span> Nueva Sede
            </button>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (sede of sedes(); track sede.id) {
              <div class="card p-5"
                [class.ring-2]="sedeSeleccionada()?.id === sede.id"
                [class.ring-indigo-400]="sedeSeleccionada()?.id === sede.id">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3 flex-1 min-w-0">
                    <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                      <span class="icon text-indigo-600">business</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-gray-900">{{ sede.nombre }}</div>
                      <div class="text-xs text-gray-400 font-mono">{{ sede.codigo }}</div>
                      <div class="text-sm text-gray-500 mt-0.5">{{ sede.direccion }}, {{ sede.distrito }}</div>
                      <div class="flex flex-wrap gap-1 mt-2">
                        @for (n of sede.niveles; track n) { <span class="badge badge-indigo">{{ n }}</span> }
                        @for (t of sede.turnos; track t)  { <span class="badge badge-gray">{{ t }}</span> }
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2 shrink-0">
                    <span class="badge" [ngClass]="sede.estado === 'activo' ? 'badge-green' : 'badge-red'">{{ sede.estado }}</span>
                    <div class="flex gap-1">
                      <button class="btn btn-ghost btn-sm text-indigo-600" (click)="editarSede(sede)" title="Editar">
                        <span class="icon icon-sm">edit</span> Editar
                      </button>
                      <button class="btn-icon text-red-400" (click)="eliminarSede(sede.id)"
                        title="Eliminar" [disabled]="sedes().length <= 1">
                        <span class="icon icon-sm">delete_outline</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <div><span class="font-medium">Director:</span> {{ sede.director || '—' }}</div>
                  <div><span class="font-medium">Tel:</span> {{ sede.telefono || '—' }}</div>
                  <div><span class="font-medium">Email:</span> {{ sede.email || '—' }}</div>
                  <div><span class="font-medium">Region:</span> {{ sede.region || '—' }}</div>
                </div>
              </div>
            }
          </div>

          @if (mostrarFormSede()) {
            <div class="card p-6 ring-2 ring-indigo-200 animate-fade-in">
              <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span class="icon text-indigo-500">{{ formSede.id ? 'edit' : 'add_business' }}</span>
                {{ formSede.id ? 'Editar Sede' : 'Nueva Sede' }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="form-group lg:col-span-2">
                  <label class="form-label">Nombre de la Sede *</label>
                  <input class="form-input" type="text" [(ngModel)]="formSede.nombre" placeholder="Ej: Sede Central, Sede Los Olivos...">
                </div>
                <div class="form-group">
                  <label class="form-label">Codigo / Clave</label>
                  <input class="form-input" type="text" [(ngModel)]="formSede.codigo" placeholder="Ej: SEDE-01">
                </div>
                <div class="form-group lg:col-span-3">
                  <label class="form-label">Direccion *</label>
                  <input class="form-input" type="text" [(ngModel)]="formSede.direccion" placeholder="Av. / Jr. / Calle, numero">
                </div>
                <div class="form-group">
                  <label class="form-label">Distrito</label>
                  <input class="form-input" type="text" [(ngModel)]="formSede.distrito">
                </div>
                <div class="form-group">
                  <label class="form-label">Provincia</label>
                  <input class="form-input" type="text" [(ngModel)]="formSede.provincia">
                </div>
                <div class="form-group">
                  <label class="form-label">Region</label>
                  <input class="form-input" type="text" [(ngModel)]="formSede.region">
                </div>
                <div class="form-group">
                  <label class="form-label">Telefono</label>
                  <input class="form-input" type="tel" [(ngModel)]="formSede.telefono">
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input class="form-input" type="email" [(ngModel)]="formSede.email">
                </div>
                <div class="form-group">
                  <label class="form-label">Director(a) de Sede</label>
                  <input class="form-input" type="text" [(ngModel)]="formSede.director" placeholder="Nombres y apellidos">
                </div>
                <div class="form-group">
                  <label class="form-label">Niveles que ofrece</label>
                  <div class="flex flex-wrap gap-3 mt-1">
                    @for (n of nivelesDisp; track n) {
                      <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input type="checkbox" class="accent-indigo-600"
                          [checked]="formSede.niveles.includes(n)"
                          (change)="toggleNivelSede(n, $event)"> {{ n }}
                      </label>
                    }
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Turnos</label>
                  <div class="flex flex-wrap gap-3 mt-1">
                    @for (t of turnosDisp; track t) {
                      <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input type="checkbox" class="accent-indigo-600"
                          [checked]="formSede.turnos.includes(t)"
                          (change)="toggleTurnoSede(t, $event)"> {{ t }}
                      </label>
                    }
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select class="form-select" [(ngModel)]="formSede.estado">
                    <option value="activo">Activa</option>
                    <option value="inactivo">Inactiva</option>
                  </select>
                </div>
              </div>
              <div class="flex gap-2 mt-4">
                <button class="btn btn-primary" (click)="guardarSede()">
                  <span class="icon">save</span> {{ formSede.id ? 'Actualizar' : 'Agregar' }} Sede
                </button>
                <button class="btn btn-secondary" (click)="mostrarFormSede.set(false)">Cancelar</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB: NIVELES Y GRADOS -->
      @if (tabActivo() === 'niveles') {
        <div class="space-y-4 animate-fade-in">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="text-sm text-gray-500">{{ niveles().length }} nivel(es) registrado(s)</p>
            @if (modoEdicion()) {
              <button class="btn btn-primary" (click)="abrirFormNivel()">
                <span class="icon">add</span> Agregar Nivel
              </button>
            }
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (nivel of niveles(); track nivel.id) {
              <div class="card p-5">
                <div class="flex items-center justify-between mb-3 gap-2">
                  <div class="flex items-center gap-2 font-semibold text-gray-800 min-w-0">
                    <span class="icon text-indigo-500 shrink-0">school</span>
                    <span class="truncate">{{ nivel.nombre }}</span>
                  </div>
                  @if (modoEdicion()) {
                    <label class="flex items-center gap-1.5 cursor-pointer shrink-0">
                      <input type="checkbox" class="accent-indigo-600" [checked]="nivel.activo"
                        (change)="toggleNivelActivo(nivel, $event)">
                      <span class="text-xs text-gray-500">Activo</span>
                    </label>
                  } @else {
                    <span class="badge shrink-0" [ngClass]="nivel.activo ? 'badge-green' : 'badge-gray'">
                      {{ nivel.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  }
                </div>

                @if (modoEdicion()) {
                  <button class="btn btn-ghost btn-sm text-indigo-600 mb-3" (click)="abrirFormGrado(nivel)">
                    <span class="icon icon-sm">add</span> Agregar Grado
                  </button>
                }

                <div class="space-y-2">
                  @for (grado of nivel.grados; track grado.id) {
                    <div class="bg-gray-50 rounded-lg px-3 py-2">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-sm font-medium text-gray-700">{{ grado.nombre }}</span>
                        @if (modoEdicion()) {
                          <div class="flex gap-1 shrink-0">
                            <button class="btn btn-ghost btn-sm text-indigo-600 px-2 py-1 min-h-0"
                              (click)="editarGrado(nivel, grado)">Editar</button>
                            <button class="btn btn-ghost btn-sm text-red-500 px-2 py-1 min-h-0"
                              (click)="eliminarGrado(nivel.id, grado.id)">Eliminar</button>
                          </div>
                        }
                      </div>
                      <div class="flex flex-wrap gap-1 mt-1 items-center">
                        @for (sec of grado.secciones; track sec.id) {
                          <div class="flex items-center gap-0.5">
                            <span class="badge badge-indigo text-xs">{{ sec.nombre }}</span>
                            @if (modoEdicion()) {
                              <button class="text-gray-400 hover:text-red-500 text-xs"
                                (click)="eliminarSeccion(grado.id, sec.id)">x</button>
                            }
                          </div>
                        }
                        @if (modoEdicion()) {
                          <button class="text-xs text-indigo-600 hover:underline"
                            (click)="agregarSeccion(grado)">+ Seccion</button>
                        }
                      </div>
                    </div>
                  } @empty {
                    <p class="text-xs text-gray-400 text-center py-3">Sin grados registrados</p>
                  }
                </div>
              </div>
            } @empty {
              <div class="col-span-full card p-8 text-center text-gray-400">
                <span class="icon icon-2xl block mb-2">school</span>
                No hay niveles configurados. Agrega el primero con el boton superior.
              </div>
            }
          </div>

          @if (mostrarFormNivel()) {
            <div class="card p-6 ring-2 ring-indigo-200 animate-fade-in">
              <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span class="icon text-indigo-500">add</span> Nuevo Nivel Educativo
              </h3>
              <div class="form-group max-w-md">
                <label class="form-label">Nombre del nivel *</label>
                <input class="form-input" type="text" [(ngModel)]="formNivel.nombre"
                  placeholder="Ej: Inicial, Primaria, Secundaria">
              </div>
              <div class="flex gap-2 mt-4">
                <button class="btn btn-primary" (click)="guardarNivel()" [disabled]="!formNivel.nombre.trim()">
                  <span class="icon">save</span> Agregar Nivel
                </button>
                <button class="btn btn-secondary" (click)="mostrarFormNivel.set(false)">Cancelar</button>
              </div>
            </div>
          }

          @if (mostrarFormGrado()) {
            <div class="card p-6 ring-2 ring-indigo-200 animate-fade-in">
              <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span class="icon text-indigo-500">{{ formGrado.id ? 'edit' : 'add' }}</span>
                {{ formGrado.id ? 'Editar Grado' : 'Nuevo Grado' }}
                @if (nivelGradoSeleccionado()) {
                  <span class="text-sm font-normal text-gray-500">— {{ nivelGradoSeleccionado()!.nombre }}</span>
                }
              </h3>
              <div class="form-group max-w-md">
                <label class="form-label">Nombre del grado *</label>
                <input class="form-input" type="text" [(ngModel)]="formGrado.nombre"
                  placeholder="Ej: 1 Grado, 4 anos, 1 Ano...">
              </div>
              <div class="flex gap-2 mt-4">
                <button class="btn btn-primary" (click)="guardarGrado()" [disabled]="!formGrado.nombre.trim()">
                  <span class="icon">save</span> {{ formGrado.id ? 'Actualizar' : 'Agregar' }} Grado
                </button>
                <button class="btn btn-secondary" (click)="cerrarFormGrado()">Cancelar</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB: PERIODOS ACADEMICOS -->
      @if (tabActivo() === 'periodos') {
        <fieldset [disabled]="!modoEdicion()" class="space-y-4 animate-fade-in border-0 p-0 m-0 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-sm text-gray-600">Ano escolar activo:</span>
            <span class="badge badge-indigo">{{ inst.anio }}</span>
            <select class="form-select w-44" [(ngModel)]="inst.tipoPeriodo">
              <option value="bimestre">Bimestral</option>
              <option value="trimestre">Trimestral</option>
              <option value="semestre">Semestral</option>
            </select>
            <button class="btn btn-secondary" (click)="generarPeriodos()">
              <span class="icon">auto_fix_high</span> Generar periodos
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (per of periodos; track per.numero; let i = $index) {
              <div class="card p-4"
                [class.ring-2]="per.actual" [class.ring-indigo-400]="per.actual">
                <div class="flex items-center justify-between mb-3">
                  <span class="font-semibold text-gray-800">{{ per.nombre }}</span>
                  @if (per.actual) { <span class="badge badge-indigo">Actual</span> }
                </div>
                <div class="space-y-2">
                  <div class="form-group">
                    <label class="form-label text-xs">Inicio</label>
                    <input class="form-input py-1 text-sm" type="date" [(ngModel)]="per.inicio">
                  </div>
                  <div class="form-group">
                    <label class="form-label text-xs">Fin</label>
                    <input class="form-input py-1 text-sm" type="date" [(ngModel)]="per.fin">
                  </div>
                  <label class="flex items-center gap-2 cursor-pointer mt-1">
                    <input type="radio" name="periodoActual" class="accent-indigo-600"
                      [checked]="per.actual" (change)="marcarActual(i)">
                    <span class="text-xs text-gray-600">Periodo actual</span>
                  </label>
                </div>
              </div>
            }
          </div>
        </fieldset>
      }

      <!-- TAB: CONFIGURACION GENERAL -->
      @if (tabActivo() === 'config') {
        <fieldset [disabled]="!modoEdicion()" class="space-y-4 animate-fade-in border-0 p-0 m-0 min-w-0">
          <div class="card p-6">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="icon text-indigo-500">tune</span> Configuracion General del Sistema
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div class="form-group">
                  <label class="form-label">Moneda</label>
                  <select class="form-select" [(ngModel)]="config.moneda">
                    <option value="PEN">Soles (S/)</option>
                    <option value="USD">Dolares ($)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Zona horaria</label>
                  <select class="form-select" [(ngModel)]="config.timezone">
                    <option value="America/Lima">America/Lima (GMT-5)</option>
                    <option value="America/Bogota">America/Bogota (GMT-5)</option>
                    <option value="America/Santiago">America/Santiago (GMT-4)</option>
                    <option value="America/Buenos_Aires">America/Buenos_Aires (GMT-3)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Formato de fecha</label>
                  <select class="form-select" [(ngModel)]="config.formatoFecha">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-700 mb-3">Modulos activos</p>
                <div class="space-y-2">
                  @for (mod of modulos; track mod.key) {
                    <label class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <div class="flex items-center gap-3">
                        <span class="icon text-indigo-500">{{ mod.icon }}</span>
                        <div>
                          <div class="text-sm font-medium text-gray-800">{{ mod.label }}</div>
                          <div class="text-xs text-gray-500">{{ mod.desc }}</div>
                        </div>
                      </div>
                      <div class="w-10 h-5 rounded-full transition-colors cursor-pointer flex items-center px-0.5"
                        [ngClass]="mod.activo ? 'bg-indigo-500 justify-end' : 'bg-gray-300 justify-start'"
                        [class.opacity-50]="!modoEdicion()"
                        [class.pointer-events-none]="!modoEdicion()"
                        (click)="mod.activo = !mod.activo">
                        <div class="w-4 h-4 bg-white rounded-full shadow"></div>
                      </div>
                    </label>
                  }
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      }

      <!-- Toast guardado -->
      @if (guardado()) {
        <div class="fixed bottom-5 right-5 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in z-50">
          <span class="icon">check_circle</span> Cambios guardados correctamente
        </div>
      }
    </div>
  `
})
export class InstitucionalComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(InstitucionalService);

  tabActivo = signal('general');
  modoEdicion = signal(false);
  mostrarFormSede = signal(false);
  mostrarFormNivel = signal(false);
  mostrarFormGrado = signal(false);
  sedeSeleccionada = signal<Sede | null>(null);
  nivelGradoSeleccionado = signal<Nivel | null>(null);
  guardado = signal(false);

  tabs = [
    { id: 'general',  label: 'Datos Generales',    icon: 'domain'     },
    { id: 'sedes',    label: 'Sedes / Locales',     icon: 'business'   },
    { id: 'niveles',  label: 'Niveles y Grados',    icon: 'school'     },
    { id: 'periodos', label: 'Periodos Academicos', icon: 'date_range' },
    { id: 'config',   label: 'Configuracion',       icon: 'settings'   },
  ];

  nivelesDisp = ['Inicial', 'Primaria', 'Secundaria'];
  turnosDisp  = ['Manana', 'Tarde', 'Noche'];

  inst: InstitucionData = {
    nombre: 'I.E.P. San Martin de Porres', siglas: 'IEP SMP',
    ruc: '20512345678', codigoModular: '0654321',
    tipoGestion: 'privada', ugel: 'UGEL 01', dre: 'DRELM',
    resolucion: 'RD N 1234-2005',
    direccion: 'Av. Los Heroes 123', distrito: 'San Juan de Miraflores',
    provincia: 'Lima', region: 'Lima', codigoPostal: '15800',
    telefono: '01-5551234', telefono2: '',
    email: 'info@sanmartin.edu.pe', web: 'https://www.sanmartin.edu.pe', facebook: '',
    director: 'Juan Carlos Perez Torres', subdirector: 'Maria Elena Quispe Huanca',
    administrador: 'Carlos Mamani Flores',
    anio: '2025', sistemaEval: 'numerico', tipoPeriodo: 'bimestre', notaMinima: 11,
  };

  private readonly _sedes = signal<Sede[]>([
    { id:1, nombre:'Sede Central', codigo:'SEDE-01',
      direccion:'Av. Los Heroes 123', distrito:'San Juan de Miraflores', provincia:'Lima', region:'Lima',
      telefono:'01-5551234', email:'central@sanmartin.edu.pe', director:'Juan Carlos Perez Torres',
      niveles:['Primaria','Secundaria'], turnos:['Manana','Tarde'], estado:'activo' },
    { id:2, nombre:'Sede Inicial', codigo:'SEDE-02',
      direccion:'Jr. Las Flores 456', distrito:'San Juan de Miraflores', provincia:'Lima', region:'Lima',
      telefono:'01-5554321', email:'inicial@sanmartin.edu.pe', director:'Rosa Gutierrez Lima',
      niveles:['Inicial'], turnos:['Manana'], estado:'activo' },
  ]);
  readonly sedes = this._sedes.asReadonly();

  formSede: Sede = this._sedeVacio();
  formNivel = { nombre: '' };
  formGrado: { id: number; nivelId: number; nombre: string } = this._gradoVacio();

  private readonly _niveles = signal<Nivel[]>([]);
  readonly niveles = this._niveles.asReadonly();

  periodos: Periodo[] = [
    { numero:1, nombre:'1 Bimestre', tipo:'bimestre', inicio:'2025-03-10', fin:'2025-05-09', actual:false },
    { numero:2, nombre:'2 Bimestre', tipo:'bimestre', inicio:'2025-05-12', fin:'2025-07-25', actual:true  },
    { numero:3, nombre:'3 Bimestre', tipo:'bimestre', inicio:'2025-08-11', fin:'2025-10-17', actual:false },
    { numero:4, nombre:'4 Bimestre', tipo:'bimestre', inicio:'2025-10-20', fin:'2025-12-19', actual:false },
  ];

  config: ConfigSistema = { moneda:'PEN', timezone:'America/Lima', formatoFecha:'DD/MM/YYYY' };

  modulos: ModuloSistema[] = [
    { key:'matricula',   label:'Matricula',   desc:'Gestion de matriculas y vacantes',  icon:'how_to_reg',     activo:true  },
    { key:'asistencia',  label:'Asistencia',  desc:'Registro diario de asistencia',      icon:'fact_check',     activo:true  },
    { key:'evaluacion',  label:'Evaluacion',  desc:'Notas y calificaciones',             icon:'grading',        activo:true  },
    { key:'tesoreria',   label:'Tesoreria',   desc:'Pagos y control de deudas',          icon:'payments',       activo:true  },
    { key:'biblioteca',  label:'Biblioteca',  desc:'Prestamos y catalogo',               icon:'menu_book',      activo:false },
    { key:'transporte',  label:'Transporte',  desc:'Rutas y asignacion de buses',        icon:'directions_bus', activo:false },
    { key:'horarios',    label:'Horarios',    desc:'Programacion de horarios',           icon:'schedule',       activo:true  },
    { key:'comunicados', label:'Comunicados', desc:'Mensajeria y notificaciones',        icon:'campaign',       activo:true  },
  ];

  private snapshot: {
    inst: InstitucionData;
    periodos: Periodo[];
    config: ConfigSistema;
    modulos: ModuloSistema[];
  } | null = null;

  ngOnInit(): void {
    this.layout.setTitle('Configuracion Institucional');
    forkJoin({
      config: this.svc.load(),
      niveles: this.svc.loadEducationLevels(),
    }).subscribe(({ config, niveles }) => {
      if (config?.institution) {
        const { institution, campuses } = config;
        this.inst = {
          nombre: institution.nombre,
          siglas: institution.siglas,
          ruc: institution.ruc,
          codigoModular: institution.codigoModular,
          tipoGestion: institution.tipoGestion,
          ugel: institution.ugel,
          dre: institution.dre,
          resolucion: institution.resolucion,
          direccion: institution.direccion,
          distrito: institution.distrito,
          provincia: institution.provincia,
          region: institution.region,
          codigoPostal: institution.codigoPostal,
          telefono: institution.telefono,
          telefono2: institution.telefono2,
          email: institution.email,
          web: institution.web,
          facebook: institution.facebook,
          director: institution.director,
          subdirector: institution.subdirector,
          administrador: institution.administrador,
          anio: institution.anio,
          sistemaEval: institution.sistemaEval,
          tipoPeriodo: institution.tipoPeriodo,
          notaMinima: Number(institution.notaMinima ?? 11),
        };
        if (institution.periodos?.length) this.periodos = institution.periodos;
        if (institution.config) this.config = { ...this.config, ...institution.config };
        if (institution.modulos?.length) this.modulos = institution.modulos;
        if (campuses.length) this._sedes.set(campuses);
      }

      const nivelesFuente = niveles.length
        ? niveles
        : (config?.institution?.niveles ?? []);
      this._niveles.set(this.mapNivelesApi(nivelesFuente));
    });
  }

  activarEdicion(): void {
    this.snapshot = {
      inst: { ...this.inst },
      periodos: structuredClone(this.periodos),
      config: { ...this.config },
      modulos: structuredClone(this.modulos),
    };
    this.modoEdicion.set(true);
  }

  cancelarEdicion(): void {
    if (this.snapshot) {
      this.inst = { ...this.snapshot.inst };
      this.periodos = structuredClone(this.snapshot.periodos);
      this.config = { ...this.snapshot.config };
      this.modulos = structuredClone(this.snapshot.modulos);
      this.snapshot = null;
    }
    this.mostrarFormNivel.set(false);
    this.cerrarFormGrado();
    this.modoEdicion.set(false);
  }

  private mapNivelesApi(niveles: Nivel[]): Nivel[] {
    return niveles.map(nivel => ({
      ...nivel,
      grados: (nivel.grados ?? []).map(grado => ({
        ...grado,
        secciones: (grado.secciones ?? []).map(seccion =>
          typeof seccion === 'string' ? { id: 0, nombre: seccion } : seccion,
        ),
      })),
    }));
  }

  private _gradoVacio(nivelId = 0): { id: number; nivelId: number; nombre: string } {
    return { id: 0, nivelId, nombre: '' };
  }

  abrirFormNivel(): void {
    this.formNivel = { nombre: '' };
    this.mostrarFormNivel.set(true);
    this.cerrarFormGrado();
  }

  guardarNivel(): void {
    const nombre = this.formNivel.nombre.trim();
    if (!nombre) return;
    this.svc.createEducationLevel({ nombre, activo: true }).subscribe(nivel => {
      this._niveles.update(list => [...list, { ...nivel, grados: nivel.grados ?? [] }]);
      this.mostrarFormNivel.set(false);
    });
  }

  toggleNivelActivo(nivel: Nivel, e: Event): void {
    const activo = (e.target as HTMLInputElement).checked;
    this.svc.updateEducationLevel(nivel.id, { activo }).subscribe(updated => {
      this._niveles.update(list => list.map(n => n.id === updated.id ? { ...n, ...updated } : n));
    });
  }

  abrirFormGrado(nivel: Nivel): void {
    this.nivelGradoSeleccionado.set(nivel);
    this.formGrado = this._gradoVacio(nivel.id);
    this.mostrarFormGrado.set(true);
    this.mostrarFormNivel.set(false);
  }

  editarGrado(nivel: Nivel, grado: Grado): void {
    this.nivelGradoSeleccionado.set(nivel);
    this.formGrado = { id: grado.id, nivelId: nivel.id, nombre: grado.nombre };
    this.mostrarFormGrado.set(true);
  }

  cerrarFormGrado(): void {
    this.mostrarFormGrado.set(false);
    this.nivelGradoSeleccionado.set(null);
    this.formGrado = this._gradoVacio();
  }

  guardarGrado(): void {
    const nombre = this.formGrado.nombre.trim();
    if (!nombre) return;

    const req = this.formGrado.id
      ? this.svc.updateGradeLevel(this.formGrado.id, { nombre })
      : this.svc.createGradeLevel(this.formGrado.nivelId, { nombre });

    req.subscribe(grado => {
      this._niveles.update(list => list.map(nivel => {
        if (nivel.id !== this.formGrado.nivelId) return nivel;
        const grados = [...nivel.grados];
        if (this.formGrado.id) {
          return {
            ...nivel,
            grados: grados.map(g => g.id === grado.id ? { ...g, ...grado } : g),
          };
        }
        return { ...nivel, grados: [...grados, { ...grado, secciones: grado.secciones ?? [] }] };
      }));
      this.cerrarFormGrado();
    });
  }

  eliminarGrado(nivelId: number, gradoId: number): void {
    if (!confirm('¿Eliminar este grado y sus secciones?')) return;
    this.svc.deleteGradeLevel(gradoId).subscribe(() => {
      this._niveles.update(list => list.map(nivel =>
        nivel.id === nivelId
          ? { ...nivel, grados: nivel.grados.filter(g => g.id !== gradoId) }
          : nivel,
      ));
    });
  }

  agregarSeccion(grado: Grado): void {
    const nombre = prompt('Nombre de la seccion (Ej: A, B, C...):');
    if (!nombre?.trim()) return;
    this.svc.createGradeSection(grado.id, { nombre: nombre.trim() }).subscribe(seccion => {
      this._niveles.update(list => list.map(nivel => ({
        ...nivel,
        grados: nivel.grados.map(g =>
          g.id === grado.id ? { ...g, secciones: [...g.secciones, seccion] } : g,
        ),
      })));
    });
  }

  eliminarSeccion(gradoId: number, seccionId: number): void {
    this.svc.deleteGradeSection(seccionId).subscribe(() => {
      this._niveles.update(list => list.map(nivel => ({
        ...nivel,
        grados: nivel.grados.map(g =>
          g.id === gradoId ? { ...g, secciones: g.secciones.filter(s => s.id !== seccionId) } : g,
        ),
      })));
    });
  }

  private _sedeVacio(): Sede {
    return { id:0, nombre:'', codigo:'', direccion:'', distrito:'', provincia:'Lima',
      region:'Lima', telefono:'', email:'', director:'', niveles:[], turnos:[], estado:'activo' };
  }

  abrirFormSede(): void  { this.formSede = this._sedeVacio(); this.mostrarFormSede.set(true); }

  editarSede(sede: Sede): void {
    this.formSede = { ...sede, niveles:[...sede.niveles], turnos:[...sede.turnos] };
    this.mostrarFormSede.set(true);
  }

  guardarSede(): void {
    if (!this.formSede.nombre.trim()) return;
    const payload = {
      nombre: this.formSede.nombre.trim(),
      codigo: this.formSede.codigo,
      direccion: this.formSede.direccion,
      distrito: this.formSede.distrito,
      provincia: this.formSede.provincia,
      region: this.formSede.region,
      telefono: this.formSede.telefono,
      email: this.formSede.email,
      director: this.formSede.director,
      niveles: [...this.formSede.niveles],
      turnos: [...this.formSede.turnos],
      estado: this.formSede.estado,
    };

    const req = this.formSede.id
      ? this.svc.updateCampus(this.formSede.id, payload)
      : this.svc.createCampus(payload);

    req.subscribe(saved => {
      this._sedes.update(list => {
        if (this.formSede.id) return list.map(s => s.id === saved.id ? saved : s);
        return [...list, saved];
      });
      this.mostrarFormSede.set(false);
    });
  }

  eliminarSede(id: number): void {
    if (this._sedes().length <= 1) return;
    this.svc.deleteCampus(id).subscribe(() => {
      this._sedes.update(list => list.filter(s => s.id !== id));
    });
  }

  toggleNivelSede(nivel: string, e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    this.formSede.niveles = checked
      ? [...new Set([...this.formSede.niveles, nivel])]
      : this.formSede.niveles.filter(n => n !== nivel);
  }

  toggleTurnoSede(turno: string, e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    this.formSede.turnos = checked
      ? [...new Set([...this.formSede.turnos, turno])]
      : this.formSede.turnos.filter(t => t !== turno);
  }

  marcarActual(idx: number): void {
    this.periodos = this.periodos.map((p, i) => ({ ...p, actual: i === idx }));
  }

  generarPeriodos(): void {
    const tipo = this.inst.tipoPeriodo; const anio = this.inst.anio;
    if (tipo === 'bimestre') {
      this.periodos = [
        { numero:1, nombre:'1 Bimestre', tipo, inicio:`${anio}-03-10`, fin:`${anio}-05-09`, actual:false },
        { numero:2, nombre:'2 Bimestre', tipo, inicio:`${anio}-05-12`, fin:`${anio}-07-25`, actual:true  },
        { numero:3, nombre:'3 Bimestre', tipo, inicio:`${anio}-08-11`, fin:`${anio}-10-17`, actual:false },
        { numero:4, nombre:'4 Bimestre', tipo, inicio:`${anio}-10-20`, fin:`${anio}-12-19`, actual:false },
      ];
    } else if (tipo === 'trimestre') {
      this.periodos = [
        { numero:1, nombre:'1 Trimestre', tipo, inicio:`${anio}-03-10`, fin:`${anio}-06-20`, actual:false },
        { numero:2, nombre:'2 Trimestre', tipo, inicio:`${anio}-07-07`, fin:`${anio}-09-26`, actual:true  },
        { numero:3, nombre:'3 Trimestre', tipo, inicio:`${anio}-10-13`, fin:`${anio}-12-19`, actual:false },
      ];
    } else {
      this.periodos = [
        { numero:1, nombre:'1 Semestre', tipo, inicio:`${anio}-03-10`, fin:`${anio}-07-25`, actual:false },
        { numero:2, nombre:'2 Semestre', tipo, inicio:`${anio}-08-11`, fin:`${anio}-12-19`, actual:true  },
      ];
    }
  }

  guardar(): void {
    this.svc.save({
      inst: this.inst,
      periodos: this.periodos,
      config: this.config,
      modulos: this.modulos,
    }).subscribe({
      next: () => {
        this.modoEdicion.set(false);
        this.snapshot = null;
        this.guardado.set(true);
        setTimeout(() => this.guardado.set(false), 3000);
      },
    });
  }
}
