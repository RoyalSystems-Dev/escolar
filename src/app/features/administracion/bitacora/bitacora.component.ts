import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { BitacoraService } from './bitacora.service';
import {
  ACCIONES_BITACORA,
  BitacoraFilters,
  BitacoraItem,
  BitacoraResumen,
  MODULOS_BITACORA,
  NIVELES_BITACORA,
  accionBadge,
  accionLabel,
  moduloIcon,
  moduloLabel,
  nivelBadge,
  nivelLabel,
} from './bitacora.model';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="space-y-5 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Bitácora del Sistema</h2>
          <p class="text-sm text-gray-400 mt-0.5">
            Registro de acciones y eventos de auditoría del sistema escolar
            · se conservan los últimos 15 días
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="cargar()" [disabled]="svc.loading()">
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
              <p class="text-xl font-bold" [ngClass]="kpi.text ?? 'text-gray-900'">{{ kpi.value }}</p>
            </div>
          </div>
        }
      </div>

      @if (resumen()?.porModulo?.length) {
        <div class="card p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actividad por módulo</p>
          <div class="flex flex-wrap gap-2">
            @for (m of resumen()!.porModulo; track m.modulo) {
              <button type="button" class="badge badge-gray text-xs cursor-pointer hover:bg-indigo-50"
                (click)="setFiltro('modulo', m.modulo)">
                {{ moduloLabel(m.modulo) }} · {{ m.total }}
              </button>
            }
          </div>
        </div>
      }

      <div class="card p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label class="form-label mb-1 block">Módulo</label>
            <select class="form-select" [ngModel]="filtro().modulo" (ngModelChange)="setFiltro('modulo', $event)">
              @for (m of modulos; track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Acción</label>
            <select class="form-select" [ngModel]="filtro().accion" (ngModelChange)="setFiltro('accion', $event)">
              @for (a of acciones; track a.value) {
                <option [value]="a.value">{{ a.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Nivel</label>
            <select class="form-select" [ngModel]="filtro().nivel" (ngModelChange)="setFiltro('nivel', $event)">
              @for (n of niveles; track n.value) {
                <option [value]="n.value">{{ n.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Usuario</label>
            <input class="form-input" placeholder="Nombre o rol..."
              [ngModel]="filtro().usuario" (ngModelChange)="setFiltro('usuario', $event)">
          </div>
          <div>
            <label class="form-label mb-1 block">Desde</label>
            <input type="date" class="form-input" [ngModel]="filtro().desde" (ngModelChange)="setFiltro('desde', $event)">
          </div>
          <div>
            <label class="form-label mb-1 block">Hasta</label>
            <input type="date" class="form-input" [ngModel]="filtro().hasta" (ngModelChange)="setFiltro('hasta', $event)">
          </div>
          <div class="sm:col-span-2">
            <label class="form-label mb-1 block">Buscar</label>
            <div class="relative">
              <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input class="form-input pl-10" placeholder="Descripción, entidad o ID..."
                [ngModel]="filtro().busqueda" (ngModelChange)="setFiltro('busqueda', $event)">
            </div>
          </div>
        </div>
      </div>

      @if (svc.loading()) {
        <div class="card p-12 flex flex-col items-center text-gray-400">
          <span class="icon icon-xl animate-spin mb-3">progress_activity</span>
          <p class="text-sm">Cargando bitácora…</p>
        </div>
      } @else if (!items().length) {
        <div class="card p-16 flex flex-col items-center justify-center text-center">
          <span class="icon icon-2xl text-indigo-300 mb-4">history</span>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Sin registros</h3>
          <p class="text-gray-500 text-sm">No hay eventos que coincidan con los filtros seleccionados.</p>
        </div>
      } @else {
        <div class="card overflow-hidden">
          <div class="divide-y divide-gray-100">
            @for (item of items(); track item.id) {
              <button type="button"
                class="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors flex gap-4"
                [ngClass]="item.nivel === 'critical' ? 'bg-red-50/40' : item.nivel === 'warning' ? 'bg-amber-50/30' : ''"
                (click)="seleccionar(item)">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span class="icon text-indigo-500 text-base">{{ moduloIcon(item.modulo) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="font-semibold text-gray-900 text-sm">{{ item.descripcion }}</span>
                    <span class="badge text-[10px]" [ngClass]="accionBadge(item.accion)">{{ accionLabel(item.accion) }}</span>
                    <span class="badge text-[10px]" [ngClass]="nivelBadge(item.nivel)">{{ nivelLabel(item.nivel) }}</span>
                  </div>
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span class="flex items-center gap-1">
                      <span class="icon text-xs">person</span>
                      {{ item.usuarioNombre }}
                      @if (item.usuarioRol) { <span class="text-gray-400">· {{ item.usuarioRol }}</span> }
                    </span>
                    <span>{{ moduloLabel(item.modulo) }}</span>
                    @if (item.entidadId) {
                      <span>{{ item.entidad }} #{{ item.entidadId }}</span>
                    }
                    @if (item.ip) {
                      <span>IP {{ item.ip }}</span>
                    }
                  </div>
                </div>
                <div class="text-right shrink-0 text-xs text-gray-400">
                  <p class="font-medium text-gray-600">{{ item.fechaDisplay }}</p>
                  <p>{{ item.horaDisplay }}</p>
                </div>
              </button>
            }
          </div>
        </div>
      }
    </div>

    @if (detalle()) {
      <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        (click)="detalle.set(null)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-lg font-bold text-gray-900">Detalle del registro</h3>
            <button class="text-gray-400 hover:text-gray-700 text-2xl" (click)="detalle.set(null)">×</button>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm">
            @let d = detalle()!;
            <div>
              <p class="text-xs text-gray-400 mb-1">Descripción</p>
              <p class="font-medium text-gray-800">{{ d.descripcion }}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-400 mb-1">Usuario</p>
                <p class="text-gray-800">{{ d.usuarioNombre }}</p>
                <p class="text-xs text-gray-500">{{ d.usuarioRol || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 mb-1">Fecha y hora</p>
                <p class="text-gray-800">{{ d.fechaDisplay }} {{ d.horaDisplay }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 mb-1">Módulo</p>
                <p class="text-gray-800">{{ moduloLabel(d.modulo) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 mb-1">Acción</p>
                <span class="badge text-xs" [ngClass]="accionBadge(d.accion)">{{ accionLabel(d.accion) }}</span>
              </div>
              <div>
                <p class="text-xs text-gray-400 mb-1">Entidad</p>
                <p class="text-gray-800">{{ d.entidad }} @if (d.entidadId) { #{{ d.entidadId }} }</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 mb-1">Nivel</p>
                <span class="badge text-xs" [ngClass]="nivelBadge(d.nivel)">{{ nivelLabel(d.nivel) }}</span>
              </div>
              @if (d.ip) {
                <div class="col-span-2">
                  <p class="text-xs text-gray-400 mb-1">Dirección IP</p>
                  <p class="text-gray-800 font-mono">{{ d.ip }}</p>
                </div>
              }
            </div>
            @if (d.detalle && keysDetalle(d.detalle).length) {
              <div>
                <p class="text-xs text-gray-400 mb-2">Datos adicionales</p>
                <div class="bg-gray-50 rounded-xl p-4 space-y-2">
                  @for (key of keysDetalle(d.detalle); track key) {
                    <div class="flex justify-between gap-4 text-xs">
                      <span class="text-gray-500 capitalize">{{ key }}</span>
                      <span class="text-gray-800 font-medium text-right">{{ formatDetalle(d.detalle![key]) }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class BitacoraComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(BitacoraService);

  readonly modulos = MODULOS_BITACORA;
  readonly acciones = ACCIONES_BITACORA;
  readonly niveles = NIVELES_BITACORA;

  readonly items = signal<BitacoraItem[]>([]);
  readonly resumen = signal<BitacoraResumen | null>(null);
  readonly detalle = signal<BitacoraItem | null>(null);
  readonly filtro = signal<BitacoraFilters>({
    modulo: '',
    accion: '',
    nivel: '',
    usuario: '',
    desde: '',
    hasta: '',
    busqueda: '',
  });

  readonly kpis = computed(() => {
    const r = this.resumen();
    if (!r) return [];
    return [
      { label: 'Total registros', value: r.total, icon: 'history', bg: 'bg-indigo-50', color: 'text-indigo-600' },
      { label: 'Hoy', value: r.hoy, icon: 'today', bg: 'bg-blue-50', color: 'text-blue-600' },
      { label: 'Advertencias', value: r.advertencias, icon: 'warning', bg: 'bg-amber-50', color: 'text-amber-600', text: 'text-amber-700' },
      { label: 'Críticos', value: r.criticos, icon: 'error', bg: 'bg-red-50', color: 'text-red-600', text: 'text-red-600' },
    ];
  });

  accionLabel = accionLabel;
  accionBadge = accionBadge;
  nivelLabel = nivelLabel;
  nivelBadge = nivelBadge;
  moduloLabel = moduloLabel;
  moduloIcon = moduloIcon;

  private busquedaTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.layout.setTitle('Bitácora del Sistema');
    this.cargar();
  }

  cargar(): void {
    const f = this.filtro();
    this.svc.load({
      modulo: f.modulo || undefined,
      accion: f.accion || undefined,
      nivel: f.nivel || undefined,
      usuario: f.usuario || undefined,
      desde: f.desde || undefined,
      hasta: f.hasta || undefined,
      busqueda: f.busqueda || undefined,
    }).subscribe({
      next: res => {
        this.items.set(res.items);
        this.resumen.set(res.resumen);
      },
      error: () => {
        this.items.set([]);
        this.resumen.set(null);
      },
    });
  }

  setFiltro(campo: keyof BitacoraFilters, valor: string): void {
    this.filtro.update(f => ({ ...f, [campo]: valor }));
    if (campo === 'busqueda') {
      clearTimeout(this.busquedaTimer);
      this.busquedaTimer = setTimeout(() => this.cargar(), 350);
      return;
    }
    this.cargar();
  }

  seleccionar(item: BitacoraItem): void {
    this.detalle.set(item);
  }

  keysDetalle(detalle: Record<string, unknown>): string[] {
    return Object.keys(detalle);
  }

  formatDetalle(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
