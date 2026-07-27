import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LayoutService } from '../../../../core/layout/services/layout.service';
import { HistorialAcademicoMaestroService } from './historial-academico.service';
import {
  BulkImportHistorialResult,
  BulkHistorialPreviewItem,
  HistorialPreviewState,
  labelAccionHistorial,
  claseAccionHistorial,
} from './historial-academico.model';
import {
  descargarPlantillaHistorial,
  ESTADOS_HISTORIAL,
  PLANTILLA_COLUMNAS_TEXTO,
} from './historial-academico-carga.util';

@Component({
  selector: 'app-maestros-historial-academico',
  standalone: true,
  imports: [FormsModule, NgClass, DecimalPipe, RouterLink],
  template: `
<div class="space-y-5">

  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h3 class="text-xl font-bold text-gray-900">Historial Académico</h3>
      <p class="text-sm text-gray-400 mt-0.5">
        Carga masiva de trayectoria escolar con datos completos del alumno y registro por año
      </p>
    </div>
    <a routerLink="/academico/historial-academico" class="btn btn-secondary text-sm">
      <span class="icon icon-sm">history_edu</span> Ver historial
    </a>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
    <div class="card p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
        <span class="icon text-indigo-600">upload_file</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Procesadas</p>
        <p class="text-2xl font-bold text-gray-900">{{ resultado()?.total ?? preview()?.total ?? 0 }}</p>
      </div>
    </div>
    <div class="card p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
        <span class="icon text-green-600">add_circle</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Nuevos</p>
        <p class="text-2xl font-bold text-green-700">{{ resultado()?.creados ?? preview()?.nuevosCount ?? 0 }}</p>
      </div>
    </div>
    <div class="card p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
        <span class="icon text-blue-600">sync</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Actualizar</p>
        <p class="text-2xl font-bold text-blue-700">{{ resultado()?.actualizados ?? preview()?.actualizadosCount ?? 0 }}</p>
      </div>
    </div>
    <div class="card p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
        <span class="icon text-amber-600">history</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Ya registrados</p>
        <p class="text-2xl font-bold text-amber-700">{{ resultado()?.sinCambios ?? preview()?.sinCambiosCount ?? 0 }}</p>
      </div>
    </div>
    <div class="card p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
        <span class="icon text-rose-500">error</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Errores</p>
        <p class="text-2xl font-bold text-rose-600">{{ totalErrores() }}</p>
      </div>
    </div>
  </div>

  <div class="card p-5 space-y-4">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h4 class="font-semibold text-gray-800">1. Descargar plantilla</h4>
        <p class="text-xs text-gray-400 mt-0.5">
          Columnas: {{ columnasTexto }}
        </p>
        <p class="text-xs text-gray-400">
          Estados: {{ estadosTexto }}
        </p>
      </div>
      <button class="btn btn-secondary text-sm shrink-0" (click)="descargarPlantilla()">
        <span class="icon icon-sm">download</span> Plantilla Excel
      </button>
    </div>

    <hr class="border-gray-100" />

    <div>
      <h4 class="font-semibold text-gray-800 mb-2">2. Subir archivo</h4>
      <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
        <span class="icon text-3xl text-gray-300 mb-2">cloud_upload</span>
        <span class="text-sm text-gray-500">
          @if (archivoNombre()) { {{ archivoNombre() }} } @else { CSV o Excel (.xlsx) }
        </span>
        <input type="file" accept=".csv,.xlsx,.xls" class="hidden"
               [disabled]="svc.previewing()"
               (change)="onArchivoSeleccionado($event)" />
      </label>
      @if (errorCarga()) {
        <p class="text-sm text-red-600 mt-2">{{ errorCarga() }}</p>
      }
      @if (svc.previewing()) {
        <p class="text-sm text-indigo-600 mt-2 flex items-center gap-2">
          <span class="icon icon-sm animate-spin">progress_activity</span> Analizando archivo...
        </p>
      }
    </div>
  </div>

  @if (preview(); as p) {
    <div class="card p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 class="font-semibold text-gray-800">3. Vista previa</h4>
          <p class="text-xs text-gray-400">
            {{ p.listos.length }} listas · {{ p.bloqueados.length }} bloqueadas ·
            {{ p.nuevosCount }} nuevos · {{ p.actualizadosCount }} a actualizar ·
            {{ p.sinCambiosCount }} ya registrados
          </p>
        </div>
        <button class="btn btn-primary text-sm"
                [disabled]="seleccionadosImportables().length === 0 || svc.importing()"
                (click)="confirmarImportacion()">
          @if (svc.importing()) {
            <span class="icon icon-sm animate-spin">progress_activity</span> Importando...
          } @else {
            <span class="icon icon-sm">check</span> Importar {{ seleccionadosImportables().length }} filas
          }
        </button>
      </div>

      @if (p.sinCambiosCount > 0) {
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
          {{ p.sinCambiosCount }} registro(s) ya existen con los mismos datos y se omitiran al importar
          (desmarcados por defecto). Puede marcarlos si desea revalidarlos.
        </div>
      }

      @if (p.listos.length) {
        <div class="overflow-x-auto">
          <table class="data-table text-sm">
            <thead>
              <tr>
                <th class="w-10">
                  <input type="checkbox"
                         [checked]="todosListosSeleccionados()"
                         (change)="toggleTodosListos()" />
                </th>
                <th>Fila</th>
                <th>Código</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Nivel</th>
                <th>Año</th>
                <th>Grado</th>
                <th>Sección</th>
                <th>Promedio</th>
                <th>Estado</th>
                <th>Validación</th>
              </tr>
            </thead>
            <tbody>
              @for (f of p.listos; track f.fila) {
                <tr [class.bg-indigo-50/40]="f.seleccionado"
                    [class.bg-amber-50/50]="f.accionPrevista === 'sin_cambios'">
                  <td>
                    <input type="checkbox" [checked]="f.seleccionado"
                           (change)="toggleSeleccion(f.fila)" />
                  </td>
                  <td class="text-gray-400">{{ f.fila }}</td>
                  <td class="font-mono text-xs">{{ f.codigo || '—' }}</td>
                  <td class="font-medium">{{ f.nombres || '—' }}</td>
                  <td>{{ f.apellidos || '—' }}</td>
                  <td class="font-mono text-xs">{{ f.dni || '—' }}</td>
                  <td class="text-xs text-gray-500">{{ f.email || '—' }}</td>
                  <td>{{ f.nivel || '—' }}</td>
                  <td>{{ f.anio }}</td>
                  <td>{{ f.grado }}</td>
                  <td>{{ f.seccion }}</td>
                  <td>{{ f.promedio | number:'1.1-1' }}</td>
                  <td>{{ f.estado }}</td>
                  <td>
                    <span class="badge text-xs" [ngClass]="claseAccion(f.accionPrevista)">
                      {{ labelAccion(f.accionPrevista) }}
                    </span>
                    @if (f.registroAnterior && f.accionPrevista === 'actualizado') {
                      <p class="text-[10px] text-gray-400 mt-1 leading-snug">
                        Antes: {{ f.registroAnterior.grado }} {{ f.registroAnterior.seccion }} ·
                        {{ f.registroAnterior.promedio | number:'1.1-1' }} · {{ f.registroAnterior.estado }}
                      </p>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (p.bloqueados.length) {
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <h5 class="text-sm font-semibold text-amber-800 mb-2">
            Filas bloqueadas ({{ p.bloqueados.length }})
          </h5>
          <div class="overflow-x-auto max-h-48 overflow-y-auto">
            <table class="data-table text-xs">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Alumno</th>
                  <th>DNI</th>
                  <th>Año</th>
                  <th>Grado</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                @for (f of p.bloqueados; track f.fila + (f.motivo ?? '')) {
                  <tr>
                    <td>{{ f.fila }}</td>
                    <td>{{ f.apellidos }}, {{ f.nombres }}</td>
                    <td>{{ f.dni || '—' }}</td>
                    <td>{{ f.anio || '—' }}</td>
                    <td>{{ f.grado || '—' }}</td>
                    <td class="text-amber-800">{{ f.motivo }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  }

  @if (resultado(); as r) {
    <div class="card p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-gray-800">Resultado de importación</h4>
        <button class="btn btn-ghost btn-sm text-xs" (click)="limpiarResultado()">
          <span class="icon icon-sm">clear</span> Limpiar
        </button>
      </div>

      @if (r.filas.length) {
        <div class="overflow-x-auto">
          <table class="data-table text-sm">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>DNI</th>
                <th>Nivel</th>
                <th>Año</th>
                <th>Grado</th>
                <th>Sección</th>
                <th>Promedio</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (f of r.filas; track f.studentId + f.anio) {
                <tr>
                  <td class="font-mono text-xs text-gray-500">{{ f.codigo }}</td>
                  <td class="font-medium">{{ f.nombres }}</td>
                  <td>{{ f.apellidos }}</td>
                  <td class="font-mono text-xs">{{ f.dni }}</td>
                  <td>{{ f.nivel }}</td>
                  <td>{{ f.anio }}</td>
                  <td>{{ f.grado }}</td>
                  <td>{{ f.seccion }}</td>
                  <td>{{ f.promedio | number:'1.1-1' }}</td>
                  <td>{{ f.estado }}</td>
                  <td>
                    <span class="badge text-xs"
                          [ngClass]="claseAccion(f.accion)">
                      {{ labelAccion(f.accion) }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (r.erroresValidacion.length) {
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <h5 class="text-sm font-semibold text-amber-800 mb-2">
            Filas omitidas por validación ({{ r.erroresValidacion.length }})
          </h5>
          <div class="space-y-1 max-h-40 overflow-y-auto text-xs">
            @for (err of r.erroresValidacion; track err.fila + err.mensaje) {
              <p class="text-amber-800">
                Fila {{ err.fila }} · DNI {{ err.dni || '—' }}: {{ err.mensaje }}
              </p>
            }
          </div>
        </div>
      }

      @if (r.errores.length) {
        <div class="bg-red-50 border border-red-100 rounded-xl p-4">
          <h5 class="text-sm font-semibold text-red-800 mb-2">
            Errores al guardar ({{ r.errores.length }})
          </h5>
          <div class="space-y-1 max-h-40 overflow-y-auto text-xs">
            @for (err of r.errores; track err.fila + err.mensaje) {
              <p class="text-red-700">
                Fila {{ err.fila }} · DNI {{ err.dni || '—' }}: {{ err.mensaje }}
              </p>
            }
          </div>
        </div>
      }
    </div>
  }

  @if (toast()) {
    <div class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl animate-slide-in-r"
         [ngClass]="{
           'bg-green-600 text-white': toast()!.type === 'success',
           'bg-red-600 text-white': toast()!.type === 'error',
           'bg-gray-800 text-white': toast()!.type === 'info'
         }">
      <span class="icon text-white text-lg">
        {{ toast()!.type === 'success' ? 'check_circle' : toast()!.type === 'error' ? 'error' : 'info' }}
      </span>
      <p class="text-sm font-medium">{{ toast()!.msg }}</p>
    </div>
  }
</div>
  `,
})
export class MaestrosHistorialAcademicoComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(HistorialAcademicoMaestroService);
  readonly labelAccion = labelAccionHistorial;
  readonly claseAccion = claseAccionHistorial;

  archivoNombre = signal('');
  errorCarga = signal('');
  preview = signal<HistorialPreviewState | null>(null);
  resultado = signal<BulkImportHistorialResult | null>(null);
  toast = signal<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  readonly estadosTexto = ESTADOS_HISTORIAL.join(', ');
  readonly columnasTexto = PLANTILLA_COLUMNAS_TEXTO;

  readonly seleccionados = computed(() =>
    this.preview()?.listos.filter((f) => f.seleccionado) ?? [],
  );

  readonly seleccionadosImportables = computed(() =>
    this.seleccionados().filter((f) => f.accionPrevista !== 'sin_cambios'),
  );

  readonly todosListosSeleccionados = computed(() => {
    const listos = this.preview()?.listos ?? [];
    return listos.length > 0 && listos.every((f) => f.seleccionado);
  });

  readonly totalErrores = computed(() => {
    const r = this.resultado();
    if (!r) return this.preview()?.bloqueados.length ?? 0;
    return r.errores.length + r.erroresValidacion.length;
  });

  ngOnInit(): void {
    this.layout.setTitle('Historial Académico · Carga masiva');
  }

  descargarPlantilla(): void {
    descargarPlantillaHistorial();
    this.mostrarToast('Plantilla Excel descargada', 'info');
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.archivoNombre.set(file.name);
    this.errorCarga.set('');
    this.resultado.set(null);
    this.preview.set(null);

    this.svc.previewFile(file).subscribe({
      next: (res) => {
        this.preview.set({
          archivo: file.name,
          total: res.total,
          nuevosCount: res.nuevosCount,
          actualizadosCount: res.actualizadosCount,
          sinCambiosCount: res.sinCambiosCount,
          listos: res.listos.map((f) => ({
            ...f,
            seleccionado: f.accionPrevista !== 'sin_cambios',
          })),
          bloqueados: res.bloqueados,
        });
        if (res.listosCount === 0) {
          this.mostrarToast('Ninguna fila puede importarse. Revise los bloqueados.', 'error');
        } else {
          const msg = [
            `${res.nuevosCount} nuevos`,
            `${res.actualizadosCount} a actualizar`,
            res.sinCambiosCount ? `${res.sinCambiosCount} ya registrados` : '',
            res.bloqueadosCount ? `${res.bloqueadosCount} bloqueados` : '',
          ].filter(Boolean).join(' · ');
          this.mostrarToast(msg, res.bloqueadosCount ? 'info' : 'success');
        }
      },
      error: (err: Error) => {
        this.errorCarga.set(err.message);
        this.mostrarToast(err.message, 'error');
      },
      complete: () => {
        input.value = '';
      },
    });
  }

  toggleSeleccion(fila: number): void {
    this.preview.update((p) => {
      if (!p) return p;
      return {
        ...p,
        listos: p.listos.map((f) =>
          f.fila === fila ? { ...f, seleccionado: !f.seleccionado } : f,
        ),
      };
    });
  }

  toggleTodosListos(): void {
    const todos = this.todosListosSeleccionados();
    this.preview.update((p) => {
      if (!p) return p;
      return {
        ...p,
        listos: p.listos.map((f) => ({ ...f, seleccionado: !todos })),
      };
    });
  }

  confirmarImportacion(): void {
    const filas = this.seleccionadosImportables();
    if (!filas.length) return;

    const payload = filas.map((f) => this.toPayload(f));

    this.svc.bulkImport({ filas: payload }).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.preview.set(null);
        const partes = [
          `${res.creados} creados`,
          res.actualizados ? `${res.actualizados} actualizados` : '',
          res.sinCambios ? `${res.sinCambios} ya registrados (sin cambios)` : '',
        ].filter(Boolean);
        this.mostrarToast(
          partes.join(' · ') || 'Importacion completada',
          res.errores.length ? 'info' : 'success',
        );
      },
      error: (err: Error) => this.mostrarToast(err.message, 'error'),
    });
  }

  limpiarResultado(): void {
    this.resultado.set(null);
    this.preview.set(null);
    this.archivoNombre.set('');
  }

  private toPayload(f: BulkHistorialPreviewItem & { seleccionado?: boolean }) {
    return {
      fila: f.fila,
      nombres: f.nombres || undefined,
      apellidos: f.apellidos || undefined,
      apellidoPaterno: f.apellidoPaterno || undefined,
      apellidoMaterno: f.apellidoMaterno || undefined,
      dni: f.dni || undefined,
      codigo: f.codigo || undefined,
      email: f.email || undefined,
      nivel: f.nivel || undefined,
      anio: f.anio,
      grado: f.grado,
      seccion: f.seccion,
      promedio: f.promedio,
      estado: f.estado,
    };
  }

  private mostrarToast(msg: string, type: 'success' | 'error' | 'info'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 4000);
  }
}
