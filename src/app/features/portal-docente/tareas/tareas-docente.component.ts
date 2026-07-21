import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { NgClass } from '@angular/common';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ApiResource } from '../../../core/api/api.models';

import { AsistenciaDocenteService } from '../asistencia/asistencia-docente.service';

import { DocenteSalonAsignado } from '../asistencia/asistencia-docente.model';

import { RecursosService } from '../recursos/recursos.service';

import { resourceFileUrl } from '../recursos/recursos.model';

import { EntregaTareaDocente, TareasDocenteService } from './tareas-docente.service';

import {

  estadoEntregaBadge,

  estadoEntregaLabel,

  fileAccentForName,

  fileIconForName,

  previewTipo,

} from './tareas-docente.model';



type FiltroEntrega = 'todos' | 'pendientes' | 'entregadas' | 'calificadas';



@Component({

  selector: 'app-tareas-docente-entregas',

  standalone: true,

  imports: [FormsModule, NgClass],

  template: `

<div class="space-y-5 animate-fade-in">



  @if (toast()) {

    <div class="fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-5 py-3.5 rounded-xl shadow-2xl border animate-slide-in-r max-w-sm"

      [ngClass]="toast()!.tipo === 'ok' ? 'bg-white border-emerald-300' : 'bg-white border-red-300'">

      <span class="text-lg">{{ toast()!.tipo === 'ok' ? '✓' : '✕' }}</span>

      <p class="text-sm text-gray-700 font-medium flex-1 leading-snug">{{ toast()!.msg }}</p>

      <button type="button" (click)="toast.set(null)" class="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>

    </div>

  }



  @if (!salonSeleccionado()) {

    <div>

      <h2 class="text-2xl font-bold text-gray-900">Entregas de tareas</h2>

      <p class="text-sm text-gray-500 mt-0.5">Selecciona un salón para revisar y calificar entregas</p>

    </div>



    @if (asistenciaSvc.loading()) {

      <div class="card p-12 text-center text-gray-400">

        <span class="icon icon-xl animate-spin mb-3 block mx-auto">progress_activity</span>

        Cargando salones…

      </div>

    } @else if (!salones().length) {

      <div class="card p-12 text-center text-gray-500">No tienes salones asignados.</div>

    } @else {

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        @for (s of salones(); track salonKey(s)) {

          <button type="button" class="card p-5 text-left hover:shadow-md border-l-4 border-l-violet-500 transition-shadow"

            (click)="seleccionarSalon(s)">

            <div class="text-xs font-semibold uppercase tracking-wide text-violet-600">{{ s.nivel }}</div>

            <h3 class="font-bold text-gray-800 text-lg mt-0.5">{{ s.grado }} "{{ s.seccion }}"</h3>

            <p class="text-sm text-gray-500 mt-1">{{ s.totalAlumnos }} alumno(s)</p>

          </button>

        }

      </div>

    }

  } @else if (!actividadSeleccionada()) {

    <div class="flex items-center gap-3">

      <button type="button" class="btn btn-secondary btn-sm" (click)="volverSalones()">

        <span class="icon icon-sm">arrow_back</span> Salones

      </button>

      <div>

        <h2 class="text-lg font-bold text-gray-800">{{ salonSeleccionado()!.label }}</h2>

        <p class="text-sm text-gray-500">Tareas y evaluaciones publicadas</p>

      </div>

    </div>



    @if (cargandoActividades()) {

      <div class="card p-12 text-center text-gray-400">Cargando actividades…</div>

    } @else if (!actividades().length) {

      <div class="card p-12 text-center text-gray-500">

        No hay tareas publicadas en este salón. Asígnalas desde la pestaña «Asignar tareas».

      </div>

    } @else {

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        @for (a of actividades(); track a.id) {

          <button type="button" class="card p-5 text-left hover:shadow-md transition-shadow group"

            (click)="seleccionarActividad(a)">

            <div class="flex items-start justify-between gap-3">

              <div>

                <span class="badge text-[10px]" [ngClass]="a.tipo === 'evaluacion' ? 'badge-red' : 'badge-indigo'">

                  {{ a.tipo === 'evaluacion' ? 'Evaluación' : 'Tarea' }}

                </span>

                <h3 class="font-semibold text-gray-900 mt-2 group-hover:text-indigo-700 transition-colors">{{ a.titulo }}</h3>

                <p class="text-sm text-gray-500 mt-1">{{ a.curso }}</p>

                <p class="text-xs text-gray-400 mt-2 flex items-center gap-1">

                  <span class="icon icon-sm">event</span>

                  Entrega: {{ a.fechaEntregaDisplay || a.fechaEntrega }}

                </p>

              </div>

              <div class="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">

                <span class="icon">assignment</span>

              </div>

            </div>

          </button>

        }

      </div>

    }

  } @else {

    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

      <div class="flex items-center gap-3">

        <button type="button" class="btn btn-secondary btn-sm" (click)="volverActividades()">

          <span class="icon icon-sm">arrow_back</span> Actividades

        </button>

        <div>

          <h2 class="text-xl font-bold text-gray-900">{{ actividadSeleccionada()!.titulo }}</h2>

          <p class="text-sm text-gray-500">{{ actividadSeleccionada()!.curso }} · {{ salonSeleccionado()!.label }}</p>

        </div>

      </div>

      <button type="button" class="btn btn-secondary btn-sm" (click)="cargarEntregas()" [disabled]="svc.loading()">

        <span class="icon icon-sm" [class.animate-spin]="svc.loading()">refresh</span> Actualizar

      </button>

    </div>



    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">

      @for (kpi of kpis(); track kpi.label) {

        <button type="button" class="card p-4 text-left hover:shadow-md transition-shadow"

          [ngClass]="filtroEntrega() === kpi.filtro ? 'ring-2 ring-indigo-400' : ''"

          (click)="filtroEntrega.set(kpi.filtro)">

          <p class="text-xs text-gray-400">{{ kpi.label }}</p>

          <p class="text-2xl font-bold mt-0.5" [ngClass]="kpi.text ?? 'text-gray-900'">{{ kpi.value }}</p>

        </button>

      }

    </div>



    <div class="card p-4">

      <div class="relative max-w-md">

        <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>

        <input class="form-input pl-10 w-full" placeholder="Buscar alumno..."

          [ngModel]="busquedaAlumno()" (ngModelChange)="busquedaAlumno.set($event)">

      </div>

    </div>



    @if (svc.loading()) {

      <div class="card p-12 text-center text-gray-400">

        <span class="icon icon-xl animate-spin mb-3 block mx-auto">progress_activity</span>

        Cargando alumnos y entregas…

      </div>

    } @else if (!entregas().length) {

      <div class="card p-12 text-center text-gray-500">

        No hay alumnos matriculados en este salón.

      </div>

    } @else if (!entregasFiltradas().length) {

      <div class="card p-12 text-center text-gray-400">Ningún alumno coincide con la búsqueda o filtro.</div>

    } @else {

      <div class="space-y-3">

        @for (e of entregasFiltradas(); track e.studentId) {

          @let accent = e.archivoEntregaNombre ? fileAccentForName(e.archivoEntregaNombre) : null;

          <div class="card p-4 hover:shadow-md transition-shadow">

            <div class="flex flex-col xl:flex-row xl:items-center gap-4">

              <div class="flex items-start gap-3 flex-1 min-w-0">

                <div class="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">

                  {{ e.alumnoIniciales }}

                </div>

                <div class="min-w-0 flex-1">

                  <div class="flex flex-wrap items-center gap-2">

                    <h3 class="font-semibold text-gray-900">{{ e.alumnoLabel }}</h3>

                    <span class="badge text-[10px]" [ngClass]="estadoEntregaBadge(e.estado)">

                      {{ estadoEntregaLabel(e.estado) }}

                    </span>

                  </div>

                  <p class="text-xs text-gray-400 mt-0.5">{{ e.studentGrado }} · Sección {{ e.studentSeccion }}</p>



                  @if (e.archivoEntregaNombre) {

                    <div class="mt-3 flex flex-wrap items-center gap-2">

                      <div class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs max-w-full"

                        [ngClass]="accent ? [accent.bg, accent.border] : ['bg-gray-50', 'border-gray-100']">

                        <span class="icon icon-sm" [ngClass]="accent?.text ?? 'text-gray-500'">

                          {{ fileIconForName(e.archivoEntregaNombre) }}

                        </span>

                        <span class="font-medium text-gray-800 truncate">{{ e.archivoEntregaNombre }}</span>

                      </div>

                      @if (e.fechaEntregaReal) {

                        <span class="text-xs text-gray-400">Enviada {{ e.fechaEntregaReal }}</span>

                      }

                    </div>

                    @if (e.comentarioEntrega) {

                      <p class="mt-2 text-xs text-gray-500 italic line-clamp-2">"{{ e.comentarioEntrega }}"</p>

                    }

                  } @else {

                    <p class="mt-2 text-xs text-gray-400 flex items-center gap-1">

                      <span class="icon icon-sm">hourglass_empty</span> Aún no ha subido archivo

                    </p>

                  }



                  @if (e.estado === 'GRADED') {

                    <div class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 text-sm font-semibold">

                      <span class="icon icon-sm">grading</span> Nota: {{ e.nota ?? '—' }}/20

                    </div>

                  }

                </div>

              </div>



              <div class="flex items-center gap-2 shrink-0 xl:justify-end">

                @if (e.archivoEntregaNombre && e.id > 0) {

                  <button type="button" class="btn btn-secondary btn-sm" (click)="abrirRevision(e)">

                    <span class="icon icon-sm">visibility</span> Ver y corregir

                  </button>

                } @else if (e.estado === 'GRADED' && e.id > 0) {

                  <button type="button" class="btn btn-secondary btn-sm" (click)="abrirRevision(e)">

                    <span class="icon icon-sm">grading</span> Ver calificación

                  </button>

                } @else {

                  <span class="text-xs text-gray-400 px-3 py-2">Sin entrega</span>

                }

              </div>

            </div>

          </div>

        }

      </div>

    }

  }

</div>



@if (revisando(); as e) {

  <div class="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm" (click)="cerrarRevision()"></div>

  <div class="fixed inset-y-0 right-0 w-full max-w-6xl bg-white shadow-2xl z-[90] flex flex-col animate-slide-in-r">

    <div class="px-6 py-4 border-b border-gray-200 shrink-0 bg-gradient-to-r from-indigo-50 via-white to-violet-50">

      <div class="flex items-start justify-between gap-4">

        <div class="flex items-start gap-3 min-w-0">

          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold shrink-0">

            {{ e.alumnoIniciales }}

          </div>

          <div class="min-w-0">

            <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Revisión de entrega</p>

            <h2 class="text-lg font-bold text-gray-900 truncate">{{ e.alumnoLabel }}</h2>

            <p class="text-sm text-gray-500 mt-0.5">{{ actividadSeleccionada()?.titulo }}</p>

          </div>

        </div>

        <button type="button" class="btn btn-ghost btn-icon shrink-0" (click)="cerrarRevision()">

          <span class="icon icon-sm">close</span>

        </button>

      </div>

    </div>



    <div class="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">

      <div class="lg:w-[58%] border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col min-h-0 bg-slate-50/60">

        <div class="px-5 py-3 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">

          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">

            <span class="icon icon-sm text-indigo-500">description</span> Documento del alumno

          </h3>

          @if (e.archivoEntregaNombre) {

            <a [href]="archivoUrl(e)" target="_blank" rel="noopener"

              class="btn btn-ghost btn-sm text-indigo-600">

              <span class="icon icon-sm">open_in_new</span> Abrir

            </a>

          }

        </div>



        <div class="flex-1 overflow-auto p-4 min-h-[280px] lg:min-h-0">

          @if (!e.archivoEntregaNombre) {

            <div class="h-full min-h-[240px] flex flex-col items-center justify-center text-center text-gray-400 p-8">

              <span class="icon mb-3" style="font-size:48px">folder_off</span>

              <p class="font-medium text-gray-600">Sin archivo entregado</p>

              <p class="text-sm mt-1">El alumno aún no ha subido su trabajo.</p>

            </div>

          } @else if (previewDe(e) === 'pdf') {

            <div class="h-full min-h-[480px] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">

              <iframe [src]="previewSrc(e)" class="w-full h-full min-h-[480px]" title="Vista previa PDF"></iframe>

            </div>

          } @else if (previewDe(e) === 'image') {

            <div class="flex items-center justify-center min-h-[280px]">

              <img [src]="archivoUrl(e)" [alt]="e.archivoEntregaNombre"

                class="max-w-full max-h-[70vh] rounded-xl border border-gray-200 shadow-md object-contain bg-white">

            </div>

          } @else {

            @let accent = fileAccentForName(e.archivoEntregaNombre);

            <div class="h-full min-h-[240px] flex flex-col items-center justify-center p-8">

              <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"

                [ngClass]="[accent.bg, accent.text]">

                <span class="icon" style="font-size:40px">{{ fileIconForName(e.archivoEntregaNombre) }}</span>

              </div>

              <p class="font-semibold text-gray-900 text-center">{{ e.archivoEntregaNombre }}</p>

              <p class="text-sm text-gray-500 mt-2 text-center max-w-sm">

                Vista previa no disponible para este tipo de archivo. Descárgalo para revisarlo.

              </p>

              <a [href]="archivoUrl(e)" target="_blank" rel="noopener" download

                class="btn btn-primary btn-sm mt-5">

                <span class="icon icon-sm">download</span> Descargar archivo

              </a>

            </div>

          }

        </div>



        @if (e.comentarioEntrega) {

          <div class="px-5 py-4 border-t border-gray-200 bg-white shrink-0">

            <p class="text-xs font-semibold uppercase text-gray-400 mb-1">Comentario del alumno</p>

            <p class="text-sm text-gray-700 leading-relaxed">{{ e.comentarioEntrega }}</p>

          </div>

        }

      </div>



      <div class="lg:w-[42%] flex flex-col min-h-0 bg-white">

        <div class="px-5 py-3 border-b border-gray-200 shrink-0">

          <h3 class="text-sm font-semibold text-gray-800 flex items-center gap-2">

            <span class="icon icon-sm text-indigo-500">grading</span> Calificación

          </h3>

        </div>



        <div class="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          <div>

            <label class="form-label">Nota (0 – 20)</label>

            <div class="flex items-center gap-3">

              <input type="range" min="0" max="20" step="0.5" class="flex-1 accent-indigo-600"

                [(ngModel)]="formNota" [disabled]="!puedeCalificar(e) || svc.saving()">

              <input type="number" min="0" max="20" step="0.5"

                class="form-input w-20 text-center font-bold text-indigo-700"

                [(ngModel)]="formNota" [disabled]="!puedeCalificar(e) || svc.saving()">

            </div>

          </div>



          <div>

            <label class="form-label">Retroalimentación</label>

            <textarea class="form-input w-full h-40 resize-none leading-relaxed" [(ngModel)]="formRetroalimentacion"

              [disabled]="!puedeCalificar(e) || svc.saving()"

              placeholder="Escribe observaciones, aciertos y aspectos a mejorar para el alumno..."></textarea>

          </div>



          @if (!puedeCalificar(e)) {

            <div class="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">

              Solo puedes calificar cuando el alumno haya subido su entrega.

            </div>

          }

        </div>



        <div class="px-5 py-4 border-t border-gray-200 flex gap-3 shrink-0 bg-gray-50/80">

          <button type="button" class="btn btn-secondary flex-1" (click)="cerrarRevision()">Cerrar</button>

          <button type="button" class="btn btn-primary flex-1"

            [disabled]="!puedeCalificar(e) || formNota === null || formNota === undefined || svc.saving()"

            (click)="guardarCalificacion()">

            @if (svc.saving()) {

              <span class="icon icon-sm animate-spin">progress_activity</span> Guardando…

            } @else {

              <span class="icon icon-sm">save</span> Guardar calificación

            }

          </button>

        </div>

      </div>

    </div>

  </div>

}

  `,

})

