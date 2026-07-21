import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SalonesService } from './salones.service';
import { SalonItem } from './salones.model';

@Component({
  selector: 'app-salones',
  standalone: true,
  imports: [FormsModule, NgClass, RouterLink],
  template: `
<div class="space-y-4">

  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h3 class="text-lg font-bold text-gray-900">Salones</h3>
      <p class="text-sm text-gray-400 mt-0.5">
        Tabla maestra de aforo · A.E. {{ anioEscolar() }}
      </p>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      <a routerLink="/matricula/vacantes" class="btn btn-secondary btn-sm">
        <span class="icon icon-sm">event_seat</span> Ver vacantes
      </a>
      <button class="btn btn-primary btn-sm" (click)="sincronizar()" [disabled]="svc.saving()">
        <span class="icon icon-sm">sync</span> Sincronizar estructura
      </button>
    </div>
  </div>

  <div class="card p-4 flex flex-wrap items-end gap-4">
    <div>
      <label class="form-label">Año escolar</label>
      <div class="relative mt-1">
        <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">calendar_today</span>
        <input
          type="number"
          class="form-input pl-10 bg-gray-50 w-36"
          min="2000"
          max="2100"
          [(ngModel)]="anioInput"
          (ngModelChange)="cargar()"
        />
      </div>
    </div>
    <div>
      <label class="form-label">Nivel</label>
      <div class="relative mt-1">
        <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">school</span>
        <select class="form-select pl-10 bg-gray-50 w-40" [(ngModel)]="filtroNivel" (ngModelChange)="cargar()">
          <option value="">Todos</option>
          <option value="Inicial">Inicial</option>
          <option value="Primaria">Primaria</option>
          <option value="Secundaria">Secundaria</option>
        </select>
      </div>
    </div>
    <p class="text-xs text-gray-400 ml-auto pb-2">
      Los grados ingresantes (1° Primaria, 1° Secundaria) usan el aforo total del salon.
    </p>
  </div>

  @if (error()) {
    <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{{ error() }}</div>
  }

  <div class="card overflow-hidden">
    @if (svc.loading()) {
      <div class="p-10 text-center text-gray-400">
        <span class="icon animate-spin text-indigo-500">refresh</span>
        <p class="mt-2 text-sm">Cargando salones...</p>
      </div>
    } @else if (!salones().length) {
      <div class="p-10 text-center">
        <p class="text-gray-500 mb-3">No hay registros en la tabla salones para este anio.</p>
        <button class="btn btn-primary btn-sm" (click)="sincronizar()">Sincronizar desde estructura institucional</button>
      </div>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Nivel</th>
              <th class="px-4 py-3 text-left">Grado</th>
              <th class="px-4 py-3 text-center">Seccion</th>
              <th class="px-4 py-3 text-center">Aforo</th>
              <th class="px-4 py-3 text-center">Tipo</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (s of salones(); track s.id) {
              <tr class="hover:bg-gray-50/80">
                <td class="px-4 py-3 font-medium text-gray-800">{{ s.nivel }}</td>
                <td class="px-4 py-3 text-gray-700">{{ s.grado }}</td>
                <td class="px-4 py-3 text-center font-semibold">{{ s.seccion }}</td>
                <td class="px-4 py-3 text-center">
                  @if (editandoId() === s.id) {
                    <input type="number" min="1" max="999" class="form-input w-20 mx-auto text-center py-1"
                      [(ngModel)]="editAforo" (keydown.enter)="guardarAforo(s)" />
                  } @else {
                    <span class="font-bold text-indigo-700">{{ s.aforo }}</span>
                  }
                </td>
                <td class="px-4 py-3 text-center">
                  @if (s.esIngresante) {
                    <span class="badge bg-amber-100 text-amber-700 text-[10px]">Ingresante</span>
                  } @else {
                    <span class="badge bg-blue-100 text-blue-700 text-[10px]">Continuidad</span>
                  }
                </td>
                <td class="px-4 py-3 text-right">
                  @if (editandoId() === s.id) {
                    <button class="btn btn-primary btn-sm mr-1" (click)="guardarAforo(s)" [disabled]="svc.saving()">Guardar</button>
                    <button class="btn btn-secondary btn-sm" (click)="editandoId.set(null)">Cancelar</button>
                  } @else {
                    <button class="btn btn-secondary btn-sm" (click)="iniciarEdicion(s)">
                      <span class="icon icon-sm">edit</span> Aforo
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </div>

  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div class="card p-4">
      <p class="text-xs text-gray-400">Salones</p>
      <p class="text-2xl font-bold text-gray-900">{{ salones().length }}</p>
    </div>
    <div class="card p-4">
      <p class="text-xs text-gray-400">Aforo total</p>
      <p class="text-2xl font-bold text-indigo-700">{{ totalAforo() }}</p>
    </div>
    <div class="card p-4">
      <p class="text-xs text-gray-400">Ingresantes</p>
      <p class="text-2xl font-bold text-amber-600">{{ countIngresantes() }}</p>
    </div>
    <div class="card p-4">
      <p class="text-xs text-gray-400">Continuidad</p>
      <p class="text-2xl font-bold text-blue-600">{{ salones().length - countIngresantes() }}</p>
    </div>
  </div>

  @if (toast()) {
    <div class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-sm"
      [ngClass]="toast()!.type === 'success' ? 'bg-green-600' : 'bg-red-600'">
      {{ toast()!.msg }}
    </div>
  }
</div>
  `,
})
export class SalonesComponent implements OnInit {
  readonly svc = inject(SalonesService);

  readonly salones = signal<SalonItem[]>([]);
  readonly anioEscolar = signal(2026);
  anioInput = 2026;
  filtroNivel = '';
  readonly editandoId = signal<number | null>(null);
  editAforo = 30;
  readonly error = signal('');
  readonly toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  readonly totalAforo = computed(() => this.salones().reduce((s, r) => s + r.aforo, 0));
  readonly countIngresantes = computed(() => this.salones().filter((s) => s.esIngresante).length);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.anioEscolar.set(this.anioInput);
    this.error.set('');
    this.svc.list({
      anioEscolar: this.anioEscolar(),
      nivel: this.filtroNivel || undefined,
      activo: true,
    }).subscribe({
      next: (rows) => this.salones.set(rows),
      error: (err) => this.error.set(err.message),
    });
  }

  iniciarEdicion(s: SalonItem): void {
    this.editandoId.set(s.id);
    this.editAforo = s.aforo;
  }

  guardarAforo(s: SalonItem): void {
    if (this.editAforo < 1) return;
    this.svc.updateAforo(s.id, this.editAforo).subscribe({
      next: (updated) => {
        this.salones.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
        this.editandoId.set(null);
        this.mostrarToast('Aforo actualizado', 'success');
      },
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  sincronizar(): void {
    this.svc.sync(this.anioEscolar()).subscribe({
      next: (res) => {
        this.mostrarToast(`Sincronizado: ${res.created} creados, ${res.skipped} existentes`, 'success');
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
