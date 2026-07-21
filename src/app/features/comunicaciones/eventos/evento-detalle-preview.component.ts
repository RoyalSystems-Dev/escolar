import { Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  ESTADOS_EVENTO,
  EventoEstado,
  EventoItem,
  EventoTipo,
  TIPOS_EVENTO,
  resolveVisibilidadEvento,
} from './eventos.model';

const TIPO_PREVIEW: Record<
  EventoTipo,
  { gradient: string; glow: string; pattern: string }
> = {
  academico: {
    gradient: 'from-indigo-600 via-violet-600 to-indigo-900',
    glow: 'bg-indigo-400/30',
    pattern: 'school',
  },
  deportivo: {
    gradient: 'from-emerald-500 via-green-600 to-teal-800',
    glow: 'bg-emerald-400/30',
    pattern: 'sports_soccer',
  },
  cultural: {
    gradient: 'from-fuchsia-500 via-purple-600 to-violet-900',
    glow: 'bg-fuchsia-400/30',
    pattern: 'theater_comedy',
  },
  reunion: {
    gradient: 'from-sky-500 via-blue-600 to-blue-900',
    glow: 'bg-sky-400/30',
    pattern: 'groups',
  },
  feriado: {
    gradient: 'from-amber-400 via-orange-500 to-amber-700',
    glow: 'bg-amber-300/40',
    pattern: 'beach_access',
  },
  otro: {
    gradient: 'from-slate-500 via-gray-600 to-slate-800',
    glow: 'bg-slate-400/30',
    pattern: 'event_note',
  },
};