export class TareasDocenteComponent implements OnInit {

  private readonly sanitizer = inject(DomSanitizer);

  readonly asistenciaSvc = inject(AsistenciaDocenteService);

  private readonly recursosSvc = inject(RecursosService);

  readonly svc = inject(TareasDocenteService);



  readonly salones = signal<DocenteSalonAsignado[]>([]);

  readonly salonSeleccionado = signal<(DocenteSalonAsignado & { label: string }) | null>(null);

  readonly actividades = signal<ApiResource[]>([]);

  readonly actividadSeleccionada = signal<ApiResource | null>(null);

  readonly entregas = signal<EntregaTareaDocente[]>([]);

  readonly cargandoActividades = signal(false);

  readonly revisando = signal<EntregaTareaDocente | null>(null);

  readonly toast = signal<{ msg: string; tipo: 'ok' | 'err' } | null>(null);

  readonly filtroEntrega = signal<FiltroEntrega>('todos');

  readonly busquedaAlumno = signal('');



  formNota: number | null = null;

  formRetroalimentacion = '';



  readonly estadoEntregaLabel = estadoEntregaLabel;

  readonly estadoEntregaBadge = estadoEntregaBadge;

  readonly fileIconForName = fileIconForName;

  readonly fileAccentForName = fileAccentForName;



