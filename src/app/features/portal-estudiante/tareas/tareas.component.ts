import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { HorariosService } from '../../academico/horarios/services/horarios.service';
import { TareasEstudianteService } from './tareas-estudiante.service';
import {
  ACCEPT_ENTREGA,
  MAX_ENTREGA_BYTES,
  TareaEstudiante,
  TareaVista,
  cursoStyle,
  fileAccentForName,
  fileIconForName,
  formatFileSize,
  taskFileUrl,
} from './tareas.model';

@Component({
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="space-y-5 animate-fade-in">
      @if (toast()) {
        <div class="fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-5 py-3.5 rounded-xl shadow-2xl border animate-slide-in-r max-w-sm"
          [ngClass]="toast()!.tipo === 'ok' ? 'bg-white border-emerald-300' : 'bg-white border-red-300'">
          <span class="text-lg">{{ toast()!.tipo === 'ok' ? '✓' : '✕' }}</span>
          <p class="text-sm text-gray-700 font-medium flex-1 leading-snug">{{ toast()!.msg }}</p>
          <button (click)="toast.set(null)" class="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
      }

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Mis Tareas</h2>
          <p class="text-sm text-gray-400 mt-0.5">
            {{ auth.nombreCompleto() }} · {{ perfil().aulaLabel }} · Sube tus entregas para revisión docente
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="cargar()" [disabled]="svc.loading()">
          <span class="icon icon-sm">refresh</span> Actualizar
        </button>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        @for (kpi of kpis(); track kpi.label) {
          <button type="button" class="card p-4 text-left hover:shadow-md transition-shadow"
            [ngClass]="vista() === kpi.vista ? 'ring-2 ring-indigo-400' : ''"
            (click)="vista.set(kpi.vista)">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" [ngClass]="kpi.bg">
                <span class="text-lg">{{ kpi.emoji }}</span>
              </div>
              <div>
                <p class="text-xs text-gray-400">{{ kpi.label }}</p>
                <p class="text-xl font-bold" [ngClass]="kpi.text ?? 'text-gray-900'">{{ kpi.value }}</p>
              </div>
            </div>
          </button>
        }
      </div>

      <div class="card p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="form-label mb-1 block">Curso</label>
            <select class="form-select" [ngModel]="filtroCurso()" (ngModelChange)="filtroCurso.set($event)">
              <option value="">Todos los cursos</option>
              @for (c of svc.cursosDisponibles(); track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Buscar</label>
            <div class="relative">
              <span class="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input class="form-input pl-10" placeholder="Título o curso..."
                [ngModel]="filtroBusqueda()" (ngModelChange)="filtroBusqueda.set($event)">
            </div>
          </div>
        </div>
      </div>

      @if (svc.loading()) {
        <div class="card p-12 flex flex-col items-center text-gray-400">
          <span class="icon icon-xl animate-spin mb-3">progress_activity</span>
          <p class="text-sm">Cargando tareas…</p>
        </div>
      } @else if (!svc.tareas().length) {
        <div class="card p-16 flex flex-col items-center justify-center text-center">
          <span class="text-4xl mb-4">✅</span>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Sin tareas asignadas</h3>
          <p class="text-gray-500 text-sm">Cuando tus docentes publiquen actividades, aparecerán aquí.</p>
        </div>
      } @else if (!filtradas().length) {
        <div class="card p-12 flex flex-col items-center text-center text-gray-400">
          <span class="text-3xl mb-3">🔍</span>
          <p class="text-sm">No hay tareas con los filtros seleccionados.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (t of filtradas(); track t.id) {
            @let style = cursoStyle(t.curso);
            <div class="card overflow-hidden hover:shadow-md transition-shadow"
              [ngClass]="t.estado === 'OVERDUE' ? 'border-l-4 border-l-red-400' : t.venceHoy ? 'border-l-4 border-l-amber-400' : t.estado === 'GRADED' ? 'border-l-4 border-l-indigo-400' : ''">
              <div class="p-4 flex flex-col lg:flex-row lg:items-start gap-4">
                <div class="flex items-start gap-3 flex-1 min-w-0">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                    [ngClass]="style.colorClass">
                    {{ style.emoji }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <h3 class="font-semibold text-gray-900">{{ t.titulo }}</h3>
                      <span class="badge text-xs" [ngClass]="svc.estadoBadge(t.estado)">
                        {{ svc.estadoLabel(t.estado) }}
                      </span>
                      <span class="badge text-xs" [ngClass]="svc.prioridadBadge(t.prioridad)">
                        {{ svc.prioridadLabel(t.prioridad) }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500">{{ t.curso }}</p>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs"
                      [ngClass]="t.vencida ? 'text-red-500 font-medium' : t.venceHoy ? 'text-amber-600 font-medium' : 'text-gray-400'">
                      <span>📅 Entrega: {{ svc.formatFecha(t.fechaEntrega) }}</span>
                      @if (t.estado === 'PENDING' || t.estado === 'OVERDUE') {
                        <span>⏱ {{ svc.diasRestantesLabel(t.diasRestantes, t.venceHoy, t.vencida) }}</span>
                      }
                      @if (t.fechaEntregaReal) {
                        <span>📤 Enviada: {{ svc.formatFecha(t.fechaEntregaReal) }}</span>
                      }
                    </div>

                    @if (t.archivoEntregaNombre) {
                      @let fileAccent = fileAccentForName(t.archivoEntregaNombre);
                      <a [href]="taskFileUrl(t.archivoEntregaUrl)" target="_blank" rel="noopener"
                        class="mt-3 inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs transition-colors hover:shadow-sm max-w-full"
                        [ngClass]="[fileAccent.bg, fileAccent.border]">
                        <span class="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shrink-0"
                          [ngClass]="fileAccent.text">
                          <span class="icon icon-sm">{{ fileIconForName(t.archivoEntregaNombre) }}</span>
                        </span>
                        <span class="min-w-0">
                          <span class="block font-medium text-gray-800 truncate">{{ t.archivoEntregaNombre }}</span>
                          <span class="block text-gray-500 mt-0.5">Ver archivo entregado</span>
                        </span>
                        <span class="icon icon-sm text-gray-400 shrink-0 ml-auto">open_in_new</span>
                      </a>
                    }
                    @if (t.comentarioEntrega) {
                      <p class="mt-2 text-xs text-gray-500 italic">"{{ t.comentarioEntrega }}"</p>
                    }

                    @if (t.estado === 'GRADED') {
                      <div class="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                        <div class="flex items-center gap-2 text-sm font-semibold text-indigo-800">
                          <span class="icon icon-sm">grading</span>
                          Calificación: {{ t.nota ?? '—' }}/20
                        </div>
                        @if (t.retroalimentacion) {
                          <p class="text-sm text-indigo-900 mt-2">{{ t.retroalimentacion }}</p>
                        }
                      </div>
                    }
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  @if (t.estado === 'PENDING' || t.estado === 'OVERDUE' || t.estado === 'SUBMITTED') {
                    <button type="button" class="btn btn-primary btn-sm"
                      [disabled]="svc.saving()"
                      (click)="abrirEntrega(t)">
                      <span class="icon icon-sm">upload_file</span>
                      {{ t.estado === 'SUBMITTED' ? 'Reenviar' : 'Subir entrega' }}
                    </button>
                  } @else if (t.estado === 'GRADED') {
                    <span class="inline-flex items-center gap-1.5 text-sm text-indigo-700 font-medium px-3 py-1.5 bg-indigo-50 rounded-lg">
                      <span class="icon icon-sm">verified</span> Revisada
                    </span>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (entregaAbierta(); as t) {
      <div class="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm" (click)="cerrarEntrega()"></div>
      <div class="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-[90] flex flex-col animate-slide-in-r">
        <div class="relative px-6 py-5 border-b border-gray-200 shrink-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
          <button type="button" class="btn btn-ghost btn-icon absolute top-4 right-4" (click)="cerrarEntrega()">
            <span class="icon icon-sm">close</span>
          </button>
          <div class="flex items-start gap-3 pr-10">
            <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
              <span class="icon">cloud_upload</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Entrega de tarea</p>
              <h2 class="text-lg font-bold text-gray-900 mt-0.5 leading-snug">{{ t.titulo }}</h2>
              <div class="flex flex-wrap gap-2 mt-2">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-600">
                  <span class="icon icon-sm text-indigo-500">menu_book</span> {{ t.curso }}
                </span>
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border"
                  [ngClass]="t.vencida ? 'bg-red-50 border-red-200 text-red-700' : t.venceHoy ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600'">
                  <span class="icon icon-sm">event</span> {{ svc.formatFecha(t.fechaEntrega) }}
                </span>
                @if (t.estado === 'SUBMITTED') {
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                    <span class="icon icon-sm">history</span> Reemplazar entrega
                  </span>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          @if (t.archivoEntregaNombre && t.estado === 'SUBMITTED') {
            @let prevAccent = fileAccentForName(t.archivoEntregaNombre);
            <div class="rounded-xl border border-dashed p-3" [ngClass]="prevAccent.border">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Entrega actual</p>
              <a [href]="taskFileUrl(t.archivoEntregaUrl)" target="_blank" rel="noopener"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/70 transition-colors">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  [ngClass]="[prevAccent.bg, prevAccent.text]">
                  <span class="icon">{{ fileIconForName(t.archivoEntregaNombre) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-800 truncate">{{ t.archivoEntregaNombre }}</p>
                  <p class="text-xs text-gray-500">Se reemplazará al enviar un nuevo archivo</p>
                </div>
              </a>
            </div>
          }

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="form-label mb-0">Archivo de entrega</label>
              <span class="text-[11px] text-gray-400">Obligatorio · máx. 10 MB</span>
            </div>

            @if (archivoSeleccionado(); as file) {
              @let accent = fileAccentForName(file.name);
              <div class="rounded-2xl border-2 p-4 transition-all" [ngClass]="[accent.border, accent.bg]">
                <div class="flex items-start gap-3">
                  <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm"
                    [ngClass]="accent.text">
                    <span class="icon icon-lg">{{ fileIconForName(file.name) }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-gray-900 truncate">{{ file.name }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ formatFileSize(file.size) }}</p>
                    <div class="mt-3 h-1.5 rounded-full bg-white/80 overflow-hidden">
                      <div class="h-full rounded-full bg-indigo-500 transition-all duration-300"
                        [style.width.%]="svc.saving() ? 70 : 100"></div>
                    </div>
                  </div>
                  <button type="button" class="btn btn-ghost btn-icon text-gray-400 hover:text-red-500 shrink-0"
                    [disabled]="svc.saving()" (click)="quitarArchivo()" title="Quitar archivo">
                    <span class="icon icon-sm">delete</span>
                  </button>
                </div>
                <button type="button" class="btn btn-secondary btn-sm w-full mt-4"
                  [disabled]="svc.saving()" (click)="abrirSelectorArchivo()">
                  <span class="icon icon-sm">swap_horiz</span> Cambiar archivo
                </button>
              </div>
            } @else {
              <label class="block cursor-pointer group"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
                (click)="abrirSelectorArchivo()">
                <div class="rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200"
                  [ngClass]="dragOver()
                    ? 'border-indigo-400 bg-indigo-50 scale-[1.01] shadow-inner'
                    : 'border-gray-200 bg-gray-50/80 group-hover:border-indigo-300 group-hover:bg-indigo-50/40'">
                  <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors"
                    [ngClass]="dragOver() ? 'bg-indigo-200 text-indigo-700' : 'bg-white text-indigo-500 shadow-sm group-hover:bg-indigo-100'">
                    <span class="icon" style="font-size:32px">{{ dragOver() ? 'file_download' : 'cloud_upload' }}</span>
                  </div>
                  <p class="text-sm font-semibold text-gray-800">
                    {{ dragOver() ? 'Suelta el archivo aquí' : 'Arrastra tu archivo o haz clic para seleccionar' }}
                  </p>
                  <p class="text-xs text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
                    PDF, Word, Excel, PowerPoint, imágenes o ZIP
                  </p>
                  <span class="inline-flex items-center gap-1.5 mt-4 btn btn-primary btn-sm pointer-events-none">
                    <span class="icon icon-sm">folder_open</span> Explorar archivos
                  </span>
                </div>
              </label>
            }

            @if (errorArchivo()) {
              <div class="mt-2 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                <span class="icon icon-sm shrink-0 mt-0.5">error_outline</span>
                <span>{{ errorArchivo() }}</span>
              </div>
            }

            <input #fileInputRef type="file" class="hidden" [accept]="acceptEntrega"
              (change)="onArchivoSeleccionado($event)" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="form-label mb-0">Comentario para el docente</label>
              <span class="text-[11px] text-gray-400">Opcional</span>
            </div>
            <textarea class="form-input w-full h-28 resize-none leading-relaxed" [(ngModel)]="comentarioEntrega"
              [disabled]="svc.saving()"
              placeholder="Ej.: adjunto la versión final con las correcciones solicitadas..."></textarea>
          </div>

          <div class="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-600 space-y-2">
            <p class="font-semibold text-slate-700 flex items-center gap-1.5">
              <span class="icon icon-sm text-indigo-500">info</span> Antes de enviar
            </p>
            <ul class="space-y-1.5 pl-1">
              <li class="flex items-start gap-2"><span class="text-indigo-400">•</span> Verifica que el archivo sea el correcto y legible.</li>
              <li class="flex items-start gap-2"><span class="text-indigo-400">•</span> Puedes reenviar la entrega antes de que el docente califique.</li>
              <li class="flex items-start gap-2"><span class="text-indigo-400">•</span> El docente recibirá tu archivo para revisión y calificación.</li>
            </ul>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50/80 flex gap-3 shrink-0">
          <button type="button" class="btn btn-secondary flex-1" [disabled]="svc.saving()" (click)="cerrarEntrega()">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary flex-1 gap-2"
            [disabled]="!archivoSeleccionado() || svc.saving() || !!errorArchivo()"
            (click)="enviarEntrega()">
            @if (svc.saving()) {
              <span class="icon icon-sm animate-spin">progress_activity</span> Enviando…
            } @else {
              <span class="icon icon-sm">send</span> Enviar entrega
            }
          </button>
        </div>
      </div>
    }
  `,
})
export class TareasComponent implements OnInit {
  @ViewChild('fileInputRef') private fileInputRef?: ElementRef<HTMLInputElement>;

  private readonly layout = inject(LayoutService);
  readonly auth = inject(AuthService);
  readonly svc = inject(TareasEstudianteService);
  private readonly horarios = inject(HorariosService);

  readonly vista = signal<TareaVista>('todas');
  readonly filtroCurso = signal('');
  readonly filtroBusqueda = signal('');
  readonly toast = signal<{ msg: string; tipo: 'ok' | 'err' } | null>(null);
  readonly entregaAbierta = signal<TareaEstudiante | null>(null);
  readonly archivoSeleccionado = signal<File | null>(null);
  readonly dragOver = signal(false);
  readonly errorArchivo = signal('');
  readonly acceptEntrega = ACCEPT_ENTREGA;
  readonly taskFileUrl = taskFileUrl;
  readonly formatFileSize = formatFileSize;
  readonly fileIconForName = fileIconForName;
  readonly fileAccentForName = fileAccentForName;

  comentarioEntrega = '';

  readonly filtradas = computed(() =>
    this.svc.filtrar(this.vista(), this.filtroCurso(), this.filtroBusqueda()),
  );

  readonly kpis = computed(() => [
    { label: 'Total', value: this.svc.tareas().length, emoji: '📋', bg: 'bg-indigo-50', vista: 'todas' as TareaVista },
    { label: 'Pendientes', value: this.svc.pendientes().length, emoji: '⏳', bg: 'bg-amber-50', text: 'text-amber-700', vista: 'pendientes' as TareaVista },
    { label: 'Entregadas', value: this.svc.entregadas().length, emoji: '📤', bg: 'bg-emerald-50', text: 'text-emerald-700', vista: 'entregadas' as TareaVista },
    { label: 'Calificadas', value: this.svc.calificadas().length, emoji: '🎓', bg: 'bg-indigo-50', text: 'text-indigo-700', vista: 'calificadas' as TareaVista },
    { label: 'Vencidas', value: this.svc.vencidas().length, emoji: '⚠️', bg: 'bg-red-50', text: 'text-red-600', vista: 'vencidas' as TareaVista },
  ]);

  cursoStyle = cursoStyle;

  ngOnInit(): void {
    this.layout.setTitle('Mis Tareas');
    this.cargar();
  }

  perfil() {
    return this.horarios.getPerfilEstudiante();
  }

  cargar(): void {
    this.svc.load();
  }

  abrirEntrega(t: TareaEstudiante): void {
    this.entregaAbierta.set(t);
    this.archivoSeleccionado.set(null);
    this.errorArchivo.set('');
    this.dragOver.set(false);
    this.comentarioEntrega = t.comentarioEntrega ?? '';
    this.resetFileInput();
  }

  cerrarEntrega(): void {
    if (this.svc.saving()) return;
    this.entregaAbierta.set(null);
    this.archivoSeleccionado.set(null);
    this.errorArchivo.set('');
    this.dragOver.set(false);
    this.comentarioEntrega = '';
    this.resetFileInput();
  }

  abrirSelectorArchivo(): void {
    this.fileInputRef?.nativeElement.click();
  }

  quitarArchivo(): void {
    this.archivoSeleccionado.set(null);
    this.errorArchivo.set('');
    this.resetFileInput();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.asignarArchivo(file);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) this.asignarArchivo(file);
  }

  private asignarArchivo(file: File): void {
    if (file.size > MAX_ENTREGA_BYTES) {
      this.archivoSeleccionado.set(null);
      this.errorArchivo.set(`El archivo supera el límite de ${formatFileSize(MAX_ENTREGA_BYTES)}.`);
      this.resetFileInput();
      return;
    }
    this.errorArchivo.set('');
    this.archivoSeleccionado.set(file);
  }

  private resetFileInput(): void {
    const input = this.fileInputRef?.nativeElement;
    if (input) input.value = '';
  }

  enviarEntrega(): void {
    const t = this.entregaAbierta();
    const file = this.archivoSeleccionado();
    if (!t || !file) return;

    this.svc.submitEntrega(t.id, file, this.comentarioEntrega).subscribe(ok => {
      if (ok) {
        this.cerrarEntrega();
        this.mostrarToast(`Entrega de "${t.titulo}" enviada correctamente`, 'ok');
      } else {
        this.mostrarToast('No se pudo subir la entrega. Verifica el archivo e intenta de nuevo.', 'err');
      }
    });
  }

  private toastTimer?: ReturnType<typeof setTimeout>;
  private mostrarToast(msg: string, tipo: 'ok' | 'err'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ msg, tipo });
    this.toastTimer = setTimeout(() => this.toast.set(null), 4500);
  }
}
