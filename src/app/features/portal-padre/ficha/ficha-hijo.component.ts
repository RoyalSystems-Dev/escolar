import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { SeguimientoService } from '../seguimiento/seguimiento.service';
import { HijoResumen, parentescoLabel } from '../seguimiento/seguimiento.model';
import { FichaHijoService } from './ficha-hijo.service';

@Component({
  standalone: true,
  imports: [DecimalPipe, NgClass, NgTemplateOutlet],
  template: `
<div class="space-y-5 animate-fade-in">
  <div>
    <h2 class="text-xl font-bold text-gray-800">Ficha del alumno</h2>
    <p class="text-sm text-gray-500 mt-0.5">Datos personales, apoderados e historial académico</p>
  </div>

  @if (segSvc.loadingHijos()) {
    <div class="card p-10 flex flex-col items-center text-gray-400">
      <span class="icon icon-xl animate-spin mb-3">progress_activity</span>
      <p class="text-sm">Cargando hijos…</p>
    </div>
  } @else if (!segSvc.hijos().length) {
    <div class="card p-10 text-center text-gray-400">
      <span class="icon icon-xl mb-3">family_restroom</span>
      <p class="text-sm">No hay alumnos vinculados.</p>
    </div>
  } @else {
    <div class="flex flex-wrap gap-2">
      @for (h of segSvc.hijos(); track h.studentId) {
        <button type="button"
          class="px-3 py-2 rounded-xl border text-left transition-all min-w-[160px]"
          [ngClass]="hijoId() === h.studentId
            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
            : 'border-gray-200 bg-white hover:border-gray-300'"
          (click)="seleccionarHijo(h)">
          <div class="text-sm font-semibold text-gray-800">{{ h.nombreCompleto }}</div>
          <div class="text-xs text-gray-500 mt-0.5">{{ h.aulaLabel }} · {{ parentescoLabel(h.parentesco) }}</div>
        </button>
      }
    </div>

    @if (svc.loading()) {
      <div class="card p-10 flex flex-col items-center text-gray-400">
        <span class="icon icon-xl animate-spin mb-3">progress_activity</span>
        <p class="text-sm">Cargando ficha…</p>
      </div>
    } @else if (ficha(); as e) {
      <div class="card p-5 bg-gradient-to-r from-indigo-50 to-white border-indigo-100">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-gray-900">{{ e.nombres }} {{ e.apellidos }}</h3>
            <p class="text-sm text-gray-500">{{ e.gradoLabel }} · Sección {{ e.seccion }}</p>
            <p class="text-xs text-gray-400 mt-1">Código {{ e.codigo }} · DNI {{ e.dni || '—' }}</p>
          </div>
          <span class="badge badge-blue">{{ parentescoLabel(e.parentesco) }}</span>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-5 space-y-4">
          <h4 class="font-semibold text-gray-800 flex items-center gap-2">
            <span class="icon text-indigo-600">person</span> Datos personales
          </h4>
          <dl class="grid sm:grid-cols-2 gap-3 text-sm">
            <div><dt class="text-gray-400 text-xs">Fecha de nacimiento</dt><dd class="font-medium">{{ formatFecha(e.fechaNac) }}</dd></div>
            <div><dt class="text-gray-400 text-xs">Sexo</dt><dd class="font-medium">{{ e.sexo === 'F' ? 'Femenino' : 'Masculino' }}</dd></div>
            <div class="sm:col-span-2"><dt class="text-gray-400 text-xs">Dirección</dt><dd class="font-medium">{{ e.direccion || '—' }}</dd></div>
            <div><dt class="text-gray-400 text-xs">Grupo sanguíneo</dt><dd class="font-medium">{{ e.grupoSanguineo || '—' }}</dd></div>
            <div><dt class="text-gray-400 text-xs">Año de ingreso</dt><dd class="font-medium">{{ e.anioIngreso || '—' }}</dd></div>
            <div><dt class="text-gray-400 text-xs">Asistencia</dt><dd class="font-medium">{{ e.asistenciaPct }}%</dd></div>
            <div><dt class="text-gray-400 text-xs">Conducta</dt><dd class="font-medium">{{ e.conductaNota || '—' }}</dd></div>
          </dl>
        </div>

        <div class="card p-5 space-y-4">
          <h4 class="font-semibold text-gray-800 flex items-center gap-2">
            <span class="icon text-emerald-600">family_restroom</span> Apoderados
          </h4>
          <ng-container *ngTemplateOutlet="repBlock; context: { $implicit: e.apoderado, titulo: 'Apoderado' }"></ng-container>
          <ng-container *ngTemplateOutlet="repBlock; context: { $implicit: e.padre, titulo: 'Padre' }"></ng-container>
          <ng-container *ngTemplateOutlet="repBlock; context: { $implicit: e.madre, titulo: 'Madre' }"></ng-container>
        </div>
      </div>

      <div class="card p-5">
        <h4 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="icon text-amber-600">history_edu</span> Historial académico
        </h4>
        @if (!e.historialAcademico.length) {
          <p class="text-sm text-gray-400">Sin registros de historial.</p>
        } @else {
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr><th>Año</th><th>Grado</th><th>Sección</th><th>Promedio</th><th>Estado</th></tr>
              </thead>
              <tbody>
                @for (h of e.historialAcademico; track h.anio) {
                  <tr>
                    <td>{{ h.anio }}</td>
                    <td>{{ h.grado }}</td>
                    <td>{{ h.seccion }}</td>
                    <td class="font-semibold">{{ h.promedio | number:'1.1-1' }}</td>
                    <td><span class="badge text-[10px]" [ngClass]="h.estado === 'Promovido' ? 'badge-green' : 'badge-orange'">{{ h.estado }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  }
</div>

<ng-template #repBlock let-rep let-titulo="titulo">
  @if (rep?.nombres) {
    <div class="p-3 bg-gray-50 rounded-xl text-sm">
      <p class="text-xs text-gray-400 mb-1">{{ titulo }}</p>
      <p class="font-semibold">{{ rep.nombres }} {{ rep.apellidos }}</p>
      <p class="text-gray-500 text-xs mt-1">DNI {{ rep.dni || '—' }} · {{ rep.telefono || '—' }}</p>
      @if (rep.email) { <p class="text-gray-500 text-xs">{{ rep.email }}</p> }
    </div>
  }
</ng-template>
  `,
})
export class FichaHijoComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly segSvc = inject(SeguimientoService);
  readonly svc = inject(FichaHijoService);

  readonly parentescoLabel = parentescoLabel;
  ficha = this.svc.ficha;
  hijoId = computed(() => this.segSvc.hijoSeleccionado()?.studentId ?? null);

  ngOnInit(): void {
    this.layout.setTitle('Ficha del alumno');
    this.segSvc.loadHijos().subscribe({
      next: hijos => {
        if (hijos[0]) {
          this.segSvc.seleccionarHijo(hijos[0]);
          this.cargarFicha(hijos[0].studentId);
        }
      },
    });
  }

  seleccionarHijo(hijo: HijoResumen): void {
    if (this.hijoId() === hijo.studentId) return;
    this.segSvc.seleccionarHijo(hijo);
    this.cargarFicha(hijo.studentId);
  }

  private cargarFicha(studentId: number): void {
    this.svc.load(studentId).subscribe();
  }

  formatFecha(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}