  readonly kpis = computed(() => {

    const list = this.entregas();

    return [

      { label: 'Alumnos', value: list.length, filtro: 'todos' as FiltroEntrega },

      { label: 'Entregadas', value: list.filter(e => e.estado === 'SUBMITTED' || e.estado === 'GRADED').length, text: 'text-emerald-700', filtro: 'entregadas' as FiltroEntrega },

      { label: 'Pendientes', value: list.filter(e => e.estado === 'PENDING' || e.estado === 'OVERDUE').length, text: 'text-amber-700', filtro: 'pendientes' as FiltroEntrega },

      { label: 'Calificadas', value: list.filter(e => e.estado === 'GRADED').length, text: 'text-indigo-700', filtro: 'calificadas' as FiltroEntrega },

    ];

  });



  readonly entregasFiltradas = computed(() => {

    let list = this.entregas();

    const filtro = this.filtroEntrega();

    const q = this.busquedaAlumno().trim().toLowerCase();



    if (filtro === 'pendientes') {

      list = list.filter(e => e.estado === 'PENDING' || e.estado === 'OVERDUE');

    } else if (filtro === 'entregadas') {

      list = list.filter(e => e.estado === 'SUBMITTED' || e.estado === 'GRADED');

    } else if (filtro === 'calificadas') {

      list = list.filter(e => e.estado === 'GRADED');

    }



    if (q) {

      list = list.filter(e =>

        e.alumnoLabel.toLowerCase().includes(q) ||

        (e.studentNombre ?? '').toLowerCase().includes(q) ||

        (e.studentApellido ?? '').toLowerCase().includes(q),

      );

    }



    return list;

  });



