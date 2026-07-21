import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { InstitucionalService } from '../../administracion/institucional/institucional.service';
import { Nivel } from '../../administracion/institucional/institucional.model';
import { AlertasService } from './alertas.service';
import {
  AlertaAusentismo,
  AlertSettings,
  MESES_ALERTAS,
  NivelAlerta,
} from './alertas.model';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [FormsModule, NgClass, RouterLink],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Alertas de Ausentismo</h2>
          <p class="text-sm text-gray-400 mt-0.5">
            Monitoreo de alumnos que superan el umbral de inasistencias
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="cargar()">
          <span class="icon icon-sm">refresh</span> Actualizar
        </button>
      </div>

      <!-- Maestro de configuración -->
      <div class="card p-5 border-l-4 border-indigo-400">
        <div class="flex flex-col lg:flex-row lg:items-end gap-4">
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 flex items-center gap-2">
              <span class="icon text-indigo-500">tune</span>
              Configuración de alertas (Maestro)
            </h3>
            <p class="text-xs text-gray-500 mt-1">
              Define cuántos días de ausencia injustificada (totales o consecutivos) activan una alerta.
            </p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[420px]">
            <div>
              <label class="form-label mb-1 block">Días para alerta temprana</label>
              <input type="number" class="form-input" min="1" max="30"
                [(ngModel)]="settingsForm.diasAlertaAusentismo">
              <p class="text-[11px] text-gray-400 mt-1">Alerta si supera este valor (ej. 2 → desde el 3.er día)</p>
            </div>
            <div>
              <label class="form-label mb-1 block">Días para alerta crítica</label>
              <input type="number" class="form-input" min="2" max="60"
                [(ngModel)]="settingsForm.diasAlertaCritica">
              <p class="text-[11px] text-gray-400 mt-1">Nivel de riesgo alto</p>
            </div>
          </div>
          <button class="btn btn-primary btn-sm shrink-0" (click)="guardarSettings()"
            [disabled]="svc.saving()">
            {{ svc.saving() ? 'Guardando...' : 'Guardar configuración' }}
          </button>
        </div>
        @if (settings()) {
          <div class="mt-3 pt-3 border-t text-xs text-gray-500 flex flex-wrap gap-4">
            <span>Umbral actual: <strong class="text-amber-600">{{ settings()!.diasAlertaAusentismo }} días</strong></span>
            <span>Crítico: <strong class="text-red-600">{{ settings()!.diasAlertaCritica }} días</strong></span>
          </div>
        }
        @if (errorSettings()) {
          <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {{ errorSettings() }}
          </div>
        }
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
          <div>
            <label class="form-label mb-1 block">Severidad</label>
            <select class="form-select" [ngModel]="filtro().severidad" (ngModelChange)="setFiltro('severidad', $event)">
              <option value="todos">Todas</option>
              <option value="alerta">Alerta temprana</option>
              <option value="critico">Críticas</option>
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Buscar</label>
            <div class="relative">
              <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input class="form-input pl-10" placeholder="Nombre del alumno..."
                [ngModel]="filtro().busqueda" (ngModelChange)="setFiltro('busqueda', $event)">
            </div>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Severidad</th>
                <th>Estudiante</th>
                <th>Nivel / Grado</th>
                <th class="text-center">Injustificadas</th>
                <th class="text-center">Consecutivas</th>
                <th>Última falta</th>
                <th>Motivo</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @if (svc.loading()) {
                <tr><td colspan="8" class="py-12 text-center text-gray-400">Cargando alertas...</td></tr>
              } @else {
                @for (a of alertasFiltradas(); track a.studentId) {
                  <tr [class.bg-red-50]="a.nivelAlerta === 'critico'">
                    <td>
                      <span class="badge text-[11px]" [ngClass]="severidadBadge(a.nivelAlerta)">
                        {{ severidadLabel(a.nivelAlerta) }}
                      </span>
                    </td>
                    <td>
                      <div class="font-medium text-gray-900">{{ a.estudiante }}</div>
                      <div class="text-xs text-gray-400">Sección {{ a.seccion }}</div>
                    </td>
                    <td>
                      <span class="badge text-[11px]" [ngClass]="nivelBadge(a.nivel)">{{ a.nivel }}</span>
                      <div class="text-sm text-gray-700 mt-1">{{ a.grado }}</div>
                    </td>
                    <td class="text-center">
                      <span class="font-bold text-red-600 text-lg">{{ a.faltasInjustificadas }}</span>
                    </td>
                    <td class="text-center">
                      <span class="font-bold" [ngClass]="a.diasConsecutivos > (settings()?.diasAlertaAusentismo ?? 2) ? 'text-amber-600' : 'text-gray-600'">
                        {{ a.diasConsecutivos }}
                      </span>
                    </td>
                    <td class="text-sm text-gray-500">{{ a.ultimaFalta ?? '—' }}</td>
                    <td class="text-xs text-gray-600 max-w-[180px]">{{ a.motivoAlerta }}</td>
                    <td>
                      <div class="flex items-center gap-1 justify-center">
                        <a routerLink="/asistencia/justificaciones" class="btn-icon text-blue-500 hover:bg-blue-50" title="Justificar">
                          <span class="icon icon-sm">fact_check</span>
                        </a>
                        <button class="btn-icon text-amber-500 hover:bg-amber-50" title="Notificar apoderado"
                          (click)="notificar(a)">
                          <span class="icon icon-sm">notifications</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="py-12 text-center">
                      <span class="icon icon-2xl text-green-200 block mb-2">verified</span>
                      <p class="text-gray-400 text-sm">No hay alertas de ausentismo con los filtros actuales</p>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-900">
          <p class="font-bold mb-1 flex items-center gap-1">
            <span class="icon icon-sm">warning</span> Alerta temprana
          </p>
          <p>Se activa cuando un alumno supera {{ settings()?.diasAlertaAusentismo ?? 2 }} días de falta injustificada (total o consecutiva).</p>
        </div>
        <div class="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-900">
          <p class="font-bold mb-1 flex items-center gap-1">
            <span class="icon icon-sm">error</span> Alerta crítica
          </p>
          <p>Indica riesgo alto cuando supera {{ settings()?.diasAlertaCritica ?? 5 }} días. Requiere seguimiento inmediato.</p>
        </div>
      </div>
    </div>

    @if (notificacion(); as n) {
      <div class="fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 text-white"
        [ngClass]="n.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'">
        <span class="icon">{{ n.tipo === 'success' ? 'check_circle' : 'error' }}</span>
        {{ n.mensaje }}
      </div>
    }
  `,
})
export class AlertasComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(AlertasService);
  private readonly institucional = inject(InstitucionalService);

  readonly meses = MESES_ALERTAS;

  readonly settings = signal<AlertSettings | null>(null);
  readonly errorSettings = signal('');
  readonly notificacion = signal<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  private readonly _alertas = signal<AlertaAusentismo[]>([]);
  private readonly _niveles = signal<Nivel[]>([]);
  readonly niveles = this._niveles.asReadonly();

  settingsForm: AlertSettings = { diasAlertaAusentismo: 2, diasAlertaCritica: 5 };

  readonly filtro = signal({
    nivel: '',
    grado: '',
    mes: '2026-06',
    busqueda: '',
    severidad: 'todos',
  });

  readonly gradosDisponibles = computed(() => {
    const nivel = this._niveles().find((n) => n.nombre === this.filtro().nivel);
    return nivel?.grados.map((g) => g.nombre) ?? [];
  });

  readonly alertasFiltradas = computed(() => {
    let list = this._alertas();
    const sev = this.filtro().severidad;
    if (sev === 'alerta') list = list.filter((a) => a.nivelAlerta === 'alerta');
    if (sev === 'critico') list = list.filter((a) => a.nivelAlerta === 'critico');

    const q = this.filtro().busqueda.toLowerCase().trim();
    if (q) {
      list = list.filter((a) =>
        `${a.estudiante} ${a.grado} ${a.nivel}`.toLowerCase().includes(q),
      );
    }
    return list;
  });

  readonly kpis = computed(() => {
    const alertas = this._alertas();
    const criticos = alertas.filter((a) => a.nivelAlerta === 'critico');
    const tempranas = alertas.filter((a) => a.nivelAlerta === 'alerta');
    return [
      {
        label: 'Total alertas',
        value: alertas.length,
        icon: 'notifications_active',
        bg: 'bg-indigo-100',
        color: 'text-indigo-600',
      },
      {
        label: 'Alerta temprana',
        value: tempranas.length,
        icon: 'warning',
        bg: 'bg-amber-100',
        color: 'text-amber-600',
        text: 'text-amber-600',
        border: 'border-l-4 border-amber-400',
      },
      {
        label: 'Críticas',
        value: criticos.length,
        icon: 'error',
        bg: 'bg-red-100',
        color: 'text-red-600',
        text: 'text-red-600',
        border: 'border-l-4 border-red-400',
      },
      {
        label: 'Faltas acumuladas',
        value: alertas.reduce((s, a) => s + a.faltasInjustificadas, 0),
        icon: 'event_busy',
        bg: 'bg-gray-100',
        color: 'text-gray-600',
      },
    ];
  });

  ngOnInit(): void {
    this.layout.setTitle('Alertas de Ausentismo');
    this.institucional.loadEducationLevels().subscribe({
      next: (niveles) => this._niveles.set(niveles),
    });
    this.cargar();
  }

  cargar(): void {
    const { nivel, grado, mes, busqueda } = this.filtro();
    this.svc
      .loadAlerts({
        nivel: nivel || undefined,
        grado: grado || undefined,
        mes: mes || undefined,
        busqueda: busqueda || undefined,
      })
      .subscribe({
        next: (res) => {
          this._alertas.set(res.alerts);
          this.settings.set(res.settings);
          this.settingsForm = { ...res.settings };
        },
        error: () => this.mostrarNotificacion('No se pudieron cargar las alertas', 'error'),
      });
  }

  setFiltro(
    campo: 'nivel' | 'grado' | 'mes' | 'busqueda' | 'severidad',
    valor: string,
  ): void {
    this.filtro.update((f) => {
      const next = { ...f, [campo]: valor };
      if (campo === 'nivel') next.grado = '';
      return next;
    });
    if (campo !== 'busqueda' && campo !== 'severidad') this.cargar();
  }

  guardarSettings(): void {
    this.errorSettings.set('');
    if (this.settingsForm.diasAlertaCritica <= this.settingsForm.diasAlertaAusentismo) {
      this.errorSettings.set('La alerta crítica debe ser mayor que la alerta temprana');
      return;
    }

    this.svc.updateSettings(this.settingsForm).subscribe({
      next: (res) => {
        this.settings.set(res);
        this.settingsForm = { ...res };
        this.cargar();
        this.mostrarNotificacion('Configuración de alertas actualizada');
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.errorSettings.set(
          Array.isArray(msg) ? msg.join(', ') : msg ?? 'No se pudo guardar la configuración',
        );
      },
    });
  }

  notificar(alerta: AlertaAusentismo): void {
    this.mostrarNotificacion(
      `Notificación enviada al apoderado de ${alerta.estudiante.split(',')[0]}`,
    );
  }

  severidadBadge(n: NivelAlerta): string {
    return n === 'critico' ? 'badge-red' : 'badge-yellow';
  }

  severidadLabel(n: NivelAlerta): string {
    return n === 'critico' ? 'Crítica' : 'Alerta';
  }

  nivelBadge(nivel: string): string {
    return {
      Inicial: 'badge-purple',
      Primaria: 'badge-blue',
      Secundaria: 'badge-indigo',
    }[nivel] ?? 'badge-gray';
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' = 'success'): void {
    this.notificacion.set({ mensaje, tipo });
    setTimeout(() => this.notificacion.set(null), 3000);
  }
}
