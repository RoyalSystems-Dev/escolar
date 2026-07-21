import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { NotasRegistroService } from '../notas/notas-registro.service';
import { RegistryContextItem } from '../notas/notas-registro.model';
import { PromediosService } from './promedios.service';
import {
  AlumnoPromedio,
  BIMESTRES,
  CursoPromedio,
  NivelLogro,
  NIVELES_LOGRO,
  PromediosResumen,
} from './promedios.model';

@Component({
  selector: 'app-promedios',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-gray-800">Cálculo de Promedios</h2>
          <p class="text-sm text-gray-400 mt-0.5">
            Promedios ponderados según la fórmula de evaluación — misma lógica que el registro de notas
          </p>
          <p class="text-xs text-gray-400 mt-1">
            Datos desde tabla <span class="font-mono">grades</span> · API
            <span class="font-mono">/grades/averages</span>
          </p>
          @if (bimestreActual()) {
            <p class="text-xs text-amber-600 mt-1">
              Periodo actual: {{ bimestreActual() }}° bimestre — solo B1 a B{{ bimestreActual() }} con datos
            </p>
          }
        </div>
      </div>

      @if (error()) {
        <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{{ error() }}</div>
      }

      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        @for (kpi of kpis(); track kpi.label) {
          <div class="card p-4 flex items-center gap-3" [ngClass]="kpi.border ?? ''">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" [ngClass]="kpi.bg">
              <span class="icon" [ngClass]="kpi.color">{{ kpi.icon }}</span>
            </div>
            <div>
              <p class="text-xs text-gray-400">{{ kpi.label }}</p>
              <p class="text-xl font-bold" [ngClass]="kpi.text ?? 'text-gray-900'">{{ kpi.value }}</p>
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
                    [disabled]="!bimestrePermitido(b)"
                    [title]="bimestrePermitido(b) ? '' : 'Bimestre aún no habilitado'"
                    [ngClass]="!bimestrePermitido(b)
                      ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                      : bimestreVista() === b
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'"
                    (click)="seleccionarBimestre(b)">
                    B{{ b }}
                  </button>
                }
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <label class="form-label mb-1 block">Buscar alumno</label>
              <div class="relative">
                <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                <input class="form-input pl-10" placeholder="Nombre..."
                  [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event); cargar()">
              </div>
            </div>
          </div>

          @if (contextoActivo(); as ctx) {
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <label class="form-label mb-0">Vista</label>
                <span class="text-xs text-gray-400">
                  {{ esResumen() ? 'Todos los cursos · B' + bimestreVista() : filtroCurso() }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors"
                  [ngClass]="esResumen()
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-medium'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'"
                  (click)="seleccionarCurso('')">
                  Resumen general
                </button>
                @for (c of ctx.cursos; track c.nombre) {
                  <button type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors"
                    [ngClass]="filtroCurso() === c.nombre
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-medium'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'"
                    (click)="seleccionarCurso(c.nombre)">
                    {{ c.nombre }}
                  </button>
                }
              </div>
            </div>
          }
        }
      </div>

      @if (esResumen()) {
        <div class="card overflow-hidden">
          <div class="px-4 py-3 border-b bg-gray-50">
            <h3 class="font-semibold text-gray-800">Promedio B{{ bimestreVista() }} por curso</h3>
            <p class="text-xs text-gray-500">Ponderado por componentes de la fórmula de evaluación</p>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  @for (c of cursosColumnas(); track c) {
                    <th class="text-center text-xs">{{ c }}</th>
                  }
                  <th class="text-center">Prom. B{{ bimestreVista() }}</th>
                  <th class="text-center">Nivel</th>
                </tr>
              </thead>
              <tbody>
                @if (svc.loading()) {
                  <tr><td [attr.colspan]="4 + cursosColumnas().length" class="py-12 text-center text-gray-400">Calculando...</td></tr>
                } @else {
                  @for (a of alumnos(); track a.studentId; let i = $index) {
                    <tr>
                      <td class="text-xs text-gray-400">{{ i + 1 }}</td>
                      <td class="font-medium">{{ a.estudiante }}</td>
                      @for (c of cursosColumnas(); track c) {
                        <td class="text-center text-sm" [ngClass]="notaColor(cursoBimestre(a, c, bimestreVista()))">
                          {{ cursoBimestre(a, c, bimestreVista()) ?? '—' }}
                        </td>
                      }
                      <td class="text-center font-bold" [ngClass]="notaColor(promedioBimestreAlumno(a))">
                        {{ promedioBimestreAlumno(a) ?? '—' }}
                      </td>
                      <td class="text-center">
                        @if (nivelBimestreAlumno(a); as n) {
                          <span class="badge text-[11px]" [ngClass]="logroBadge(n)">{{ n }}</span>
                        } @else {
                          <span class="text-gray-300">—</span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td [attr.colspan]="4 + cursosColumnas().length" class="py-12 text-center text-gray-400">
                        Sin datos para esta aula
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else if (filtroCurso()) {
        <div class="card overflow-hidden">
          <div class="px-4 py-3 border-b bg-gray-50">
            <h3 class="font-semibold text-gray-800">{{ filtroCurso() }}</h3>
            <p class="text-xs text-gray-500">
              Evolución por bimestre · Promedio parcial = media de B1 a B{{ bimestreActual() }}
            </p>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  @for (b of bimestres; track b.key) {
                    <th class="text-center" [class.text-gray-300]="!bimestrePermitido(b.num)">
                      {{ b.label }}
                    </th>
                  }
                  <th class="text-center">Prom. parcial</th>
                  <th class="text-center">Nivel</th>
                </tr>
              </thead>
              <tbody>
                @if (svc.loading()) {
                  <tr><td colspan="9" class="py-12 text-center text-gray-400">Calculando...</td></tr>
                } @else {
                  @for (a of alumnos(); track a.studentId; let i = $index) {
                    @let curso = cursoData(a);
                    <tr>
                      <td class="text-xs text-gray-400">{{ i + 1 }}</td>
                      <td class="font-medium">{{ a.estudiante }}</td>
                      @for (b of bimestres; track b.key) {
                        <td class="text-center font-medium"
                          [ngClass]="bimestrePermitido(b.num)
                            ? notaColor(curso?.[b.key] ?? null)
                            : 'text-gray-200'">
                          {{ bimestrePermitido(b.num) ? (curso?.[b.key] ?? '—') : '—' }}
                        </td>
                      }
                      <td class="text-center font-bold" [ngClass]="notaColor(curso?.promedioAnual ?? null)">
                        {{ curso?.promedioAnual ?? '—' }}
                      </td>
                      <td class="text-center">
                        @if (curso?.nivel; as nivelCurso) {
                          <span class="badge text-[11px]" [ngClass]="logroBadge(nivelCurso)">{{ nivelCurso }}</span>
                        } @else {
                          <span class="text-gray-300">—</span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="9" class="py-12 text-center text-gray-400">Sin datos para este curso</td></tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
        @for (n of nivelesLogro; track n.nivel) {
          <div class="flex items-center gap-2 text-xs text-gray-600">
            <span class="badge text-[10px]" [ngClass]="n.badge">{{ n.nivel }}</span>
            <span>{{ n.label }} (≥ {{ n.min === 0 ? '0' : n.min }})</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class PromediosComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(PromediosService);
  readonly notasSvc = inject(NotasRegistroService);

  readonly bimestres = BIMESTRES;
  readonly bimestresLista = [1, 2, 3, 4];
  readonly nivelesLogro = NIVELES_LOGRO;

  readonly contextos = signal<RegistryContextItem[]>([]);
  readonly contextoId = signal('');
  readonly bimestreActual = signal(2);
  readonly bimestreVista = signal(2);
  readonly filtroCurso = signal('');
  readonly busqueda = signal('');
  readonly error = signal('');

  private readonly _alumnos = signal<AlumnoPromedio[]>([]);
  private readonly _resumen = signal<PromediosResumen | null>(null);

  readonly alumnos = this._alumnos.asReadonly();

  readonly contextoActivo = computed(() =>
    this.contextos().find(c => c.id === this.contextoId()) ?? null,
  );

  readonly esResumen = computed(() => !this.filtroCurso());

  readonly cursosColumnas = computed(() => {
    const ctx = this.contextoActivo();
    if (ctx?.cursos.length) return ctx.cursos.map(c => c.nombre);
    const set = new Set<string>();
    for (const a of this._alumnos()) {
      for (const c of a.cursos) set.add(c.curso);
    }
    return [...set].sort();
  });

  readonly kpis = computed(() => {
    const r = this._resumen();
    return [
      { label: 'Alumnos', value: r?.totalAlumnos ?? 0, icon: 'groups', bg: 'bg-indigo-100', color: 'text-indigo-600' },
      { label: 'Promedio del aula', value: r?.promedioAula != null ? r.promedioAula.toFixed(1) : '—', icon: 'calculate', bg: 'bg-blue-100', color: 'text-blue-600', text: 'text-blue-700' },
      { label: 'Aprobados', value: r?.aprobados ?? 0, icon: 'check_circle', bg: 'bg-green-100', color: 'text-green-600', text: 'text-green-700', border: 'border-l-4 border-green-400' },
      { label: 'En riesgo', value: r?.enRiesgo ?? 0, icon: 'warning', bg: 'bg-red-100', color: 'text-red-600', text: 'text-red-700', border: 'border-l-4 border-red-400' },
      { label: 'Destacados', value: r?.destacados ?? 0, icon: 'star', bg: 'bg-purple-100', color: 'text-purple-600', text: 'text-purple-700' },
    ];
  });

  ngOnInit(): void {
    this.layout.setTitle('Cálculo de Promedios');
    this.cargarContextos(true);
  }

  bimestrePermitido(bimestre: number): boolean {
    return bimestre <= this.bimestreActual();
  }

  seleccionarContexto(id: string): void {
    const ctx = this.contextos().find(c => c.id === id);
    if (!ctx) return;
    this.contextoId.set(id);
    this.cargar();
  }

  seleccionarBimestre(bimestre: number): void {
    if (!this.bimestrePermitido(bimestre)) return;
    this.bimestreVista.set(bimestre);
    if (this.esResumen()) {
      this.cargar();
    }
  }

  seleccionarCurso(curso: string): void {
    this.filtroCurso.set(curso);
    this.cargar();
  }

  cargarContextos(inicial = false): void {
    this.notasSvc.loadContexts(this.bimestreVista()).subscribe({
      next: res => {
        this.bimestreActual.set(res.bimestreActual);
        this.contextos.set(res.contexts);
        if (!res.contexts.length) return;

        if (this.bimestreVista() > res.bimestreActual) {
          this.bimestreVista.set(res.bimestreActual);
        }

        const preferido =
          res.contexts.find(c => c.nivel === 'Primaria' && c.grado === '5°' && c.seccion === 'A') ??
          res.contexts[0];

        if (inicial || !this.contextoId()) {
          this.contextoId.set(preferido.id);
        }

        this.cargar();
      },
      error: err =>
        this.error.set(err?.error?.message ?? err?.message ?? 'No se pudieron cargar las aulas'),
    });
  }

  cargar(): void {
    const ctx = this.contextoActivo();
    if (!ctx) return;

    this.error.set('');
    this.svc.load({
      nivel: ctx.nivel,
      grado: ctx.grado,
      seccion: ctx.seccion,
      curso: this.filtroCurso() || undefined,
      busqueda: this.busqueda() || undefined,
    }).subscribe({
      next: res => {
        this.bimestreActual.set(res.bimestreActual);
        this._alumnos.set(res.alumnos);
        this._resumen.set(res.resumen);
      },
      error: err => {
        this.error.set(err?.error?.message ?? err?.message ?? 'No se pudieron calcular promedios');
        this._alumnos.set([]);
        this._resumen.set(null);
      },
    });
  }

  cursoBimestre(alumno: AlumnoPromedio, curso: string, bimestre: number): number | null {
    const data = alumno.cursos.find(c => c.curso === curso);
    if (!data) return null;
    const key = `b${bimestre}` as keyof CursoPromedio;
    const val = data[key];
    return typeof val === 'number' ? val : null;
  }

  promedioBimestreAlumno(alumno: AlumnoPromedio): number | null {
    const b = this.bimestreVista();
    const vals = this.cursosColumnas()
      .map(c => this.cursoBimestre(alumno, c, b))
      .filter((v): v is number => v !== null);
    if (!vals.length) return null;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
  }

  nivelBimestreAlumno(alumno: AlumnoPromedio): NivelLogro | null {
    const p = this.promedioBimestreAlumno(alumno);
    if (p === null) return null;
    if (p >= 17.5) return 'AD';
    if (p >= 14) return 'A';
    if (p >= 11) return 'B';
    return 'C';
  }

  cursoData(alumno: AlumnoPromedio): CursoPromedio | undefined {
    return alumno.cursos.find(c => c.curso === this.filtroCurso());
  }

  notaColor(nota: number | null | undefined): string {
    if (nota == null) return 'text-gray-300';
    if (nota >= 14) return 'text-green-600';
    if (nota >= 11) return 'text-amber-600';
    return 'text-red-600';
  }

  logroBadge(n: NivelLogro): string {
    return NIVELES_LOGRO.find(x => x.nivel === n)?.badge ?? 'badge-gray';
  }
}