  ngOnInit(): void {
    this.asistenciaSvc.loadMisSalones(new Date().getFullYear()).subscribe({

      next: (res: { salones: DocenteSalonAsignado[] }) => this.salones.set(res.salones),

      error: () => this.salones.set([]),

    });

  }



  salonKey(s: DocenteSalonAsignado): string {

    return `${s.nivel}-${s.grado}-${s.seccion}`;

  }



  seleccionarSalon(s: DocenteSalonAsignado): void {

    this.salonSeleccionado.set({

      ...s,

      label: `${s.grado} "${s.seccion}" · ${s.nivel}`,

    });

    this.cargarActividades();

  }



  volverSalones(): void {

    this.salonSeleccionado.set(null);

    this.actividadSeleccionada.set(null);

    this.actividades.set([]);

    this.entregas.set([]);

  }



  seleccionarActividad(a: ApiResource): void {

    this.actividadSeleccionada.set(a);

    this.filtroEntrega.set('todos');

    this.busquedaAlumno.set('');

    this.cargarEntregas();

  }



  volverActividades(): void {

    this.actividadSeleccionada.set(null);

    this.entregas.set([]);

  }



  cargarActividades(): void {

    const salon = this.salonSeleccionado();

    if (!salon) return;

    this.cargandoActividades.set(true);

    this.recursosSvc.load({

      nivel: salon.nivel,

      grado: salon.grado,

      seccion: salon.seccion,

    }).subscribe({

      next: (items) => {

        this.actividades.set(

          items.filter(r => (r.tipo === 'tarea' || r.tipo === 'evaluacion') && r.visible !== false),

        );

        this.cargandoActividades.set(false);

      },

      error: () => {

        this.actividades.set([]);

        this.cargandoActividades.set(false);

      },

    });

  }