@Component({
  selector: 'app-evento-detalle-preview',
  standalone: true,
  imports: [NgClass],
  template: `
    @if (evento(); as e) {
      <div
        class="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evento-preview-title"
      >
        <div
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
          (click)="closed.emit()"
        ></div>

        <div
          class="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl bg-white animate-scale-in flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <!-- Hero -->
          <div
            class="relative overflow-hidden px-6 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 shrink-0"
            [ngClass]="'bg-gradient-to-br ' + previewCfg().gradient"
          >
            <div
              class="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl"
              [ngClass]="previewCfg().glow"
            ></div>
            <div
              class="absolute -bottom-16 -left-8 w-52 h-52 rounded-full blur-3xl opacity-60"
              [ngClass]="previewCfg().glow"
            ></div>
            <div
              class="absolute inset-0 opacity-[0.07]"
              style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"
            ></div>

            <div class="relative flex items-start justify-between gap-4">
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/15 text-white/95 backdrop-blur-sm border border-white/20"
                >
                  <span class="icon icon-sm">visibility</span>
                  Vista previa del portal
                </span>
              </div>
              <button
                type="button"
                class="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors backdrop-blur-sm border border-white/20"
                (click)="closed.emit()"
                aria-label="Cerrar"
              >
                <span class="icon icon-sm">close</span>
              </button>
            </div>

            <div class="relative mt-6 flex gap-5 items-start">
              <div
                class="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex flex-col items-center justify-center text-white shadow-lg"
              >
                <span class="text-3xl sm:text-4xl font-black leading-none">{{
                  diaMes().dia
                }}</span>
                <span class="text-[11px] sm:text-xs font-bold uppercase tracking-widest mt-1 opacity-90">{{
                  diaMes().mes
                }}</span>
              </div>

              <div class="min-w-0 flex-1 pt-1">
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm"
                  >
                    <span class="icon icon-sm">{{ previewCfg().pattern }}</span>
                    {{ tipoLabel() }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold backdrop-blur-sm"
                    [ngClass]="estadoBadgeClass()"
                  >
                    {{ estadoLabel() }}
                  </span>
                  @if (e.cancelado) {
                    <span
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-500/80 text-white"
                    >
                      <span class="icon icon-sm">block</span> Cancelado
                    </span>
                  }
                </div>
                <h2
                  id="evento-preview-title"
                  class="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-sm"
                >
                  {{ e.titulo }}
                </h2>
                @if (institucion()) {
                  <p class="mt-2 text-sm text-white/75 flex items-center gap-1.5">
                    <span class="icon icon-sm">account_balance</span>
                    {{ institucion() }}
                  </p>
                }
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="relative -mt-10 flex-1 overflow-y-auto px-5 sm:px-7 pb-6">
            <div
              class="rounded-2xl bg-white border border-gray-100 shadow-xl p-5 sm:p-6 space-y-5"
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  class="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/80 border border-indigo-100"
                >
                  <div
                    class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"
                  >
                    <span class="icon">calendar_month</span>
                  </div>
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                      Fecha
                    </p>
                    <p class="text-sm font-bold text-gray-900 mt-0.5">{{ rangoFecha() }}</p>
                    @if (esMultidia()) {
                      <p class="text-xs text-indigo-600 mt-0.5">Evento de varios días</p>
                    }
                  </div>
                </div>

                <div
                  class="flex items-start gap-3 p-4 rounded-xl bg-violet-50/80 border border-violet-100"
                >
                  <div
                    class="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0"
                  >
                    <span class="icon">schedule</span>
                  </div>
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-violet-500">
                      Horario
                    </p>
                    <p class="text-sm font-bold text-gray-900 mt-0.5">{{ e.horario }}</p>
                  </div>
                </div>

                @if (e.lugar) {
                  <div
                    class="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/80 border border-emerald-100 sm:col-span-2"
                  >
                    <div
                      class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"
                    >
                      <span class="icon">place</span>
                    </div>
                    <div>
                      <p class="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                        Lugar
                      </p>
                      <p class="text-sm font-bold text-gray-900 mt-0.5">{{ e.lugar }}</p>
                    </div>
                  </div>
                }
              </div>

              <div
                class="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-100"
              >
                <div
                  class="w-11 h-11 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600"
                >
                  <span class="icon">{{ visibilidadInfo().icon }}</span>
                </div>
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Visibilidad
                  </p>
                  <p class="text-sm font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                    <span class="badge text-[10px]" [ngClass]="visibilidadInfo().badge">
                      {{ visibilidadInfo().tipoLabel }}
                    </span>
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ visibilidadInfo().detalle }}</p>
                </div>
                @if (e.publicado) {
                  <span
                    class="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700"
                  >
                    <span class="icon icon-sm">campaign</span> Publicado
                  </span>
                } @else {
                  <span
                    class="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"
                  >
                    <span class="icon icon-sm">visibility_off</span> Borrador
                  </span>
                }
              </div>

              @if (e.descripcion) {
                <div>
                  <p
                    class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5"
                  >
                    <span class="icon icon-sm">description</span> Acerca del evento
                  </p>
                  <p class="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                    {{ e.descripcion }}
                  </p>
                </div>
              }

              @if (e.responsable) {
                <div
                  class="flex items-center gap-3 pt-4 border-t border-gray-100 text-sm text-gray-600"
                >
                  <div
                    class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                  >
                    <span class="icon icon-sm">badge</span>
                  </div>
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Organiza
                    </p>
                    <p class="font-medium text-gray-800">{{ e.responsable }}</p>
                  </div>
                </div>
              }

              <div
                class="rounded-xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100/80 p-4 flex items-start gap-3"
              >
                <span class="icon text-indigo-500 mt-0.5">info</span>
                <p class="text-xs text-indigo-900/80 leading-relaxed">
                  Así verán alumnos, padres y docentes este evento en el calendario institucional.
                  Mantén la información clara y actualizada para que toda la comunidad esté informada.
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="shrink-0 px-5 sm:px-7 py-4 border-t border-gray-100 bg-gray-50/80 flex flex-wrap gap-2 justify-end"
          >
            @if (showEdit()) {
              <button type="button" class="btn btn-primary" (click)="edit.emit(e)">
                <span class="icon icon-sm">edit</span> Editar evento
              </button>
            }
            <button type="button" class="btn btn-secondary" (click)="closed.emit()">
              Cerrar vista previa
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class EventoDetallePreviewComponent {
  readonly evento = input<EventoItem | null>(null);
  readonly institucion = input('');
  readonly showEdit = input(false);

  readonly closed = output<void>();
  readonly edit = output<EventoItem>();

  readonly previewCfg = computed(() => {
    const tipo = this.evento()?.tipo ?? 'otro';
    return TIPO_PREVIEW[tipo];
  });

  readonly diaMes = computed(() => {
    const iso = this.evento()?.fechaInicio ?? '';
    const [y, m, d] = iso.split('-').map(Number);
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];
    return { dia: d || '—', mes: meses[(m || 1) - 1] ?? '', anio: y };
  });

  readonly tipoLabel = computed(() => {
    const tipo = this.evento()?.tipo;
    return TIPOS_EVENTO.find((t) => t.value === tipo)?.label ?? 'Evento';
  });

  readonly estadoLabel = computed(() => {
    const estado = this.evento()?.estado;
    return ESTADOS_EVENTO.find((e) => e.value === estado)?.label ?? estado ?? '';
  });

  readonly visibilidadInfo = computed(() => {
    const e = this.evento();
    if (!e) {
      return resolveVisibilidadEvento({
        visibilidad: 'global',
        destinatarios: 'todos',
        nivel: '',
        grado: '',
        seccion: '',
      });
    }
    return resolveVisibilidadEvento(e);
  });

  readonly esMultidia = computed(() => {
    const e = this.evento();
    if (!e?.fechaFin) return false;
    return e.fechaFin !== e.fechaInicio;
  });

  rangoFecha(): string {
    const e = this.evento();
    if (!e) return '';
    if (!e.fechaFinDisplay || e.fechaFinDisplay === e.fechaInicioDisplay) {
      return e.fechaInicioDisplay;
    }
    return `${e.fechaInicioDisplay} – ${e.fechaFinDisplay}`;
  }

  estadoBadgeClass(): string {
    const estado = this.evento()?.estado as EventoEstado | undefined;
    const map: Record<EventoEstado, string> = {
      programado: 'bg-blue-500/80 text-white',
      en_curso: 'bg-green-500/80 text-white',
      finalizado: 'bg-white/25 text-white',
      cancelado: 'bg-red-500/80 text-white',
    };
    return map[estado ?? 'programado'];
  }
}
