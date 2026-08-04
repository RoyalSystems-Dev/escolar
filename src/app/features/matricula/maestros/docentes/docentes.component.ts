import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../../core/layout/services/layout.service';
import { MaestrosDocentesService } from './docentes.service';
import {
  DocenteDetail,
  DocenteEstado,
  DocenteItem,
  ESPECIALIDADES_DOCENTE,
  ESTADOS_DOCENTE,
} from './docentes.model';

interface DocenteFormState {
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  sede: string;
  estado: DocenteEstado;
  especialidad: string;
  especialidadCustom: string;
  password: string;
}

@Component({
  selector: 'app-maestros-docentes',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
<div class="space-y-4">

  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h3 class="text-lg font-bold text-gray-900">Docentes</h3>
      <p class="text-sm text-gray-400 mt-0.5">
        Registro maestro de docentes, especialización, carga horaria y salones asignados
      </p>
    </div>
    <button class="btn btn-primary btn-sm" (click)="abrirModal()">
      <span class="icon icon-sm">person_add</span> Nuevo docente
    </button>
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
    <div class="flex flex-wrap items-end gap-4">
      <div>
        <label class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Estado</label>
        <select class="mt-1.5 w-36 rounded-xl border-2 border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
          [(ngModel)]="filtroEstado" (ngModelChange)="onFiltroChange()">
          @for (e of estadosOpts; track e.value) {
            <option [value]="e.value">{{ e.label }}</option>
          }
        </select>
      </div>
      <div>
        <label class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Año escolar</label>
        <select class="mt-1.5 w-32 rounded-xl border-2 border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
          [(ngModel)]="anioEscolar" (ngModelChange)="onFiltroChange()">
          <option [value]="2026">2026</option>
          <option [value]="2025">2025</option>
        </select>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-3 lg:items-stretch">
      <div class="flex-1 min-w-0">
        <label class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">Buscar docente</label>
        <div class="flex items-stretch rounded-2xl border-2 border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/70 shadow-sm overflow-hidden focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
          <div class="flex items-center pl-4 text-indigo-500">
            <span class="icon">search</span>
          </div>
          <input
            class="flex-1 min-w-0 border-0 bg-transparent px-3 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            [ngModel]="filtroBusqueda()"
            (ngModelChange)="onBusquedaChange($event)"
            (keyup.enter)="buscar()"
            placeholder="Nombre, apellido, DNI, email, usuario o especialización..." />
          @if (filtroBusqueda()) {
            <button type="button" class="px-2 text-gray-400 hover:text-gray-600 transition-colors" (click)="limpiarBusqueda()" title="Limpiar">
              <span class="icon icon-sm">close</span>
            </button>
          }
          <button type="button"
            class="shrink-0 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center gap-1.5"
            (click)="buscar()">
            <span class="icon icon-sm">travel_explore</span>
            Buscar
          </button>
        </div>
      </div>
      <div class="flex items-end">
        <p class="text-xs text-gray-500 px-1 pb-1">
          <span class="font-bold text-indigo-700">{{ total() }}</span> docente(s) encontrados
        </p>
      </div>
    </div>
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
      <div class="p-10 text-center text-gray-400 text-sm">Cargando docentes...</div>
    } @else if (!docentes().length) {
      <div class="p-10 text-center text-gray-500 text-sm">No hay docentes para los filtros seleccionados.</div>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Docente</th>
              <th class="px-4 py-3 text-left">Especialización</th>
              <th class="px-4 py-3 text-center">Horas</th>
              <th class="px-4 py-3 text-center">Salones</th>
              <th class="px-4 py-3 text-left">Sede</th>
              <th class="px-4 py-3 text-center">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (d of docentes(); track d.id) {
              <tr class="hover:bg-indigo-50/40 cursor-pointer group" (click)="verDetalle(d)">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900 group-hover:text-indigo-700">{{ d.nombreCompleto }}</div>
                  <div class="text-xs text-gray-500">{{ d.email }} · DNI {{ d.dni }}</div>
                  <span class="badge text-[10px] mt-1" [ngClass]="tipoBadge(d.tipo)">{{ d.tipo }}</span>
                </td>
                <td class="px-4 py-3 text-gray-700 max-w-[200px]">
                  <span class="line-clamp-2">{{ d.especialidad }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="font-bold" [ngClass]="horasColor(d)">{{ d.horasAsignadas }}h</div>
                  <div class="text-[10px] text-gray-400">de {{ d.maxHoras }}h</div>
                  <div class="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div class="h-full rounded-full transition-all"
                      [ngClass]="horasBarColor(d)"
                      [style.width.%]="Math.min(100, (d.horasAsignadas / d.maxHoras) * 100)"></div>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="inline-flex items-center gap-1 text-indigo-700 font-semibold">
                    <span class="icon icon-sm">meeting_room</span>{{ d.totalSalones }}
                  </span>
                  <div class="text-[10px] text-gray-400">{{ d.totalAsignaciones }} asig.</div>
                </td>
                <td class="px-4 py-3 text-gray-600">{{ d.sede }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="badge text-[10px]" [ngClass]="estadoBadge(d.estado)">{{ d.estado }}</span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-end gap-0.5">
                    <button type="button" class="btn btn-ghost btn-icon text-indigo-600" title="Ver detalle" (click)="verDetalle(d)">
                      <span class="icon icon-sm">visibility</span>
                    </button>
                    <button type="button" class="btn btn-ghost btn-icon text-gray-600 hover:text-indigo-600" title="Editar" (click)="abrirModal(d)">
                      <span class="icon icon-sm">edit</span>
                    </button>
                    @if (d.estado === 'activo') {
                      <button type="button" class="btn btn-ghost btn-icon text-red-500" title="Desactivar" (click)="desactivar(d)">
                        <span class="icon icon-sm">person_off</span>
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (total() > 0) {
        <div class="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <span>
            Mostrando {{ inicio() + 1 }}–{{ fin() }} de {{ total() }} · {{ POR_PAGINA }} por página
          </span>
          @if (totalPaginas() > 1) {
            <div class="flex items-center gap-1">
              <button type="button" class="btn btn-icon btn-sm" [disabled]="paginaActual() === 1" (click)="irPagina(paginaActual() - 1)">‹</button>
              @for (p of paginas(); track p) {
                <button type="button" class="w-8 h-8 rounded-lg text-xs font-medium"
                  [ngClass]="p === paginaActual() ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                  (click)="irPagina(p)">{{ p }}</button>
              }
              <button type="button" class="btn btn-icon btn-sm" [disabled]="paginaActual() === totalPaginas()" (click)="irPagina(paginaActual() + 1)">›</button>
            </div>
          }
        </div>
      }
    }
  </div>
</div>

@if (detalle(); as d) {
  <div class="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm" (click)="cerrarDetalle()"></div>
  <div class="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-[90] flex flex-col animate-slide-in-r">
    <div class="relative overflow-hidden px-6 py-5 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-900 shrink-0">
      <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
      <div class="relative flex justify-between items-start gap-3">
        <div>
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/15 text-white border border-white/20">
            <span class="icon icon-sm">person</span> Ficha docente
          </span>
          <h2 class="text-xl font-black text-white mt-3 leading-tight">{{ d.nombreCompleto }}</h2>
          <p class="text-sm text-white/75 mt-1">{{ d.especialidad }}</p>
        </div>
        <button type="button" class="w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25" (click)="cerrarDetalle()">
          <span class="icon icon-sm">close</span>
        </button>
      </div>
      <div class="relative mt-4 grid grid-cols-3 gap-2">
        <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-3 text-center">
          <p class="text-[10px] uppercase tracking-wide text-white/70">Horas</p>
          <p class="text-lg font-black text-white">{{ d.horasAsignadas }}/{{ d.maxHoras }}</p>
        </div>
        <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-3 text-center">
          <p class="text-[10px] uppercase tracking-wide text-white/70">Asignaciones</p>
          <p class="text-lg font-black text-white">{{ d.totalAsignaciones }}</p>
        </div>
        <div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-3 text-center">
          <p class="text-[10px] uppercase tracking-wide text-white/70">Salones</p>
          <p class="text-lg font-black text-white">{{ d.totalSalones }}</p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-5">
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p class="text-[10px] uppercase text-gray-400 font-semibold">Email</p>
          <p class="font-medium text-gray-800 mt-0.5 truncate">{{ d.email }}</p>
        </div>
        <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p class="text-[10px] uppercase text-gray-400 font-semibold">Teléfono</p>
          <p class="font-medium text-gray-800 mt-0.5">{{ d.telefono || '—' }}</p>
        </div>
        <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p class="text-[10px] uppercase text-gray-400 font-semibold">Sede</p>
          <p class="font-medium text-gray-800 mt-0.5">{{ d.sede }}</p>
        </div>
        <div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p class="text-[10px] uppercase text-gray-400 font-semibold">Tipo / Estado</p>
          <p class="font-medium text-gray-800 mt-0.5 capitalize">{{ d.tipo }} · {{ d.estado }}</p>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
          <span class="icon text-indigo-500">schedule</span> Carga horaria asignada
        </h4>
        @if (d.asignaciones.length) {
          <div class="space-y-2">
            @for (a of d.asignaciones; track a.id) {
              <div class="p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="font-semibold text-gray-900">{{ a.cursoNombre }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ a.nivel }} · {{ a.grado }}</p>
                  </div>
                  <span class="badge badge-indigo text-[10px] shrink-0">{{ a.horasSemanales }}h/sem</span>
                </div>
                <div class="flex flex-wrap gap-1.5 mt-2">
                  @for (sec of a.secciones; track sec) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium">
                      <span class="icon icon-sm">meeting_room</span> Sec. {{ sec }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="p-6 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-400">
            Sin asignaciones en el año {{ anioEscolar }}. Configúralas en Académico → Asignación.
          </div>
        }
      </div>

      <div>
        <h4 class="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
          <span class="icon text-emerald-500">meeting_room</span> Salones vinculados
        </h4>
        @if (d.salones.length) {
          <div class="grid grid-cols-2 gap-2">
            @for (s of d.salones; track s.nivel + s.grado + s.seccion) {
              <div class="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <p class="font-semibold text-gray-900 text-sm">{{ s.grado }} {{ s.nivel }}</p>
                <p class="text-xs text-emerald-700 mt-0.5 flex items-center gap-1">
                  <span class="icon icon-sm">meeting_room</span> Sección {{ s.seccion }}
                </p>
                <p class="text-[10px] text-gray-500 mt-1">Aforo: {{ s.aforo }} alumnos</p>
              </div>
            }
          </div>
        } @else {
          <div class="p-6 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-400">
            No hay salones asociados a sus asignaciones.
          </div>
        }
      </div>
    </div>

    <div class="px-6 py-4 border-t bg-gray-50 flex gap-2 shrink-0">
      <button class="btn btn-primary flex-1" (click)="abrirModal(d); cerrarDetalle()">
        <span class="icon icon-sm">edit</span> Editar docente
      </button>
      <button class="btn btn-secondary" (click)="cerrarDetalle()">Cerrar</button>
    </div>
  </div>
}

@if (modalOpen()) {
  <div class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" (click)="cerrarModal()">
    <div class="card w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-in" (click)="$event.stopPropagation()">
      <h2 class="text-lg font-bold text-gray-900">{{ editId() ? 'Editar docente' : 'Nuevo docente' }}</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Nombres</label>
          <input class="form-input w-full" [(ngModel)]="form.nombres" />
        </div>
        <div>
          <label class="form-label">Apellidos</label>
          <input class="form-input w-full" [(ngModel)]="form.apellidos" />
        </div>
        <div>
          <label class="form-label">DNI</label>
          <input class="form-input w-full" maxlength="8" [(ngModel)]="form.dni" />
        </div>
        <div>
          <label class="form-label">Email</label>
          <input type="email" class="form-input w-full" [(ngModel)]="form.email" />
        </div>
        <div>
          <label class="form-label">Teléfono</label>
          <input class="form-input w-full" [(ngModel)]="form.telefono" />
        </div>
        <div>
          <label class="form-label">Sede</label>
          <input class="form-input w-full" [(ngModel)]="form.sede" placeholder="Sede Central" />
        </div>
      </div>

      <div>
        <label class="form-label">Especialización</label>
        <select class="form-input w-full" [(ngModel)]="form.especialidad">
          @for (esp of especialidades; track esp) {
            <option [value]="esp">{{ esp }}</option>
          }
        </select>
        @if (form.especialidad === 'Otra especialidad') {
          <input class="form-input w-full mt-2" [(ngModel)]="form.especialidadCustom" placeholder="Describe la especialidad..." />
        }
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Estado</label>
          <select class="form-input w-full" [(ngModel)]="form.estado">
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ editId() ? 'Nueva contraseña (opcional)' : 'Contraseña' }}</label>
          <input type="password" class="form-input w-full" [(ngModel)]="form.password" />
        </div>
      </div>

      <div class="flex gap-2 justify-end pt-2">
        <button class="btn btn-ghost" (click)="cerrarModal()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="svc.saving()" (click)="guardar()">
          {{ svc.saving() ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
}
  `,
})
export class MaestrosDocentesComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(MaestrosDocentesService);
  readonly Math = Math;

  readonly docentes = signal<DocenteItem[]>([]);
  readonly detalle = signal<DocenteDetail | null>(null);
  readonly error = signal('');
  readonly toast = signal<{ msg: string; type: 'ok' | 'error' } | null>(null);
  readonly modalOpen = signal(false);
  readonly editId = signal<number | null>(null);
  readonly paginaActual = signal(1);
  readonly totalPaginas = signal(1);
  readonly total = signal(0);
  readonly meta = signal({ activos: 0, horasAsignadas: 0, sobreCarga: 0 });

  readonly POR_PAGINA = 10;

  readonly estadosOpts = ESTADOS_DOCENTE;
  readonly especialidades = ESPECIALIDADES_DOCENTE;

  filtroEstado = '';
  readonly filtroBusqueda = signal('');
  anioEscolar = 2026;

  private busquedaTimer: ReturnType<typeof setTimeout> | null = null;

  form: DocenteFormState = this.formVacio();

  readonly inicio = computed(() => (this.paginaActual() - 1) * this.POR_PAGINA);
  readonly fin = computed(() => Math.min(this.inicio() + this.docentes().length, this.total()));

  readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const pages: number[] = [];
    const start = Math.max(1, actual - 2);
    const end = Math.min(total, start + 4);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  });

  readonly kpis = computed(() => {
    const m = this.meta();
    return [
      { label: 'Total docentes', value: this.total(), icon: 'groups', bg: 'bg-indigo-100', color: 'text-indigo-600' },
      { label: 'Activos', value: m.activos, icon: 'person', bg: 'bg-green-100', color: 'text-green-600', text: 'text-green-700' },
      { label: 'Horas asignadas', value: `${m.horasAsignadas}h`, icon: 'schedule', bg: 'bg-violet-100', color: 'text-violet-600' },
      { label: 'Sobre carga', value: m.sobreCarga, icon: 'warning', bg: 'bg-amber-100', color: 'text-amber-600', text: 'text-amber-700', border: m.sobreCarga ? 'border-l-4 border-amber-400' : '' },
    ];
  });

  ngOnInit(): void {
    this.layout.setTitle('Maestros · Docentes');
    this.cargar();
  }

  cargar(page = this.paginaActual()): void {
    this.error.set('');
    const busqueda = this.filtroBusqueda().trim();
    this.svc.list({
      estado: this.filtroEstado || undefined,
      busqueda: busqueda || undefined,
      anioEscolar: this.anioEscolar,
      page,
      pageSize: this.POR_PAGINA,
    }).subscribe({
      next: (data) => {
        this.docentes.set(data.items);
        this.total.set(data.total);
        this.totalPaginas.set(data.totalPages);
        this.paginaActual.set(data.page);
        this.meta.set(data.meta);
      },
      error: (err) => this.error.set(err.message),
    });
  }

  onFiltroChange(): void {
    this.paginaActual.set(1);
    this.cargar(1);
  }

  onBusquedaChange(value: string, immediate = false): void {
    this.filtroBusqueda.set(value);
    if (this.busquedaTimer) clearTimeout(this.busquedaTimer);
    const ejecutar = () => {
      this.paginaActual.set(1);
      this.cargar(1);
    };
    if (immediate) {
      ejecutar();
    } else {
      this.busquedaTimer = setTimeout(ejecutar, 350);
    }
  }

  buscar(): void {
    this.onBusquedaChange(this.filtroBusqueda(), true);
  }

  limpiarBusqueda(): void {
    this.onBusquedaChange('', true);
  }

  irPagina(page: number): void {
    if (page < 1 || page > this.totalPaginas()) return;
    this.cargar(page);
  }

  verDetalle(docente: DocenteItem): void {
    this.svc.getById(docente.id, this.anioEscolar).subscribe({
      next: (detail) => this.detalle.set(detail),
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  cerrarDetalle(): void {
    this.detalle.set(null);
  }

  abrirModal(docente?: DocenteItem): void {
    this.editId.set(docente?.id ?? null);
    const esp = docente?.especialidad ?? ESPECIALIDADES_DOCENTE[0];
    const esCustom = !ESPECIALIDADES_DOCENTE.includes(esp);
    this.form = {
      nombres: docente?.nombres ?? '',
      apellidos: docente?.apellidos ?? '',
      dni: docente?.dni ?? '',
      email: docente?.email ?? '',
      telefono: docente?.telefono ?? '',
      sede: docente?.sede ?? 'Sede Central',
      estado: docente?.estado ?? 'activo',
      especialidad: esCustom ? 'Otra especialidad' : esp,
      especialidadCustom: esCustom ? esp : '',
      password: '',
    };
    this.modalOpen.set(true);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
    this.editId.set(null);
  }

  guardar(): void {
    const nombres = this.form.nombres.trim();
    const apellidos = this.form.apellidos.trim();
    const dni = this.form.dni.trim();
    const email = this.form.email.trim();
    const especialidad =
      this.form.especialidad === 'Otra especialidad'
        ? this.form.especialidadCustom.trim()
        : this.form.especialidad.trim();

    if (!nombres || !apellidos || !dni || !email || !especialidad) {
      this.mostrarToast('Complete los campos obligatorios', 'error');
      return;
    }

    const editId = this.editId();
    const payload = {
      nombres,
      apellidos,
      dni,
      email,
      telefono: this.form.telefono.trim(),
      sede: this.form.sede.trim() || 'Sede Central',
      estado: this.form.estado,
      especialidad,
    };

    if (!editId && !this.form.password.trim()) {
      this.mostrarToast('La contraseña es obligatoria para nuevos docentes', 'error');
      return;
    }

    const req = editId
      ? this.svc.update(editId, {
          ...payload,
          ...(this.form.password.trim() ? { password: this.form.password.trim() } : {}),
        })
      : this.svc.create({ ...payload, password: this.form.password.trim() });

    req.subscribe({
      next: () => {
        this.cerrarModal();
        this.mostrarToast(editId ? 'Docente actualizado' : 'Docente registrado', 'ok');
        this.cargar(this.paginaActual());
      },
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  desactivar(docente: DocenteItem): void {
    if (!confirm(`¿Desactivar a ${docente.nombreCompleto}?`)) return;
    this.svc.remove(docente.id).subscribe({
      next: () => {
        this.mostrarToast('Docente desactivado', 'ok');
        const page = this.docentes().length === 1 && this.paginaActual() > 1
          ? this.paginaActual() - 1
          : this.paginaActual();
        this.cargar(page);
      },
      error: (err) => this.mostrarToast(err.message, 'error'),
    });
  }

  tipoBadge(tipo: string): string {
    return tipo === 'contratado' ? 'badge-orange' : 'badge-blue';
  }

  estadoBadge(estado: string): string {
    return ({ activo: 'badge-green', inactivo: 'badge-gray', bloqueado: 'badge-red' } as Record<string, string>)[estado] ?? 'badge-gray';
  }

  horasColor(d: DocenteItem): string {
    if (d.horasAsignadas > d.maxHoras) return 'text-red-600';
    if (d.horasAsignadas >= d.maxHoras * 0.85) return 'text-amber-600';
    return 'text-indigo-700';
  }

  horasBarColor(d: DocenteItem): string {
    if (d.horasAsignadas > d.maxHoras) return 'bg-red-500';
    if (d.horasAsignadas >= d.maxHoras * 0.85) return 'bg-amber-500';
    return 'bg-indigo-500';
  }

  private formVacio(): DocenteFormState {
    return {
      nombres: '',
      apellidos: '',
      dni: '',
      email: '',
      telefono: '',
      sede: 'Sede Central',
      estado: 'activo',
      especialidad: ESPECIALIDADES_DOCENTE[0],
      especialidadCustom: '',
      password: '',
    };
  }

  private mostrarToast(msg: string, type: 'ok' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
