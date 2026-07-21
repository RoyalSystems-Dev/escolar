import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { NotasRegistroService } from '../notas/notas-registro.service';
import { RegistryContextItem } from '../notas/notas-registro.model';
import { ActasService } from './actas.service';
import {
  ActaDetail,
  ActaEstado,
  ActaListItem,
  ESTADOS_ACTA,
} from './actas.model';

@Component({
  selector: 'app-actas',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Actas de Evaluación</h2>
          <p class="text-sm text-gray-400 mt-0.5">
            Documento oficial del salón al cierre de cada bimestre: compilado de notas por alumno y por curso
          </p>
          <p class="text-xs text-gray-400 mt-1">
            Una acta por salón y bimestre · notas ponderadas según fórmula de evaluación
          </p>
          @if (bimestreActual()) {
            <p class="text-xs text-amber-600 mt-1">
              Periodo en curso: {{ bimestreActual() }}° bimestre —
              @if (bimestresTerminados().length) {
                actas generables para: B{{ bimestresTerminados().join(', B') }}
              } @else {
                aún no hay bimestres cerrados
              }
            </p>
          }
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" (click)="cargar()">
            <span class="icon icon-sm">refresh</span> Actualizar
          </button>
          <button class="btn btn-primary btn-sm" (click)="abrirGenerar()"
            [disabled]="!contextoActivo() || !bimestreGenerable(bimestreFiltro())"
            [title]="bimestreGenerable(bimestreFiltro()) ? '' : 'El bimestre aún no ha concluido'">
            <span class="icon icon-sm">add</span> Generar acta
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

      <div class="card p-4 space-y-4">
        @if (notasSvc.loadingContexts()) {
          <p class="text-sm text-gray-400 text-center py-2">Cargando aulas...</p>
        } @else if (!contextos().length) {
          <p class="text-sm text-gray-500 text-center py-2">No hay aulas con alumnos matriculados.</p>
        } @else {
          <div class="flex flex-col lg:flex-row lg:items-end gap-4">
            <div class="flex-1 min-w-0">
              <label class="form-label mb-1 block">Aula</label>
              <select class="form-select" [ngModel]="contextoId()" (ngModelChange)="seleccionarContexto($event)">
                @for (ctx of contextos(); track ctx.id) {
                  <option [value]="ctx.id">
                    {{ ctx.label }} — {{ ctx.alumnosCount }} alumno{{ ctx.alumnosCount === 1 ? '' : 's' }}
                  </option>
                }
              </select>
            </div>
            <div>
              <label class="form-label mb-1 block">Bimestre</label>
              <div class="flex flex-wrap gap-1.5">
                @for (b of bimestresLista; track b) {
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                    [disabled]="!bimestreConsultable(b)"
                    [title]="bimestreConsultable(b) ? (bimestreGenerable(b) ? 'Bimestre cerrado — acta generable' : 'Bimestre en curso o pendiente') : 'Bimestre aún no iniciado'"
                    [ngClass]="!bimestreConsultable(b)
                      ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                      : bimestreFiltro() === b
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : bimestreGenerable(b)
                          ? 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                          : 'bg-white text-gray-500 border-dashed border-gray-300 hover:border-indigo-200'"
                    (click)="seleccionarBimestre(b)">
                    B{{ b }}
                  </button>
                }
              </div>
            </div>
            <div class="w-full lg:w-48">
              <label class="form-label mb-1 block">Estado</label>
              <select class="form-select" [ngModel]="estadoFiltro()" (ngModelChange)="estadoFiltro.set($event); cargar()">
                @for (e of estados; track e.value) {
                  <option [value]="e.value">{{ e.label }}</option>
                }
              </select>
            </div>
          </div>
        }
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sección</th>
                <th>Bimestre</th>
                <th>Docente</th>
                <th class="text-center">Alumnos</th>
                <th class="text-center">Aprobados</th>
                <th class="text-center">Prom. aula</th>
                <th>Estado</th>
                <th>Generación</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @if (svc.loading()) {
                <tr><td colspan="9" class="py-12 text-center text-gray-400">Cargando actas...</td></tr>
              } @else {
                @for (a of actas(); track a.id) {
                  <tr>
                    <td>
                      <span class="badge text-[11px]" [ngClass]="nivelBadge(a.nivel)">{{ a.nivel }}</span>
                      <div class="font-medium text-gray-900 mt-1">{{ a.grado }} "{{ a.seccion }}"</div>
                      <div class="text-xs text-gray-400">{{ a.anio }}</div>
                    </td>
                    <td class="font-semibold text-indigo-600">{{ a.bimestre }}° Bim.</td>
                    <td class="text-sm text-gray-600">{{ a.docente }}</td>
                    <td class="text-center font-medium">{{ a.totalAlumnos }}</td>
                    <td class="text-center">
                      <span class="text-green-600 font-bold">{{ a.aprobados }}</span>
                      <span class="text-gray-300 mx-1">/</span>
                      <span class="text-red-500">{{ a.desaprobados }}</span>
                    </td>
                    <td class="text-center font-bold" [ngClass]="notaColor(a.promedioAula)">
                      {{ a.promedioAula ?? '—' }}
                    </td>
                    <td>
                      <span class="badge text-[11px]" [ngClass]="estadoBadge(a.estado)">
                        {{ estadoLabel(a.estado) }}
                      </span>
                    </td>
                    <td class="text-xs text-gray-500 whitespace-nowrap">{{ a.fechaGeneracion }}</td>
                    <td>
                      <div class="flex items-center gap-1 justify-center">
                        <button class="btn-icon text-indigo-500 hover:bg-indigo-50" title="Ver acta"
                          (click)="verDetalle(a.id)">
                          <span class="icon icon-sm">visibility</span>
                        </button>
                        @if (a.estado === 'generada' || a.estado === 'aprobada') {
                          <button class="btn-icon text-amber-600 hover:bg-amber-50" title="Regenerar acta"
                            (click)="regenerar(a)">
                            <span class="icon icon-sm">autorenew</span>
                          </button>
                        }
                        @if (a.estado === 'generada') {
                          <button class="btn-icon text-green-600 hover:bg-green-50" title="Aprobar"
                            (click)="aprobar(a.id)">
                            <span class="icon icon-sm">check_circle</span>
                          </button>
                        }
                        @if (a.estado === 'aprobada') {
                          <button class="btn-icon text-blue-600 hover:bg-blue-50" title="Cerrar acta"
                            (click)="cerrar(a.id)">
                            <span class="icon icon-sm">lock</span>
                          </button>
                        }
                        @if (a.estado !== 'cerrada') {
                          <button class="btn-icon text-rose-500 hover:bg-rose-50" title="Eliminar"
                            (click)="eliminar(a.id)">
                            <span class="icon icon-sm">delete</span>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="py-12 text-center">
                      <span class="icon icon-2xl text-gray-200 block mb-2">article</span>
                      <p class="text-gray-400 text-sm">No hay acta para este salón en el {{ bimestreFiltro() }}° bimestre</p>
                      @if (contextoActivo() && bimestreGenerable(bimestreFiltro())) {
                        <button class="btn btn-primary btn-sm mt-3" (click)="abrirGenerar()">Generar acta del bimestre</button>
                      } @else if (contextoActivo()) {
                        <p class="text-xs text-amber-600 mt-2">El bimestre aún no ha concluido — el acta se emite al cierre del periodo</p>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (modalGenerar()) {
      <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        (click)="modalGenerar.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b flex justify-between items-center">
            <h3 class="font-bold text-gray-900">Generar acta de evaluación</h3>
            <button class="btn-icon text-gray-400" (click)="modalGenerar.set(false)">
              <span class="icon">close</span>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            @if (contextoActivo(); as ctx) {
              <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-900">
                <strong>Salón {{ ctx.label }}</strong> · {{ ctx.alumnosCount }} alumnos · {{ form.bimestre }}° bimestre (cerrado)
              </div>
              <p class="text-xs text-gray-500">
                Se compilarán las notas finales de cada curso del grado para todos los alumnos del salón.
              </p>
            }
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Bimestre *</label>
                <select class="form-select mt-1" [(ngModel)]="form.bimestre">
                  @for (b of bimestresTerminados(); track b) {
                    <option [ngValue]="b">{{ b }}° Bimestre</option>
                  }
                </select>
              </div>
              <div>
                <label class="form-label">Año</label>
                <input class="form-input mt-1" [(ngModel)]="form.anio">
              </div>
            </div>
            <div>
              <label class="form-label">Docente titular</label>
              <input class="form-input mt-1" [(ngModel)]="form.docente" placeholder="Nombre del docente">
            </div>
            <div>
              <label class="form-label">Observaciones</label>
              <textarea class="form-input mt-1 min-h-16 resize-none" [(ngModel)]="form.observaciones"></textarea>
            </div>
            @if (errorForm()) {
              <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ errorForm() }}</div>
            }
          </div>
          <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
            <button class="btn btn-secondary" (click)="modalGenerar.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="generar()" [disabled]="svc.saving() || !contextoActivo()">
              {{ svc.saving() ? 'Generando...' : 'Generar acta' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (detalle(); as d) {
      <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" (click)="detalle.set(null)"></div>
      <div class="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 flex flex-col animate-slide-in-l">
        <div class="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <div>
            <h3 class="font-bold text-gray-900">Acta de evaluación — {{ d.grado }} "{{ d.seccion }}"</h3>
            <p class="text-xs text-gray-500">{{ d.nivel }} · {{ d.anio }} · {{ d.bimestre }}° bimestre · {{ d.docente }}</p>
            <p class="text-xs text-indigo-600 mt-0.5">Compilado de notas por alumno y por curso</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge" [ngClass]="estadoBadge(d.estado)">{{ estadoLabel(d.estado) }}</span>
            <button class="btn-icon text-gray-400" (click)="detalle.set(null)">
              <span class="icon">close</span>
            </button>
          </div>
        </div>

        <div class="px-6 py-3 bg-gray-50 border-b grid grid-cols-4 gap-3 text-center shrink-0">
          <div><p class="text-xs text-gray-400">Alumnos</p><p class="font-bold">{{ d.alumnos.length }}</p></div>
          <div><p class="text-xs text-gray-400">Aprobados</p><p class="font-bold text-green-600">{{ d.aprobados }}</p></div>
          <div><p class="text-xs text-gray-400">Desaprobados</p><p class="font-bold text-red-600">{{ d.desaprobados }}</p></div>
          <div><p class="text-xs text-gray-400">Prom. aula</p><p class="font-bold text-indigo-600">{{ d.promedioAula ?? '—' }}</p></div>
        </div>

        <div class="flex-1 overflow-auto px-6 py-4">
          <table class="data-table text-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Estudiante</th>
                @for (c of d.cursos; track c) {
                  <th class="text-center text-xs">{{ abrevCurso(c) }}</th>
                }
                <th class="text-center">Prom.</th>
                <th class="text-center">Nivel</th>
                <th class="text-center">Situación</th>
              </tr>
            </thead>
            <tbody>
              @for (al of d.alumnos; track $index) {
                <tr [class.bg-red-50]="al.situacion === 'desaprobado'">
                  <td class="text-gray-400">{{ $index + 1 }}</td>
                  <td class="font-medium">{{ al.estudiante }}</td>
                  @for (c of d.cursos; track c) {
                    <td class="text-center" [ngClass]="notaColor(al.notas[c])">{{ al.notas[c] ?? '—' }}</td>
                  }
                  <td class="text-center font-bold" [ngClass]="notaColor(al.promedio)">{{ al.promedio ?? '—' }}</td>
                  <td class="text-center">
                    @if (al.nivel) {
                      <span class="badge text-[10px]" [ngClass]="logroBadge(al.nivel)">{{ al.nivel }}</span>
                    }
                  </td>
                  <td class="text-center">
                    <span class="badge text-[10px]" [ngClass]="situacionBadge(al.situacion)">
                      {{ situacionLabel(al.situacion) }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (d.observaciones) {
            <div class="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-900">
              <strong>Observaciones:</strong> {{ d.observaciones }}
            </div>
          }
        </div>

        <div class="px-6 py-4 border-t bg-gray-50 flex gap-2 shrink-0">
          @if (d.estado === 'generada') {
            <button class="btn btn-primary flex-1" (click)="aprobar(d.id); detalle.set(null)">
              <span class="icon icon-sm">check_circle</span> Aprobar acta
            </button>
          }
          @if (d.estado === 'aprobada') {
            <button class="btn btn-primary flex-1" (click)="cerrar(d.id); detalle.set(null)">
              <span class="icon icon-sm">lock</span> Cerrar acta
            </button>
          }
          <button class="btn btn-secondary" (click)="detalle.set(null)">Cerrar vista</button>
        </div>
      </div>
    }

    @if (notificacion(); as n) {
      <div class="fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 z-[60] text-white"
        [ngClass]="n.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'">
        <span class="icon">{{ n.tipo === 'success' ? 'check_circle' : 'error' }}</span>
        {{ n.mensaje }}
      </div>
    }
  `,
})
export class ActasComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(ActasService);
  readonly notasSvc = inject(NotasRegistroService);

  readonly estados = ESTADOS_ACTA;
  readonly bimestresLista = [1, 2, 3, 4];
  readonly bimestresTerminados = signal<number[]>([]);
  readonly anioEscolar = signal(2026);

  readonly modalGenerar = signal(false);
  readonly detalle = signal<ActaDetail | null>(null);
  readonly errorForm = signal('');
  readonly notificacion = signal<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  readonly contextos = signal<RegistryContextItem[]>([]);
  readonly contextoId = signal('');
  readonly bimestreActual = signal(2);
  readonly bimestreFiltro = signal(2);
  readonly estadoFiltro = signal('');

  private readonly _actas = signal<ActaListItem[]>([]);
  readonly actas = this._actas.asReadonly();

  readonly contextoActivo = computed(() =>
    this.contextos().find(c => c.id === this.contextoId()) ?? null,
  );

  form = {
    bimestre: 2,
    anio: '2026',
    docente: '',
    observaciones: '',
  };

  readonly kpis = computed(() => {
    const list = this._actas();
    return [
      { label: 'Total actas', value: list.length, icon: 'article', bg: 'bg-indigo-100', color: 'text-indigo-600' },
      { label: 'Pendientes', value: list.filter(a => a.estado === 'generada').length, icon: 'pending', bg: 'bg-amber-100', color: 'text-amber-600' },
      { label: 'Aprobadas', value: list.filter(a => a.estado === 'aprobada').length, icon: 'check_circle', bg: 'bg-green-100', color: 'text-green-600' },
      { label: 'Cerradas', value: list.filter(a => a.estado === 'cerrada').length, icon: 'lock', bg: 'bg-gray-100', color: 'text-gray-600' },
    ];
  });

  ngOnInit(): void {
    this.layout.setTitle('Actas de Evaluación');
    this.svc.loadBimestres().subscribe({
      next: meta => {
        this.bimestreActual.set(meta.bimestreActual);
        this.bimestresTerminados.set(meta.bimestresTerminados);
        this.anioEscolar.set(meta.anioEscolar);
        if (meta.bimestresTerminados.length) {
          this.bimestreFiltro.set(meta.bimestresTerminados[meta.bimestresTerminados.length - 1]);
        }
        this.cargarContextos(true);
      },
      error: () => this.mostrarNotificacion('No se pudo cargar el calendario de bimestres', 'error'),
    });
  }

  bimestreConsultable(bimestre: number): boolean {
    return bimestre <= this.bimestreActual();
  }

  bimestreGenerable(bimestre: number): boolean {
    return this.bimestresTerminados().includes(bimestre);
  }

  seleccionarContexto(id: string): void {
    this.contextoId.set(id);
    this.cargar();
  }

  seleccionarBimestre(bimestre: number): void {
    if (!this.bimestreConsultable(bimestre)) return;
    this.bimestreFiltro.set(bimestre);
    this.cargar();
  }

  cargarContextos(inicial = false): void {
    this.notasSvc.loadContexts(this.bimestreFiltro()).subscribe({
      next: res => {
        this.bimestreActual.set(res.bimestreActual);
        this.contextos.set(res.contexts);
        if (!res.contexts.length) return;

        if (this.bimestreFiltro() > res.bimestreActual) {
          this.bimestreFiltro.set(res.bimestreActual);
        }

        const preferido =
          res.contexts.find(c => c.nivel === 'Primaria' && c.grado === '5°' && c.seccion === 'A') ??
          res.contexts[0];

        if (inicial || !this.contextoId()) {
          this.contextoId.set(preferido.id);
        }

        this.cargar();
      },
      error: () => this.mostrarNotificacion('No se pudieron cargar las aulas', 'error'),
    });
  }

  cargar(): void {
    const ctx = this.contextoActivo();
    if (!ctx) return;

    this.svc.load({
      nivel: ctx.nivel,
      grado: ctx.grado,
      seccion: ctx.seccion,
      bimestre: this.bimestreFiltro(),
      estado: this.estadoFiltro() || undefined,
    }).subscribe({
      next: items => this._actas.set(items),
      error: () => this.mostrarNotificacion('No se pudieron cargar las actas', 'error'),
    });
  }

  abrirGenerar(): void {
    const ctx = this.contextoActivo();
    if (!ctx) return;
    this.form = {
      bimestre: this.bimestreGenerable(this.bimestreFiltro())
        ? this.bimestreFiltro()
        : this.bimestresTerminados()[this.bimestresTerminados().length - 1] ?? 1,
      anio: String(this.anioEscolar()),
      docente: '',
      observaciones: '',
    };
    this.errorForm.set('');
    this.modalGenerar.set(true);
  }

  generar(): void {
    const ctx = this.contextoActivo();
    if (!ctx) {
      this.errorForm.set('Seleccione un aula');
      return;
    }
    if (!this.bimestreGenerable(this.form.bimestre)) {
      this.errorForm.set(`El ${this.form.bimestre}° bimestre aún no ha concluido`);
      return;
    }

    this.errorForm.set('');
    this.svc.generate({
      nivel: ctx.nivel,
      grado: ctx.grado,
      seccion: ctx.seccion,
      bimestre: this.form.bimestre,
      anio: this.form.anio,
      docente: this.form.docente.trim() || undefined,
      observaciones: this.form.observaciones.trim() || undefined,
    }).subscribe({
      next: acta => {
        this.modalGenerar.set(false);
        this.cargar();
        this.verDetalle(acta.id);
        this.mostrarNotificacion('Acta generada correctamente');
      },
      error: err => {
        const msg = err?.error?.message;
        this.errorForm.set(Array.isArray(msg) ? msg.join(', ') : msg ?? 'No se pudo generar el acta');
      },
    });
  }

  verDetalle(id: number): void {
    this.svc.getById(id).subscribe({
      next: d => {
        if (d.bimestreActual) this.bimestreActual.set(d.bimestreActual);
        if (d.bimestresTerminados) this.bimestresTerminados.set(d.bimestresTerminados);
        this.detalle.set(d);
      },
      error: () => this.mostrarNotificacion('No se pudo cargar el detalle', 'error'),
    });
  }

  regenerar(acta: ActaListItem): void {
    if (!confirm(`¿Regenerar el acta del ${acta.bimestre}° bimestre? Se actualizará el compilado con todos los alumnos del salón.`)) return;
    this.svc.generate({
      nivel: acta.nivel,
      grado: acta.grado,
      seccion: acta.seccion,
      bimestre: acta.bimestre,
      anio: acta.anio,
      docente: acta.docente || undefined,
    }).subscribe({
      next: updated => {
        this.cargar();
        this.verDetalle(updated.id);
        this.mostrarNotificacion('Acta regenerada con el listado completo del salón');
      },
      error: err => {
        const msg = err?.error?.message;
        this.mostrarNotificacion(Array.isArray(msg) ? msg.join(', ') : msg ?? 'No se pudo regenerar', 'error');
      },
    });
  }

  aprobar(id: number): void {
    if (!confirm('¿Aprobar esta acta de evaluación?')) return;
    this.svc.approve(id, 'Dirección').subscribe({
      next: () => {
        this.cargar();
        this.mostrarNotificacion('Acta aprobada');
      },
      error: () => this.mostrarNotificacion('No se pudo aprobar', 'error'),
    });
  }

  cerrar(id: number): void {
    if (!confirm('¿Cerrar el acta? No podrá modificarse.')) return;
    this.svc.close(id).subscribe({
      next: () => {
        this.cargar();
        this.mostrarNotificacion('Acta cerrada');
      },
      error: () => this.mostrarNotificacion('No se pudo cerrar', 'error'),
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar esta acta?')) return;
    this.svc.delete(id).subscribe({
      next: () => {
        this.cargar();
        this.mostrarNotificacion('Acta eliminada');
      },
      error: () => this.mostrarNotificacion('No se pudo eliminar', 'error'),
    });
  }

  abrevCurso(nombre: string): string {
    return nombre.length > 12 ? nombre.slice(0, 10) + '…' : nombre;
  }

  nivelBadge(nivel: string): string {
    return { Inicial: 'badge-purple', Primaria: 'badge-blue', Secundaria: 'badge-indigo' }[nivel] ?? 'badge-gray';
  }

  estadoBadge(e: ActaEstado): string {
    return { borrador: 'badge-gray', generada: 'badge-yellow', aprobada: 'badge-green', cerrada: 'badge-indigo' }[e];
  }

  estadoLabel(e: ActaEstado): string {
    return { borrador: 'Borrador', generada: 'Generada', aprobada: 'Aprobada', cerrada: 'Cerrada' }[e];
  }

  logroBadge(n: string): string {
    return { AD: 'badge-indigo', A: 'badge-green', B: 'badge-yellow', C: 'badge-red' }[n] ?? 'badge-gray';
  }

  situacionBadge(s: string): string {
    return { aprobado: 'badge-green', desaprobado: 'badge-red', sin_notas: 'badge-gray' }[s] ?? 'badge-gray';
  }

  situacionLabel(s: string): string {
    return { aprobado: 'Aprobado', desaprobado: 'Desaprobado', sin_notas: 'Sin notas' }[s] ?? s;
  }

  notaColor(nota: number | null | undefined): string {
    if (nota == null) return 'text-gray-300';
    if (nota >= 14) return 'text-green-600';
    if (nota >= 11) return 'text-amber-600';
    return 'text-red-600';
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' = 'success'): void {
    this.notificacion.set({ mensaje, tipo });
    setTimeout(() => this.notificacion.set(null), 3000);
  }
}