  cargarEntregas(): void {

    const salon = this.salonSeleccionado();

    const act = this.actividadSeleccionada();

    if (!salon || !act) return;



    this.svc.loadEntregas({

      resourceId: act.id,

      nivel: salon.nivel,

      grado: salon.grado,

      seccion: salon.seccion,

    }).subscribe(items => this.entregas.set(items));

  }



  archivoUrl(e: EntregaTareaDocente): string {

    return resourceFileUrl(e.archivoEntregaUrl ?? '');

  }



  previewDe(e: EntregaTareaDocente) {

    return previewTipo(e.archivoEntregaMime, e.archivoEntregaNombre);

  }



  previewSrc(e: EntregaTareaDocente): SafeResourceUrl {

    return this.sanitizer.bypassSecurityTrustResourceUrl(this.archivoUrl(e));

  }



  puedeCalificar(e: EntregaTareaDocente): boolean {

    return e.id > 0 && (e.estado === 'SUBMITTED' || e.estado === 'GRADED') && !!e.archivoEntregaUrl;

  }



  abrirRevision(e: EntregaTareaDocente): void {

    this.revisando.set(e);

    this.formNota = e.nota ?? 0;

    this.formRetroalimentacion = e.retroalimentacion ?? '';

  }



  cerrarRevision(): void {

    if (this.svc.saving()) return;

    this.revisando.set(null);

    this.formNota = null;

    this.formRetroalimentacion = '';

  }



  guardarCalificacion(): void {

    const e = this.revisando();

    if (!e || !this.puedeCalificar(e) || this.formNota === null || this.formNota === undefined || this.formNota < 0) {

      this.mostrarToast('Ingresa una nota válida', 'err');

      return;

    }



    this.svc.calificar(e.id, {

      nota: this.formNota,

      retroalimentacion: this.formRetroalimentacion,

    }).subscribe(ok => {

      if (ok) {

        this.cerrarRevision();

        this.cargarEntregas();

        this.mostrarToast(`Calificación guardada para ${e.alumnoLabel}`, 'ok');

      } else {

        this.mostrarToast('No se pudo guardar la calificación', 'err');

      }

    });

  }



  private toastTimer?: ReturnType<typeof setTimeout>;

  private mostrarToast(msg: string, tipo: 'ok' | 'err'): void {

    clearTimeout(this.toastTimer);

    this.toast.set({ msg, tipo });

    this.toastTimer = setTimeout(() => this.toast.set(null), 4500);

  }

}


