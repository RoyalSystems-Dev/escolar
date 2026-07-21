import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MaestrosPeriodosAcademicosService } from './periodos-academicos.service';
import {
  ESTADO_PERIODO_CFG,
  PeriodoAcademicoItem,
  PeriodoAcademicoPayload,
  PeriodoAcademicoTipo,
  TIPOS_PERIODO,
} from './periodos-academicos.model';

@Component({
  selector: 'app-maestros-periodos-academicos',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
<div class="space-y-4">

  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h3 class="text-lg font-bold text-gray-900">Períodos Académicos</h3>
      <p class="text-sm text-gray-400 mt-0.5">
        Bimestres, trimestres o semestres del calendario escolar por año lectivo
      </p>
    </div>
    <button class="btn btn-primary btn-sm" (click)="abrirModal()">
      <span class="icon icon-sm">add</span> Nuevo período
    </button>
  </div>

  <div class="card p-4 flex flex-wrap items-end gap-3">
    <div>
      <label class="text-xs text-gray-500 font-medium">Año escolar</label>
      <select class="input mt-1 w-36" [(ngModel)]="filtroAnio" (ngModelChange)="cargar()">
        <option [ngValue]="0">Todos</option>
        @for (a of aniosDisponibles; track a) {
          <option [ngValue]="a">{{ a }}</option>
        }
      </select>
    </div>
    <div>
      <label class="text-xs text-gray-500 font-medium">Tipo</label>
      <select class="input mt-1 w-40" [(ngModel)]="filtroTipo" (ngModelChange)="aplicarFiltrosLocales()">
        <option value="">Todos</option>
        @for (t of tiposPeriodo; track t.value) {
          <option [value]="t.value">{{ t.label }}</option>
        }
      </select>
    </div>
    <p class="text-xs text-gray-400 ml-auto">{{ periodosFiltrados().length }} período(s)</p>
  </div>

  @if (periodoActual()) {
    <div class="card p-4 bg-green-50 border border-green-100 flex flex-wrap items-center gap-3">
      <span class="icon text-green-600">event_available</span>
      <p class="text-sm text-green-900">
        Período vigente:
        <span class="font-semibold">{{ periodoActual()!.nombre }}</span>
        ({{ periodoActual()!.inicioDisplay }} – {{ periodoActual()!.finDisplay }})
      </p>
    </div>
  }

  @if (error()) {
    <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{{ error() }}</div>
  }

  <div class="card overflow-hidden">
    @if (svc.loading()) {
      <div class="p-10 text-center text-gray-400 animate-pulse">Cargando períodos...</div>
    } @else if (!periodosFiltrados().length) {
      <div class="p-10 text-center text-gray-500">No hay períodos registrados para los filtros seleccionados.</div>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Año</th>
              <th class="px-4 py-3 text-left">#</th>
              <th class="px-4 py-3 text-left">Nombre</th>
              <th class="px-4 py-3 text-left">Tipo</th>
              <th class="px-4 py-3 text-left">Inicio</th>
              <th class="px-4 py-3 text-left">Fin</th>
              <th class="px-4 py-3 text-left">Duración</th>
              <th class="px-4 py-3 text-left">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (p of periodosFiltrados(); track p.id) {
              <tr class="hover:bg-gray-50/80" [class.bg-green-50/40]="p.actual">
                <td class="px-4 py-3 font-medium text-gray-800">{{ p.anioEscolar }}</td>
                <td class="px-4 py-3 text-gray-600">{{ p.numero }}</td>
                <td class="px-4 py-3 text-gray-800">
                  {{ p.nombre }}
                  @if (p.actual) {
                    <span class="badge badge-green text-[10px] ml-1">Vigente</span>
                  }
                </td>
                <td class="px-4 py-3 capitalize text-gray-600">{{ p.tipo }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-gray-700">{{ p.inicioDisplay }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-gray-700">{{ p.finDisplay }}</td>
                <td class="px-4 py-3 text-xs text-gray-500">
                  {{ p.duracionDias }} días · {{ p.duracionSemanas }} sem.
                </td>
                <td class="px-4 py-3">
                  <span class="badge text-[10px]" [ngClass]="estadoCfg(p.estado).badge">
                    {{ estadoCfg(p.estado).label }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-0.5">
                    @if (!p.actual) {
                      <button type="button" class="btn btn-ghost btn-icon text-green-600"
                        (click)="marcarVigente(p)" title="Marcar como vigente">
                        <span class="icon icon-sm">verified</span>
                      </button>
                    }
                    <button type="button" class="btn btn-ghost btn-icon text-gray-600 hover:text-indigo-600"
                      title="Editar" (click)="abrirModal(p)">
                      <span class="icon icon-sm">edit</span>
                    </button>
                    <button type="button" class="btn btn-ghost btn-icon text-red-500"
                      title="Eliminar" (click)="eliminar(p)">
                      <span class="icon icon-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </div>

  @if (modalOpen()) {
    <div class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" (click)="cerrarModal()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        (click)="$event.stopPropagation()">
        <h2 class="text-lg font-bold text-gray-900">{{ editId() ? 'Editar período' : 'Nuevo período académico' }}</h2>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Año escolar</label>
            <input type="number" class="form-input w-full" [(ngModel)]="formAnio" min="2000" />
          </div>
          <div>
            <label class="form-label">Número</label>
            <input type="number" class="form-input w-full" [(ngModel)]="formNumero" min="1" max="12" />
          </div>
        </div>
        <div>
          <label class="form-label">Nombre</label>
          <input class="form-input w-full" [(ngModel)]="formNombre" placeholder="Ej. Primer Bimestre" />
        </div>
        <div>
          <label class="form-label">Tipo</label>
          <select class="form-input w-full" [(ngModel)]="formTipo">
            @for (t of tiposPeriodo; track t.value) {
              <option [value]="t.value">{{ t.label }}</option>
            }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Inicio</label>
            <input type="date" class="form-input w-full" [(ngModel)]="formInicio" />
          </div>
          <div>
            <label class="form-label">Fin</label>
            <input type="date" class="form-input w-full" [(ngModel)]="formFin" />
          </div>
        </div>
        <div>
          <label class="form-label">Descripción (opcional)</label>
          <textarea class="form-input w-full" rows="2" [(ngModel)]="formDescripcion"></textarea>
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" [(ngModel)]="formActual" class="rounded" />
          Marcar como período vigente
        </label>

        <div class="flex gap-2 pt-2">
          <button class="btn btn-secondary flex-1" (click)="cerrarModal()">Cancelar</button>
          <button class="btn btn-primary flex-1" (click)="guardar()"
            [disabled]="!puedeGuardar() || svc.saving()">
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
export class MaestrosPeriodosAcademicosComponent implements OnInit {
  readonly svc = inject(MaestrosPeriodosAcademicosService);
  readonly tiposPeriodo = TIPOS_PERIODO;

  readonly periodos = signal<PeriodoAcademicoItem[]>([]);
  readonly modalOpen = signal(false);
  readonly editId = signal<number | null>(null);
  readonly error = signal('');
  readonly toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  readonly aniosDisponibles = [2025, 2026, 2027];
  filtroAnio = new Date().getFullYear();
  filtroTipo = '';

  formAnio = new Date().getFullYear();
  formNumero = 1;
  formNombre = '';
  formTipo: PeriodoAcademicoTipo = 'bimestre';
  formInicio = '';
  formFin = '';
  formDescripcion = '';
  formActual = false;

  readonly periodoActual = computed(() => this.periodos().find((p) => p.actual) ?? null);

  ngOnInit(): void {
    this.cargar();
  }

  periodosFiltrados(): PeriodoAcademicoItem[] {
    if (!this.filtroTipo) return this.periodos();
    return this.periodos().filter((p) => p.tipo === this.filtroTipo);
  }

  estadoCfg(estado: PeriodoAcademicoItem['estado']) {
    return ESTADO_PERIODO_CFG[estado];
  }

  cargar(): void {
    this.error.set('');
    const filters: { anioEscolar?: number; activo?: boolean } = { activo: true };
    if (this.filtroAnio > 0) filters.anioEscolar = this.filtroAnio;

    this.svc.list(filters).subscribe({
      next: (rows) => this.periodos.set(rows),
      error: (err) => this.error.set(err.message),
    });
  }

  aplicarFiltrosLocales(): void {
    // tipo se filtra en cliente; año ya recarga desde API
  }

  abrirModal(item?: PeriodoAcademicoItem): void {
    if (item) {
      this.editId.set(item.id);
      this.formAnio = item.anioEscolar;
      this.formNumero = item.numero;
      this.formNombre = item.nombre;
      this.formTipo = item.tipo;
      this.formInicio = item.inicio.slice(0, 10);
      this.formFin = item.fin.slice(0, 10);
      this.formDescripcion = item.descripcion ?? '';
      this.formActual = item.actual;
    } else {
      this.editId.set(null);
      this.formAnio = this.filtroAnio > 0 ? this.filtroAnio : new Date().getFullYear();
      this.formNumero = 1;
      this.formNombre = '';
      this.formTipo = 'bimestre';
      this.formInicio = '';
      this.formFin = '';
      this.formDescripcion = '';
      this.formActual = false;
    }
    this.modalOpen.set(true);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
  }

  puedeGuardar(): boolean {
    return !!(this.formNombre.trim() && this.formInicio && this.formFin && this.formAnio >= 2000 && this.formNumero >= 1);
  }

  guardar(): void {
    if (!this.puedeGuardar()) return;

    const payload: PeriodoAcademicoPayload = {
      anioEscolar: this.formAnio,
      numero: this.formNumero,
      nombre: this.formNombre.trim(),
      tipo: this.formTipo,
      inicio: this.formInicio,
      fin: this.formFin,
      descripcion: this.formDescripcion.trim(),
      actual: this.formActual,
    };

    const id = this.editId();
    const req = id ? this.svc.update(id, payload) : this.svc.create(payload);

    req.subscribe({
      next: () => {
        this.mostrarToast(id ? 'Período actualizado' : 'Período creado', 'success');
        this.cerrarModal();
        this.cargar();
      },
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  marcarVigente(p: PeriodoAcademicoItem): void {
    this.svc.marcarActual(p.id).subscribe({
      next: () => {
        this.mostrarToast(`"${p.nombre}" marcado como vigente`, 'success');
        this.cargar();
      },
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  eliminar(p: PeriodoAcademicoItem): void {
    if (!confirm(`¿Eliminar el período "${p.nombre}"?`)) return;
    this.svc.remove(p.id).subscribe({
      next: () => {
        this.mostrarToast('Período eliminado', 'success');
        this.cargar();
      },
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  private mostrarToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
