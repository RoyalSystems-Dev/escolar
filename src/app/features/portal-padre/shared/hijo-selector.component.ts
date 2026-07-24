import { Component, inject, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { HijoResumen, parentescoLabel } from '../seguimiento/seguimiento.model';
import { SeguimientoService } from '../seguimiento/seguimiento.service';

@Component({
  selector: 'app-hijo-selector',
  standalone: true,
  imports: [NgClass],
  template: `
    @if (svc.loadingHijos()) {
      <div class="card p-4 text-sm text-gray-400 flex items-center gap-2">
        <span class="icon icon-sm animate-spin">progress_activity</span> Cargando hijos…
      </div>
    } @else if (!svc.hijos().length) {
      <div class="card p-6 text-center text-sm text-gray-500">
        No hay alumnos vinculados a tu cuenta de apoderado.
      </div>
    } @else {
      <div class="flex flex-wrap gap-2">
        @for (h of svc.hijos(); track h.studentId) {
          <button type="button"
            class="px-3 py-2 rounded-xl border text-left transition-all min-w-[168px]"
            [ngClass]="svc.hijoSeleccionado()?.studentId === h.studentId
              ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
              : 'border-gray-200 bg-white hover:border-gray-300'"
            (click)="seleccionar(h)">
            <div class="text-sm font-semibold text-gray-800">{{ h.nombreCompleto }}</div>
            <div class="text-xs text-gray-500 mt-0.5">{{ h.aulaLabel }} · {{ parentescoLabel(h.parentesco) }}</div>
          </button>
        }
      </div>
    }
  `,
})
export class HijoSelectorComponent {
  readonly svc = inject(SeguimientoService);
  readonly parentescoLabel = parentescoLabel;
  readonly autoLoad = input(true);
  readonly hijoChange = output<HijoResumen>();

  constructor() {
    if (this.autoLoad()) {
      this.svc.loadHijos().subscribe();
    }
  }

  seleccionar(h: HijoResumen): void {
    this.svc.seleccionarHijo(h);
    this.hijoChange.emit(h);
  }
}
