import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../../core/layout/services/layout.service';
import { MaestrosSedesService } from './sedes.service';
import {
  MaestroInstitucionResumen,
  MaestroSedeItem,
  NIVELES_SEDE,
  TURNOS_SEDE,
} from './sedes.model';

@Component({
  selector: 'app-maestros-sedes',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
<div class="space-y-4">

  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h3 class="text-lg font-bold text-gray-900">Sedes por Institución</h3>
      <p class="text-sm text-gray-400 mt-0.5">
        Catálogo maestro de sedes vinculadas a la institución educativa
      </p>
      @if (institucion()) {
        <p class="text-xs text-indigo-600 mt-1">
          {{ institucion()!.nombre }} ({{ institucion()!.siglas }}) · RUC {{ institucion()!.ruc }}
        </p>
      }
    </div>
    <button class="btn btn-primary btn-sm" (click)="abrirModal()">
      <span class="icon icon-sm">add</span> Nueva sede
    </button>
  </div>

  @if (error()) {
    <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{{ error() }}</div>
  }
  @if (toast()) {
    <div class="rounded-xl px-4 py-3 text-sm"
      [ngClass]="toast()!.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'">
      {{ toast()!.msg }}
    </div>
  }

  <div class="card overflow-hidden">
    @if (svc.loading()) {
      <div class="p-10 text-center text-gray-400 text-sm">Cargando sedes...</div>
    } @else if (!sedes().length) {
      <div class="p-10 text-center text-gray-500 text-sm">No hay sedes registradas para esta institución.</div>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Sede</th>
              <th class="px-4 py-3 text-left">Ubicación</th>
              <th class="px-4 py-3 text-left">Niveles / Turnos</th>
              <th class="px-4 py-3 text-left">Director</th>
              <th class="px-4 py-3 text-center">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (s of sedes(); track s.id) {
              <tr class="hover:bg-gray-50/80">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ s.nombre }}</div>
                  <div class="text-xs text-gray-400 font-mono">{{ s.codigo }}</div>
                </td>
                <td class="px-4 py-3 text-gray-600">
                  <div>{{ s.direccion }}</div>
                  <div class="text-xs text-gray-400">{{ s.distrito }}, {{ s.provincia }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    @for (n of s.niveles; track n) {
                      <span class="badge badge-indigo text-[10px]">{{ n }}</span>
                    }
                    @for (t of s.turnos; track t) {
                      <span class="badge badge-gray text-[10px]">{{ t }}</span>
                    }
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-600">{{ s.director || '—' }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="badge text-[10px]" [ngClass]="s.estado === 'activo' ? 'badge-green' : 'badge-red'">
                    {{ s.estado }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button class="btn btn-secondary btn-sm mr-1" (click)="abrirModal(s)">Editar</button>
                  <button class="btn btn-ghost btn-sm text-red-500" (click)="eliminar(s)"
                    [disabled]="s.estado === 'inactivo'">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </div>
</div>

@if (modalOpen()) {
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="cerrarModal()">
    <div class="card w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
      <h2 class="text-lg font-bold text-gray-900">{{ editId() ? 'Editar sede' : 'Nueva sede' }}</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <label class="form-label">Nombre</label>
          <input class="form-input w-full" [(ngModel)]="form.nombre" placeholder="Sede Central" />
        </div>
        <div>
          <label class="form-label">Código</label>
          <input class="form-input w-full" [(ngModel)]="form.codigo" placeholder="SEDE-01" />
        </div>
        <div>
          <label class="form-label">Estado</label>
          <select class="form-input w-full" [(ngModel)]="form.estado">
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="form-label">Dirección</label>
          <input class="form-input w-full" [(ngModel)]="form.direccion" />
        </div>
        <div>
          <label class="form-label">Distrito</label>
          <input class="form-input w-full" [(ngModel)]="form.distrito" />
        </div>
        <div>
          <label class="form-label">Provincia</label>
          <input class="form-input w-full" [(ngModel)]="form.provincia" />
        </div>
        <div>
          <label class="form-label">Región</label>
          <input class="form-input w-full" [(ngModel)]="form.region" />
        </div>
        <div>
          <label class="form-label">Teléfono</label>
          <input class="form-input w-full" [(ngModel)]="form.telefono" />
        </div>
        <div>
          <label class="form-label">Email</label>
          <input class="form-input w-full" [(ngModel)]="form.email" />
        </div>
        <div class="sm:col-span-2">
          <label class="form-label">Director</label>
          <input class="form-input w-full" [(ngModel)]="form.director" />
        </div>
      </div>

      <div>
        <label class="form-label">Niveles educativos</label>
        <div class="flex flex-wrap gap-2">
          @for (n of nivelesOpts; track n) {
            <label class="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" class="rounded border-gray-300"
                [checked]="form.niveles.includes(n)" (change)="toggleNivel(n, $event)" />
              {{ n }}
            </label>
          }
        </div>
      </div>

      <div>
        <label class="form-label">Turnos</label>
        <div class="flex flex-wrap gap-2">
          @for (t of turnosOpts; track t) {
            <label class="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" class="rounded border-gray-300"
                [checked]="form.turnos.includes(t)" (change)="toggleTurno(t, $event)" />
              {{ t }}
            </label>
          }
        </div>
      </div>

      <div class="flex gap-2 justify-end">
        <button class="btn btn-ghost" (click)="cerrarModal()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="svc.saving()" (click)="guardar()">Guardar</button>
      </div>
    </div>
  </div>
}
  `,
})
export class MaestrosSedesComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(MaestrosSedesService);

  readonly institucion = signal<MaestroInstitucionResumen | null>(null);
  readonly sedes = signal<MaestroSedeItem[]>([]);
  readonly error = signal('');
  readonly toast = signal<{ msg: string; type: 'ok' | 'error' } | null>(null);

  readonly modalOpen = signal(false);
  readonly editId = signal<number | null>(null);

  readonly nivelesOpts = NIVELES_SEDE;
  readonly turnosOpts = TURNOS_SEDE;

  form = {
    nombre: '',
    codigo: '',
    direccion: '',
    distrito: '',
    provincia: '',
    region: '',
    telefono: '',
    email: '',
    director: '',
    niveles: [] as string[],
    turnos: [] as string[],
    estado: 'activo' as 'activo' | 'inactivo',
  };

  ngOnInit(): void {
    this.layout.setTitle('Maestros · Sedes');
    this.cargar();
  }

  cargar(): void {
    this.error.set('');
    this.svc.list().subscribe({
      next: (catalog) => {
        this.institucion.set(catalog.institution);
        this.sedes.set(catalog.sedes.filter((s) => s.estado === 'activo'));
      },
      error: (err) => this.error.set(err.message),
    });
  }

  abrirModal(sede?: MaestroSedeItem): void {
    this.editId.set(sede?.id ?? null);
    this.form = {
      nombre: sede?.nombre ?? '',
      codigo: sede?.codigo ?? '',
      direccion: sede?.direccion ?? '',
      distrito: sede?.distrito ?? '',
      provincia: sede?.provincia ?? '',
      region: sede?.region ?? '',
      telefono: sede?.telefono ?? '',
      email: sede?.email ?? '',
      director: sede?.director ?? '',
      niveles: [...(sede?.niveles ?? [])],
      turnos: [...(sede?.turnos ?? [])],
      estado: sede?.estado ?? 'activo',
    };
    this.modalOpen.set(true);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
    this.editId.set(null);
  }

  toggleNivel(nivel: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.form.niveles = checked
      ? [...this.form.niveles, nivel]
      : this.form.niveles.filter((n) => n !== nivel);
  }

  toggleTurno(turno: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.form.turnos = checked
      ? [...this.form.turnos, turno]
      : this.form.turnos.filter((t) => t !== turno);
  }

  guardar(): void {
    const nombre = this.form.nombre.trim();
    if (!nombre) return;

    const payload = {
      nombre,
      codigo: this.form.codigo.trim(),
      direccion: this.form.direccion.trim(),
      distrito: this.form.distrito.trim(),
      provincia: this.form.provincia.trim(),
      region: this.form.region.trim(),
      telefono: this.form.telefono.trim(),
      email: this.form.email.trim(),
      director: this.form.director.trim(),
      niveles: [...this.form.niveles],
      turnos: [...this.form.turnos],
      estado: this.form.estado,
      institutionId: this.institucion()?.id,
    };

    const editId = this.editId();
    const req = editId
      ? this.svc.update(editId, payload)
      : this.svc.create(payload);

    req.subscribe({
      next: () => {
        this.cerrarModal();
        this.mostrarToast(editId ? 'Sede actualizada' : 'Sede creada', 'ok');
        this.cargar();
      },
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  eliminar(sede: MaestroSedeItem): void {
    if (!confirm(`¿Eliminar la sede "${sede.nombre}"?`)) return;
    this.svc.remove(sede.id).subscribe({
      next: () => {
        this.mostrarToast('Sede eliminada', 'ok');
        this.cargar();
      },
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  private mostrarToast(msg: string, type: 'ok' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
