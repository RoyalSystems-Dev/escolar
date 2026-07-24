import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { GradingConfigService } from '../../../core/grading/grading-config.service';
import { NotasEstudianteService } from '../../evaluacion/notas/services/notas-estudiante.service';
import { CursoNotasEstudiante, NotaItem } from '../../evaluacion/notas/models/nota.model';

@Component({
  standalone: true,
  imports: [NgClass, DecimalPipe],
  template: `
<div class="space-y-5 animate-fade-in">

  <!-- Header -->
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Mis Notas</h2>
      <p class="text-sm text-gray-500 mt-0.5">
        {{ auth.nombreCompleto() }} · {{ perfil().aulaLabel }} · A.E. {{ svc.anioEscolar }}
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      @if (svc.bimestreActual()) {
        <span class="text-xs text-gray-400 hidden sm:inline">
          Periodo actual: {{ svc.bimestreActual() }}° bimestre
        </span>
      }
      <span class="text-xs text-gray-500 mr-1">Bimestre:</span>
      <div class="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
        <button
          class="px-3 py-1.5 text-sm font-medium rounded-md transition-all"
          [ngClass]="bimestreFiltro() === null ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'"
          (click)="bimestreFiltro.set(null)">
          Todos
        </button>
        @for (b of [1, 2, 3, 4]; track b) {
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-all w-9 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-400"
            [disabled]="!svc.bimestrePermitido(b)"
            [title]="svc.bimestrePermitido(b) ? '' : 'Bimestre aún no habilitado'"
            [ngClass]="!svc.bimestrePermitido(b)
              ? 'text-gray-300'
              : bimestreFiltro() === b
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'"
            (click)="seleccionarBimestre(b)">
            {{ b }}
          </button>
        }
      </div>
    </div>
  </div>

  <!-- Resumen -->
  <div class="card p-4 flex flex-wrap items-center gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
        <span class="icon text-emerald-600">grade</span>
      </div>
      <div>
        <div class="text-sm font-semibold text-gray-800">Promedio general</div>
        <div class="text-xs text-gray-500">{{ cursos().length }} cursos matriculados</div>
      </div>
    </div>
    <div class="h-8 w-px bg-gray-200 hidden sm:block"></div>
    <div class="flex items-center gap-3">
      @if (promedioGeneral() > 0) {
        <span class="text-3xl font-bold" [ngClass]="svc.notaColor(promedioGeneral())">
          {{ promedioGeneral() | number:'1.1-1' }}
        </span>
        <span class="badge" [ngClass]="svc.nivelBadge(nivelGeneral())">{{ nivelGeneral() }}</span>
      } @else {
        <span class="text-sm text-gray-400">Sin notas en este bimestre</span>
      }
    </div>
  </div>

  <!-- Listado de cursos -->
  <div class="space-y-4">
    @for (curso of cursos(); track curso.id) {
      @let prom = promedioCurso(curso);
      @let expandido = cursoExpandido() === curso.id;
      <div class="card overflow-hidden">
        <!-- Cabecera del curso -->
        <button
          type="button"
          class="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
          (click)="toggleCurso(curso.id)">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border"
            [ngClass]="curso.colorClass">
            {{ curso.emoji }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-gray-800">{{ curso.nombre }}</div>
            <div class="text-xs text-gray-500">{{ curso.area }} · Docente: {{ curso.docenteAbrev }}</div>
          </div>
          <div class="text-right shrink-0 mr-2">
            @if (prom > 0) {
              <div class="text-lg font-bold" [ngClass]="svc.notaColor(prom)">{{ prom | number:'1.1-1' }}</div>
              <div class="text-[10px] text-gray-400">Promedio</div>
            } @else {
              <div class="text-sm text-gray-300">—</div>
            }
          </div>
          <span class="icon text-gray-400 transition-transform" [class.rotate-180]="expandido">expand_more</span>
        </button>

        @if (expandido) {
          <div class="border-t border-gray-100 px-4 pb-4 pt-2 space-y-4 animate-fade-in">
            @if (prom === 0) {
              <p class="text-sm text-gray-400 text-center py-4">Sin notas registradas para este bimestre</p>
            } @else {
              <!-- Controles diarios -->
              @if (filtrar(curso.controlesDiarios).length) {
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="icon text-sm text-gray-400">edit_note</span>
                    <h4 class="text-sm font-semibold text-gray-700">Controles diarios</h4>
                    <span class="badge badge-gray text-[10px]">{{ filtrar(curso.controlesDiarios).length }}</span>
                  </div>
                  <div class="overflow-x-auto rounded-lg border border-gray-100">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-gray-50 text-xs text-gray-500">
                          <th class="text-left px-3 py-2 font-medium">Descripción</th>
                          <th class="text-center px-3 py-2 font-medium w-28">Fecha</th>
                          <th class="text-center px-3 py-2 font-medium w-20">Bim.</th>
                          <th class="text-center px-3 py-2 font-medium w-20">Nota</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-50">
                        @for (item of filtrar(curso.controlesDiarios); track item.id) {
                          <tr class="hover:bg-gray-50/50">
                            <td class="px-3 py-2 text-gray-700">{{ item.descripcion }}</td>
                            <td class="px-3 py-2 text-center text-gray-500 text-xs">{{ svc.formatFecha(item.fecha) }}</td>
                            <td class="px-3 py-2 text-center text-gray-400 text-xs">{{ item.bimestre }}</td>
                            <td class="px-3 py-2 text-center font-bold" [ngClass]="svc.notaColor(item.nota)">{{ item.nota }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              <!-- Parciales -->
              @if (filtrar(curso.parciales).length) {
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="icon text-sm text-blue-400">assignment</span>
                    <h4 class="text-sm font-semibold text-gray-700">Parciales</h4>
                    <span class="badge badge-blue text-[10px]">{{ filtrar(curso.parciales).length }}</span>
                  </div>
                  <div class="overflow-x-auto rounded-lg border border-gray-100">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-gray-50 text-xs text-gray-500">
                          <th class="text-left px-3 py-2 font-medium">Descripción</th>
                          <th class="text-center px-3 py-2 font-medium w-28">Fecha</th>
                          <th class="text-center px-3 py-2 font-medium w-20">Bim.</th>
                          <th class="text-center px-3 py-2 font-medium w-20">Nota</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-50">
                        @for (item of filtrar(curso.parciales); track item.id) {
                          <tr class="hover:bg-gray-50/50">
                            <td class="px-3 py-2 text-gray-700">{{ item.descripcion }}</td>
                            <td class="px-3 py-2 text-center text-gray-500 text-xs">{{ svc.formatFecha(item.fecha) }}</td>
                            <td class="px-3 py-2 text-center text-gray-400 text-xs">{{ item.bimestre }}</td>
                            <td class="px-3 py-2 text-center font-bold" [ngClass]="svc.notaColor(item.nota)">{{ item.nota }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              <!-- Finales -->
              @if (filtrar(curso.finales).length) {
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="icon text-sm text-purple-400">school</span>
                    <h4 class="text-sm font-semibold text-gray-700">Finales</h4>
                    <span class="badge badge-purple text-[10px]">{{ filtrar(curso.finales).length }}</span>
                  </div>
                  <div class="overflow-x-auto rounded-lg border border-gray-100">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-gray-50 text-xs text-gray-500">
                          <th class="text-left px-3 py-2 font-medium">Descripción</th>
                          <th class="text-center px-3 py-2 font-medium w-28">Fecha</th>
                          <th class="text-center px-3 py-2 font-medium w-20">Bim.</th>
                          <th class="text-center px-3 py-2 font-medium w-20">Nota</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-50">
                        @for (item of filtrar(curso.finales); track item.id) {
                          <tr class="hover:bg-gray-50/50">
                            <td class="px-3 py-2 text-gray-700">{{ item.descripcion }}</td>
                            <td class="px-3 py-2 text-center text-gray-500 text-xs">{{ svc.formatFecha(item.fecha) }}</td>
                            <td class="px-3 py-2 text-center text-gray-400 text-xs">{{ item.bimestre }}</td>
                            <td class="px-3 py-2 text-center font-bold" [ngClass]="svc.notaColor(item.nota)">{{ item.nota }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            }
          </div>
        }
      </div>
    }
  </div>

  <!-- Leyenda -->
  <div class="card p-3">
    <div class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Escala de calificación vigente</div>
    <div class="flex flex-wrap gap-2">
      @for (n of nivelesLeyenda(); track n.codigo) {
        <div class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border" [ngClass]="n.colorClass">
          <span class="font-bold">{{ n.codigo }}</span>
          {{ n.label }}
          <span class="text-gray-400">({{ n.rango }})</span>
        </div>
      }
    </div>
  </div>

</div>
  `,
})
export class NotasEstudianteComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly auth = inject(AuthService);
  readonly svc = inject(NotasEstudianteService);
  readonly grading = inject(GradingConfigService);

  readonly nivelesLeyenda = computed(() => {
    const e = this.grading.escala();
    const max = this.grading.notaMaxima();
    const min = this.grading.notaMinima();
    return [
      { codigo: 'AD', label: 'Logro Destacado', rango: `${e.AD}–${max}`, colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      { codigo: 'A', label: 'Logro Esperado', rango: `${e.A}–${(e.AD - 0.1).toFixed(1)}`, colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      { codigo: 'B', label: 'En Proceso', rango: `${e.B}–${(e.A - 0.1).toFixed(1)}`, colorClass: 'bg-amber-100 text-amber-800 border-amber-200' },
      { codigo: 'C', label: 'En Inicio', rango: `0–${(e.B - 0.1).toFixed(1)}`, colorClass: 'bg-red-100 text-red-800 border-red-200' },
    ];
  });

  bimestreFiltro = signal<number | null>(null);
  cursoExpandido = signal<number | null>(null);
  private filtroInicializado = false;

  perfil = computed(() => this.svc.getPerfil());
  cursos = this.svc.cursos;

  promedioGeneral = computed(() =>
    this.svc.promedioGeneral(this.cursos(), this.bimestreFiltro()),
  );

  nivelGeneral = computed(() => this.svc.nivelDesdeNota(this.promedioGeneral()));

  private readonly syncDesdeServicio = effect(() => {
    const actual = this.svc.bimestreActual();
    const cursos = this.svc.cursos();
    if (this.svc.loading()) return;

    const filtro = this.bimestreFiltro();
    if (filtro !== null && filtro > actual) {
      this.bimestreFiltro.set(actual);
    } else if (!this.filtroInicializado && actual > 0) {
      this.bimestreFiltro.set(actual);
      this.filtroInicializado = true;
    }

    if (cursos.length && this.cursoExpandido() === null) {
      this.cursoExpandido.set(cursos[0].id);
    }
  });

  ngOnInit(): void {
    this.layout.setTitle('Mis Notas');
    this.svc.load();
  }

  seleccionarBimestre(bimestre: number): void {
    if (!this.svc.bimestrePermitido(bimestre)) return;
    this.bimestreFiltro.set(bimestre);
  }

  filtrar(items: NotaItem[]): NotaItem[] {
    return this.svc.notasPorBimestre(items, this.bimestreFiltro());
  }

  promedioCurso(curso: CursoNotasEstudiante): number {
    return this.svc.promedioCurso(curso, this.bimestreFiltro());
  }

  toggleCurso(id: number): void {
    this.cursoExpandido.update((actual) => (actual === id ? null : id));
  }
}
