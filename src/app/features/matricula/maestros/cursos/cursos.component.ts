import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MaestrosCursosService } from './cursos.service';
import {
  CreateMaestroCursoPayload,
  MaestroCursoItem,
  NivelMaestroCurso,
} from './cursos.model';

const G_INI = ['3 años', '4 años', '5 años'];
const G_PRI = ['1°', '2°', '3°', '4°', '5°', '6°'];
const G_SEC = ['1°', '2°', '3°', '4°', '5°'];

@Component({
  selector: 'app-maestros-cursos',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
<div class="space-y-4">

  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h3 class="text-lg font-bold text-gray-900">Cursos</h3>
      <p class="text-sm text-gray-400 mt-0.5">
        Catálogo maestro de cursos para armar currículas en Académico
      </p>
    </div>
    <button class="btn btn-primary btn-sm" (click)="abrirModal()">
      <span class="icon icon-sm">add</span> Nuevo curso
    </button>
  </div>

  <div class="card p-4 flex flex-wrap items-end gap-3">
    <div>
      <label class="text-xs text-gray-500 font-medium">Nivel</label>
      <select class="input mt-1 w-40" [(ngModel)]="filtroNivel" (ngModelChange)="onFiltroChange()">
        <option value="">Todos</option>
        <option value="Inicial">Inicial</option>
        <option value="Primaria">Primaria</option>
        <option value="Secundaria">Secundaria</option>
      </select>
    </div>
    <div>
      <label class="text-xs text-gray-500 font-medium">Área</label>
      <input class="input mt-1 w-48" [(ngModel)]="filtroArea" (ngModelChange)="onFiltroChange()" placeholder="Filtrar área..." />
    </div>
    <p class="text-xs text-gray-400 ml-auto">{{ total() }} curso(s)</p>
  </div>

  @if (error()) {
    <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{{ error() }}</div>
  }

  <div class="card overflow-hidden">
    @if (svc.loading()) {
      <div class="p-10 text-center text-gray-400 animate-pulse">Cargando cursos...</div>
    } @else if (!cursos().length) {
      <div class="p-10 text-center text-gray-500">No hay cursos en el catálogo.</div>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Curso</th>
              <th class="px-4 py-3 text-left">Área</th>
              <th class="px-4 py-3 text-left">Nivel</th>
              <th class="px-4 py-3 text-center">Horas/sem</th>
              <th class="px-4 py-3 text-left">Grados</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (c of cursos(); track c.id) {
              <tr class="hover:bg-gray-50/80">
                <td class="px-4 py-3 font-medium text-gray-800">{{ c.nombre }}</td>
                <td class="px-4 py-3 text-gray-600">{{ c.area }}</td>
                <td class="px-4 py-3">
                  <span class="badge badge-indigo text-[10px]">{{ c.nivel }}</span>
                </td>
                <td class="px-4 py-3 text-center font-semibold text-indigo-700">{{ c.horasSemanales }}h</td>
                <td class="px-4 py-3 text-xs text-gray-500 max-w-[220px] truncate" [title]="c.grados.join(', ')">
                  {{ c.grados.join(', ') }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button type="button" class="btn btn-secondary btn-sm mr-1" (click)="$event.stopPropagation(); abrirModal(c)">Editar</button>
                  <button class="btn btn-ghost btn-sm text-red-500" (click)="desactivar(c)">Desactivar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPaginas() > 1) {
        <div class="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <span>
            Mostrando {{ inicio() + 1 }}–{{ fin() }} de {{ total() }}
          </span>
          <div class="flex items-center gap-1">
            <button type="button" class="btn btn-icon btn-sm" [disabled]="paginaActual() === 1" (click)="irPagina(paginaActual() - 1)">
              ‹
            </button>
            @for (p of paginas(); track p) {
              <button type="button" class="w-8 h-8 rounded-lg text-xs font-medium"
                [ngClass]="p === paginaActual() ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                (click)="irPagina(p)">{{ p }}</button>
            }
            <button type="button" class="btn btn-icon btn-sm" [disabled]="paginaActual() === totalPaginas()" (click)="irPagina(paginaActual() + 1)">
              ›
            </button>
          </div>
        </div>
      }
    }
  </div>

  @if (modalOpen()) {
    <div class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" (click)="cerrarModal()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-in" (click)="$event.stopPropagation()">
        <h2 class="text-lg font-bold text-gray-900">{{ editId() ? 'Editar curso' : 'Nuevo curso' }}</h2>

        <div>
          <label class="form-label">Nombre</label>
          <input class="form-input w-full" [(ngModel)]="formNombre" />
        </div>
        <div>
          <label class="form-label">Área curricular</label>
          <input class="form-input w-full" [(ngModel)]="formArea" placeholder="Ej. Comunicación" />
        </div>
        <div>
          <label class="form-label">Nivel</label>
          <select class="form-input w-full" [(ngModel)]="formNivel" (ngModelChange)="onNivelChange()">
            <option value="Inicial">Inicial</option>
            <option value="Primaria">Primaria</option>
            <option value="Secundaria">Secundaria</option>
          </select>
        </div>
        <div>
          <label class="form-label">Horas semanales</label>
          <input type="number" min="0" max="40" class="form-input w-full" [(ngModel)]="formHoras" />
        </div>
        <div>
          <label class="form-label">Grados</label>
          <div class="flex flex-wrap gap-2 mt-1">
            @for (g of gradosDisponibles(); track g) {
              <button type="button" class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all"
                [ngClass]="formGrados.includes(g) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'"
                (click)="toggleGrado(g)">
                {{ g }}
              </button>
            }
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button class="btn btn-secondary flex-1" (click)="cerrarModal()">Cancelar</button>
          <button class="btn btn-primary flex-1" (click)="guardar()" [disabled]="!puedeGuardar() || svc.saving()">
            {{ editId() ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </div>
    </div>
  }

  @if (toast()) {
    <div class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-sm"
      [ngClass]="toast()!.type === 'success' ? 'bg-green-600' : 'bg-red-600'">
      {{ toast()!.msg }}
    </div>
  }
</div>
  `,
})
export class MaestrosCursosComponent implements OnInit {
  readonly svc = inject(MaestrosCursosService);
  readonly POR_PAGINA = 10;

  readonly cursos = signal<MaestroCursoItem[]>([]);
  readonly total = signal(0);
  paginaActual = signal(1);
  totalPaginas = signal(1);
  readonly modalOpen = signal(false);
  readonly editId = signal<number | null>(null);
  readonly error = signal('');
  readonly toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  filtroNivel = '';
  filtroArea = '';
  formNombre = '';
  formArea = '';
  formNivel: NivelMaestroCurso = 'Primaria';
  formHoras = 1;
  formGrados: string[] = [];

  readonly gradosDisponibles = computed(() => this.gradosParaNivel(this.formNivel));

  readonly inicio = computed(() => (this.paginaActual() - 1) * this.POR_PAGINA);
  readonly fin = computed(() => Math.min(this.inicio() + this.cursos().length, this.total()));
  readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const pages: number[] = [];
    const start = Math.max(1, actual - 2);
    const end = Math.min(total, start + 4);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(page = this.paginaActual()): void {
    this.error.set('');
    this.svc.list({
      page,
      pageSize: this.POR_PAGINA,
      nivel: this.filtroNivel || undefined,
      area: this.filtroArea.trim() || undefined,
      activo: true,
    }).subscribe({
      next: (data) => {
        this.cursos.set(data.items);
        this.total.set(data.total);
        this.totalPaginas.set(data.totalPages);
        this.paginaActual.set(data.page);
      },
      error: (err) => this.error.set(err.message),
    });
  }

  irPagina(page: number): void {
    if (page < 1 || page > this.totalPaginas()) return;
    this.cargar(page);
  }

  onFiltroChange(): void {
    this.paginaActual.set(1);
    this.cargar(1);
  }

  abrirModal(curso?: MaestroCursoItem): void {
    if (curso) {
      this.editId.set(curso.id);
      this.formNombre = curso.nombre;
      this.formArea = curso.area;
      this.formNivel = curso.nivel;
      this.formHoras = curso.horasSemanales;
      this.formGrados = [...curso.grados];
    } else {
      this.editId.set(null);
      this.formNombre = '';
      this.formArea = '';
      this.formNivel = 'Primaria';
      this.formHoras = 1;
      this.formGrados = [...G_PRI];
    }
    this.modalOpen.set(true);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
    this.editId.set(null);
  }

  onNivelChange(): void {
    this.formGrados = [...this.gradosParaNivel(this.formNivel)];
  }

  toggleGrado(g: string): void {
    this.formGrados = this.formGrados.includes(g)
      ? this.formGrados.filter(x => x !== g)
      : [...this.formGrados, g];
  }

  puedeGuardar(): boolean {
    return !!this.formNombre.trim() && !!this.formArea.trim() && this.formGrados.length > 0;
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;
    const payload: CreateMaestroCursoPayload = {
      nombre: this.formNombre.trim(),
      area: this.formArea.trim(),
      nivel: this.formNivel,
      grados: [...this.formGrados],
      horasSemanales: this.formHoras,
    };
    const id = this.editId();
    const req = id
      ? this.svc.update(id, payload)
      : this.svc.create(payload);

    req.subscribe({
      next: () => {
        this.mostrarToast(id ? 'Curso actualizado' : 'Curso creado', 'success');
        this.cerrarModal();
        this.cargar(this.paginaActual());
      },
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  desactivar(curso: MaestroCursoItem): void {
    if (!confirm(`¿Desactivar "${curso.nombre}" del catálogo?`)) return;
    this.svc.deactivate(curso.id).subscribe({
      next: () => {
        const page = this.cursos().length === 1 && this.paginaActual() > 1
          ? this.paginaActual() - 1
          : this.paginaActual();
        this.mostrarToast('Curso desactivado', 'success');
        this.cargar(page);
      },
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  private gradosParaNivel(nivel: NivelMaestroCurso): string[] {
    if (nivel === 'Inicial') return G_INI;
    if (nivel === 'Secundaria') return G_SEC;
    return G_PRI;
  }

  private mostrarToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
