import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { InstitucionalService } from '../../administracion/institucional/institucional.service';
import { Nivel } from '../../administracion/institucional/institucional.model';
import { JustificacionesService } from './justificaciones.service';
import {
  JustificacionItem,
  MESES_OPCIONES,
  MOTIVOS_JUSTIFICACION,
  PendienteJustificacion,
} from './justificaciones.model';

@Component({
  selector: 'app-justificaciones',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Justificación de Faltas</h2>
          <p class="text-sm text-gray-400 mt-0.5">
            Registro y seguimiento de inasistencias justificadas
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="cargar()">
          <span class="icon icon-sm">refresh</span> Actualizar
        </button>
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

      <div class="tabs">
        <button class="tab" [class.tab-active]="tab() === 'pendientes'" (click)="tab.set('pendientes')">
          <span class="icon icon-sm">pending_actions</span> Pendientes
          @if (pendientes().length) {
            <span class="badge badge-red text-[10px] ml-1">{{ pendientes().length }}</span>
          }
        </button>
        <button class="tab" [class.tab-active]="tab() === 'historial'" (click)="tab.set('historial')">
          <span class="icon icon-sm">history</span> Historial
        </button>
      </div>

      <div class="card p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label class="form-label mb-1 block">Nivel</label>
            <select class="form-select" [ngModel]="filtro().nivel" (ngModelChange)="setFiltro('nivel', $event)">
              <option value="">Todos</option>
              @for (n of niveles(); track n.id) {
                <option [value]="n.nombre">{{ n.nombre }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Grado</label>
            <select class="form-select" [ngModel]="filtro().grado" (ngModelChange)="setFiltro('grado', $event)" [disabled]="!filtro().nivel">
              <option value="">Todos</option>
              @for (g of gradosDisponibles(); track g) {
                <option [value]="g">{{ g }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Mes</label>
            <select class="form-select" [ngModel]="filtro().mes" (ngModelChange)="setFiltro('mes', $event)">
              @for (m of meses; track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="form-label mb-1 block">Buscar</label>
            <div class="relative">
              <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input class="form-input pl-10" placeholder="Nombre o motivo..."
                [ngModel]="filtro().busqueda" (ngModelChange)="setFiltro('busqueda', $event)">
            </div>
          </div>
        </div>
      </div>

      @if (tab() === 'pendientes') {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Nivel / Grado</th>
                  <th class="text-center">Sin justificar</th>
                  <th class="text-center">Justificadas</th>
                  <th>Última falta</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @if (svc.loading()) {
                  <tr><td colspan="6" class="py-12 text-center text-gray-400">Cargando pendientes...</td></tr>
                } @else {
                  @for (p of pendientesFiltrados(); track p.studentId) {
                    <tr>
                      <td>
                        <div class="font-medium text-gray-900">{{ p.estudiante }}</div>
                        <div class="text-xs text-gray-400">Sección {{ p.seccion }}</div>
                      </td>
                      <td>
                        <span class="badge text-[11px]" [ngClass]="nivelBadge(p.nivel)">{{ p.nivel }}</span>
                        <div class="text-sm text-gray-700 mt-1">{{ p.grado }}</div>
                      </td>
                      <td class="text-center">
                        <span class="font-bold text-red-600 text-lg">{{ p.faltasSinJustificar }}</span>
                      </td>
                      <td class="text-center">
                        <span class="text-green-600 font-medium">{{ p.faltasJustificadas }}</span>
                      </td>
                      <td class="text-sm text-gray-500">{{ p.ultimaFalta ?? '—' }}</td>
                      <td>
                        <div class="flex justify-center">
                          <button class="btn btn-primary btn-sm" (click)="abrirModal(p)">
                            <span class="icon icon-sm">fact_check</span> Justificar
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="py-12 text-center">
                        <span class="icon icon-2xl text-gray-200 block mb-2">check_circle</span>
                        <p class="text-gray-400 text-sm">No hay faltas pendientes de justificar</p>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fecha registro</th>
                  <th>Estudiante</th>
                  <th>Nivel / Grado</th>
                  <th class="text-center">Cantidad</th>
                  <th>Motivo</th>
                  <th>Fechas justificadas</th>
                  <th>Registrado por</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @if (svc.loading()) {
                  <tr><td colspan="8" class="py-12 text-center text-gray-400">Cargando historial...</td></tr>
                } @else {
                  @for (j of historialFiltrado(); track j.id) {
                    <tr>
                      <td class="text-xs text-gray-500 whitespace-nowrap">{{ j.fechaRegistro }}</td>
                      <td>
                        <div class="font-medium text-gray-900">{{ j.estudiante }}</div>
                        <div class="text-xs text-gray-400">Sección {{ j.seccion }}</div>
                      </td>
                      <td>
                        <span class="badge text-[11px]" [ngClass]="nivelBadge(j.nivel)">{{ j.nivel }}</span>
                        <div class="text-sm text-gray-700 mt-1">{{ j.grado }}</div>
                      </td>
                      <td class="text-center font-bold text-indigo-600">{{ j.cantidad }}</td>
                      <td>
                        <div class="text-sm text-gray-800">{{ j.motivo }}</div>
                        @if (j.observacion) {
                          <div class="text-xs text-gray-400 mt-0.5">{{ j.observacion }}</div>
                        }
                      </td>
                      <td class="text-xs text-gray-500">{{ j.fechas.join(', ') }}</td>
                      <td class="text-xs text-gray-500">{{ j.registradoPor }}</td>
                      <td>
                        <div class="flex justify-center">
                          <button class="btn-icon text-rose-500 hover:bg-rose-50" title="Anular justificación"
                            (click)="anular(j.id)">
                            <span class="icon icon-sm">undo</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="py-12 text-center">
                        <span class="icon icon-2xl text-gray-200 block mb-2">description</span>
                        <p class="text-gray-400 text-sm">No hay justificaciones registradas</p>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <div class="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <p class="font-bold mb-1 flex items-center gap-1">
          <span class="icon icon-sm">info</span> RN-006 · Justificación de faltas
        </p>
        <p>Las faltas justificadas no se computan como inasistencias injustificadas para alertas y reportes de riesgo.</p>
      </div>
    </div>

    @if (modalAbierto()) {
      <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        (click)="cerrarModal()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in"
          (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h3 class="font-bold text-gray-900">Justificar Falta</h3>
              <p class="text-xs text-gray-500">{{ seleccionado()?.estudiante }}</p>
            </div>
            <button class="btn-icon text-gray-400" (click)="cerrarModal()">
              <span class="icon">close</span>
            </button>
          </div>

          <div class="px-6 py-5 space-y-4">
            <div class="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
              <span class="text-sm text-gray-700">Faltas sin justificar</span>
              <span class="font-bold text-red-600 text-lg">{{ seleccionado()?.faltasSinJustificar ?? 0 }}</span>
            </div>

            <div>
              <label class="form-label">Cantidad a justificar</label>
              <input type="number" class="form-input mt-1" min="1"
                [max]="seleccionado()?.faltasSinJustificar ?? 1"
                [(ngModel)]="form.cantidad">
            </div>

            <div>
              <label class="form-label">Motivo <span class="text-red-500">*</span></label>
              <select class="form-select mt-1" [(ngModel)]="form.motivo">
                <option value="">— Seleccionar —</option>
                @for (m of motivos; track m) {
                  <option [value]="m">{{ m }}</option>
                }
              </select>
            </div>

            @if (form.motivo === 'Otro') {
              <div>
                <label class="form-label">Especificar</label>
                <input class="form-input mt-1" placeholder="Describe el motivo..." [(ngModel)]="form.motivoOtro">
              </div>
            }

            <div>
              <label class="form-label">Observaciones (opcional)</label>
              <textarea class="form-input mt-1 min-h-20 resize-none" placeholder="Certificado médico, fecha..."
                [(ngModel)]="form.observacion"></textarea>
            </div>

            @if (errorForm()) {
              <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ errorForm() }}</div>
            }
          </div>

          <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
            <button class="btn btn-secondary" (click)="cerrarModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="confirmar()" [disabled]="svc.saving() || !motivoValido()">
              {{ svc.saving() ? 'Guardando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (notificacion(); as n) {
      <div class="fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 text-white"
        [ngClass]="n.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'">
        <span class="icon">{{ n.tipo === 'success' ? 'check_circle' : 'error' }}</span>
        {{ n.mensaje }}
      </div>
    }
  `,
})
export class JustificacionesComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  private readonly auth = inject(AuthService);
  readonly svc = inject(JustificacionesService);
  private readonly institucional = inject(InstitucionalService);

  readonly motivos = MOTIVOS_JUSTIFICACION;
  readonly meses = MESES_OPCIONES;

  readonly tab = signal<'pendientes' | 'historial'>('pendientes');
  readonly modalAbierto = signal(false);
  readonly seleccionado = signal<PendienteJustificacion | null>(null);
  readonly errorForm = signal('');
  readonly notificacion = signal<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  private readonly _pendientes = signal<PendienteJustificacion[]>([]);
  private readonly _historial = signal<JustificacionItem[]>([]);
  private readonly _niveles = signal<Nivel[]>([]);
  readonly niveles = this._niveles.asReadonly();
  readonly pendientes = this._pendientes.asReadonly();

  readonly filtro = signal({
    nivel: '',
    grado: '',
    mes: '2026-06',
    busqueda: '',
  });

  form = { cantidad: 1, motivo: '', motivoOtro: '', observacion: '' };

  readonly gradosDisponibles = computed(() => {
    const nivel = this._niveles().find((n) => n.nombre === this.filtro().nivel);
    return nivel?.grados.map((g) => g.nombre) ?? [];
  });

  readonly pendientesFiltrados = computed(() => {
    const q = this.filtro().busqueda.toLowerCase().trim();
    if (!q) return this._pendientes();
    return this._pendientes().filter((p) =>
      `${p.estudiante} ${p.grado} ${p.nivel}`.toLowerCase().includes(q),
    );
  });

  readonly historialFiltrado = computed(() => {
    const q = this.filtro().busqueda.toLowerCase().trim();
    if (!q) return this._historial();
    return this._historial().filter((j) =>
      `${j.estudiante} ${j.motivo} ${j.grado}`.toLowerCase().includes(q),
    );
  });

  readonly kpis = computed(() => {
    const pendientes = this._pendientes();
    const historial = this._historial();
    return [
      {
        label: 'Pendientes',
        value: pendientes.length,
        icon: 'pending_actions',
        bg: 'bg-red-100',
        color: 'text-red-600',
      },
      {
        label: 'Faltas por justificar',
        value: pendientes.reduce((s, p) => s + p.faltasSinJustificar, 0),
        icon: 'event_busy',
        bg: 'bg-amber-100',
        color: 'text-amber-600',
      },
      {
        label: 'Justificaciones',
        value: historial.length,
        icon: 'fact_check',
        bg: 'bg-green-100',
        color: 'text-green-600',
      },
      {
        label: 'Faltas justificadas',
        value: historial.reduce((s, j) => s + j.cantidad, 0),
        icon: 'check_circle',
        bg: 'bg-indigo-100',
        color: 'text-indigo-600',
      },
    ];
  });

  ngOnInit(): void {
    this.layout.setTitle('Justificaciones');
    this.institucional.loadEducationLevels().subscribe({
      next: (niveles) => this._niveles.set(niveles),
    });
    this.cargar();
  }

  cargar(): void {
    const filters = this.buildFilters();
    this.svc.loadPending(filters).subscribe({
      next: (items) => this._pendientes.set(items),
      error: () => this.mostrarNotificacion('No se pudieron cargar los pendientes', 'error'),
    });
    this.svc.loadHistorial(filters).subscribe({
      next: (items) => this._historial.set(items),
      error: () => this.mostrarNotificacion('No se pudo cargar el historial', 'error'),
    });
  }

  setFiltro(campo: 'nivel' | 'grado' | 'mes' | 'busqueda', valor: string): void {
    this.filtro.update((f) => {
      const next = { ...f, [campo]: valor };
      if (campo === 'nivel') next.grado = '';
      return next;
    });
    if (campo !== 'busqueda') this.cargar();
  }

  abrirModal(item: PendienteJustificacion): void {
    this.seleccionado.set(item);
    this.form = { cantidad: 1, motivo: '', motivoOtro: '', observacion: '' };
    this.errorForm.set('');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.seleccionado.set(null);
  }

  motivoValido(): boolean {
    if (!this.form.motivo) return false;
    if (this.form.motivo === 'Otro') return this.form.motivoOtro.trim().length >= 2;
    return true;
  }

  confirmar(): void {
    const item = this.seleccionado();
    if (!item || !this.motivoValido()) return;

    const cantidad = Math.min(
      Math.max(1, this.form.cantidad),
      item.faltasSinJustificar,
    );
    const motivo =
      this.form.motivo === 'Otro' ? this.form.motivoOtro.trim() : this.form.motivo;

    this.errorForm.set('');
    this.svc
      .create({
        studentId: item.studentId,
        cantidad,
        motivo,
        observacion: this.form.observacion.trim() || undefined,
        registradoPor: this.auth.nombreCompleto() || 'Administración',
      })
      .subscribe({
        next: () => {
          this.cerrarModal();
          this.cargar();
          this.mostrarNotificacion(
            `${cantidad} falta(s) justificada(s) — ${item.estudiante.split(',')[0]}`,
          );
        },
        error: (err) => {
          this.errorForm.set(err.message ?? 'No se pudo registrar la justificación');
        },
      });
  }

  anular(id: number): void {
    if (!confirm('Anular esta justificación? Las faltas volverán a estado sin justificar.')) return;
    this.svc.delete(id).subscribe({
      next: () => {
        this.cargar();
        this.mostrarNotificacion('Justificación anulada');
      },
      error: () => this.mostrarNotificacion('No se pudo anular la justificación', 'error'),
    });
  }

  nivelBadge(nivel: string): string {
    return {
      Inicial: 'badge-purple',
      Primaria: 'badge-blue',
      Secundaria: 'badge-indigo',
    }[nivel] ?? 'badge-gray';
  }

  private buildFilters() {
    const { nivel, grado, mes, busqueda } = this.filtro();
    return {
      nivel: nivel || undefined,
      grado: grado || undefined,
      mes: mes || undefined,
      busqueda: busqueda || undefined,
    };
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' = 'success'): void {
    this.notificacion.set({ mensaje, tipo });
    setTimeout(() => this.notificacion.set(null), 3000);
  }
}
