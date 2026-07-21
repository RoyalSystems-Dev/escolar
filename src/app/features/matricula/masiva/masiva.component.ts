import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { MasivaService } from './masiva.service';
import {
  BulkImportMatriculaResult,
  BulkMatriculaPreviewItem,
  FilaPreviewMatricula,
  MasivaPreviewState,
} from './masiva.model';
import {
  descargarPlantillaMatricula,
  NIVELES_VALIDOS,
} from './masiva-carga.util';

@Component({
  selector: 'app-masiva',
  standalone: true,
  imports: [FormsModule, NgClass, RouterLink],
  template: `
<div class="space-y-5 animate-fade-in">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Matricula Masiva</h2>
      <p class="text-sm text-gray-400 mt-0.5">
        Sube CSV o Excel, revisa quienes se pueden matricular y confirma la carga
      </p>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      <a routerLink="/matricula/matriculados" class="btn btn-secondary text-sm">
        <span class="icon icon-sm">list_alt</span> Ver matriculados
      </a>
      <a routerLink="/matricula/nueva" class="btn btn-primary text-sm">
        <span class="icon icon-sm">person_add</span> Matricula individual
      </a>
    </div>
  </div>

  <!-- KPIs -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div class="card p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
        <span class="icon text-indigo-600">upload_file</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Procesadas</p>
        <p class="text-2xl font-bold text-gray-900">{{ resultado()?.total ?? 0 }}</p>
      </div>
    </div>
    <div class="card p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
        <span class="icon text-green-600">check_circle</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Matriculados</p>
        <p class="text-2xl font-bold text-green-700">{{ resultado()?.creados ?? 0 }}</p>
      </div>
    </div>
    <div class="card p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
        <span class="icon text-amber-600">warning</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Omitidas</p>
        <p class="text-2xl font-bold text-amber-600">{{ resultado()?.omitidos ?? 0 }}</p>
      </div>
    </div>
    <div class="card p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
        <span class="icon text-rose-500">error</span>
      </div>
      <div>
        <p class="text-xs text-gray-400 font-medium">Errores BD</p>
        <p class="text-2xl font-bold text-rose-600">{{ resultado()?.errores?.length ?? 0 }}</p>
      </div>
    </div>
  </div>

  <!-- Paso 1 y 2 -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="card p-5 border-dashed border-2 border-indigo-200 bg-indigo-50/40">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <span class="icon text-indigo-600">description</span>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-800">1. Descargar plantilla</h4>
          <p class="text-xs text-gray-500 mt-1 mb-3">
            Columnas: nombres, apellidos, dni, nivel, grado, seccion y datos del apoderado
          </p>
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-secondary btn-sm" (click)="descargarPlantilla()">
              <span class="icon icon-sm">table_chart</span> Plantilla Excel
            </button>
          </div>
          <p class="text-[11px] text-indigo-600 mt-2">
            Incluye 10 alumnos de ejemplo con DNIs unicos listos para probar la carga.
          </p>
        </div>
      </div>
    </div>

    <div class="card p-5 border-dashed border-2"
         [ngClass]="svc.previewing() || svc.importing() ? 'border-indigo-300 bg-indigo-50/60' : 'border-gray-200'">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
             [ngClass]="svc.previewing() || svc.importing() ? 'bg-indigo-200' : 'bg-gray-100'">
          <span class="icon" [ngClass]="(svc.previewing() || svc.importing()) ? 'text-indigo-600 animate-spin' : 'text-gray-600'">
            {{ svc.previewing() || svc.importing() ? 'refresh' : 'cloud_upload' }}
          </span>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-800">2. Subir y revisar</h4>
          <p class="text-xs text-gray-500 mt-1 mb-3">
            Al seleccionar el archivo veras la lista de alumnos listos y bloqueados antes de matricular
          </p>
          <label class="btn btn-primary btn-sm cursor-pointer"
                 [class.opacity-60]="svc.previewing() || svc.importing()"
                 [class.pointer-events-none]="svc.previewing() || svc.importing()">
            <span class="icon icon-sm">upload_file</span>
            {{ svc.previewing() ? 'Analizando archivo...' : svc.importing() ? 'Matriculando...' : 'Seleccionar archivo' }}
            <input type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              class="hidden"
              [disabled]="svc.previewing() || svc.importing()"
              (change)="onArchivoSeleccionado($event)">
          </label>
          @if (archivoNombre()) {
            <p class="text-xs text-gray-600 mt-2">
              <span class="icon icon-sm align-middle">attach_file</span> {{ archivoNombre() }}
            </p>
          }
        </div>
      </div>
    </div>
  </div>

  <!-- Ayuda -->
  <div class="card p-4 bg-gray-50 text-xs text-gray-600 space-y-1">
    <p><strong>Niveles validos:</strong> {{ nivelesTexto }}</p>
    <p><strong>Grados:</strong> Inicial 1-3, Primaria 1-6, Secundaria 1-5</p>
    <p><strong>Seccion:</strong> letra unica (A, B, C...)</p>
    <p><strong>Email:</strong> opcional; si se omite el backend lo genera con el DNI</p>
  </div>

  @if (errorCarga()) {
    <div class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      <span class="icon icon-sm">error_outline</span> {{ errorCarga() }}
    </div>
  }

  <!-- Vista previa antes de matricular -->
  @if (preview()) {
    @let p = preview()!;
    <div class="card p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 class="font-bold text-gray-900">Vista previa · {{ p.archivo }}</h3>
          <p class="text-sm text-gray-500 mt-0.5">
            {{ p.total }} fila(s) ·
            <span class="text-green-700 font-semibold">{{ p.listos.length }} listos</span> ·
            <span class="text-red-600 font-semibold">{{ p.bloqueados.length }} bloqueados</span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-secondary btn-sm" (click)="cancelarPreview()">
            <span class="icon icon-sm">close</span> Cancelar
          </button>
          <button type="button" class="btn btn-success btn-sm"
            [disabled]="seleccionados().length === 0 || svc.importing()"
            (click)="confirmarMatricula()">
            <span class="icon icon-sm">how_to_reg</span>
            Matricular seleccionados ({{ seleccionados().length }})
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <!-- Listos -->
        <div class="border border-green-200 rounded-xl overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 bg-green-50 border-b border-green-100">
            <div class="flex items-center gap-2">
              <span class="icon text-green-600">check_circle</span>
              <h4 class="font-semibold text-green-800 text-sm">Se pueden matricular ({{ p.listos.length }})</h4>
            </div>
            @if (p.listos.length) {
              <button type="button" class="text-xs text-green-700 hover:underline" (click)="toggleTodosListos()">
                {{ todosListosSeleccionados() ? 'Deseleccionar todos' : 'Seleccionar todos' }}
              </button>
            }
          </div>
          @if (p.listos.length === 0) {
            <p class="p-4 text-sm text-gray-400 text-center">Ningun alumno listo para matricular</p>
          } @else {
            <div class="max-h-72 overflow-y-auto">
              <table class="data-table text-xs">
                <thead>
                  <tr>
                    <th class="w-8"></th>
                    <th>Fila</th>
                    <th>Alumno</th>
                    <th>DNI</th>
                    <th>Grado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of p.listos; track f.fila) {
                    <tr class="hover:bg-green-50/50">
                      <td class="text-center">
                        <input type="checkbox" class="w-4 h-4 accent-green-600 cursor-pointer"
                          [checked]="f.seleccionado" (change)="toggleSeleccion(f.fila)">
                      </td>
                      <td class="text-gray-400">{{ f.fila }}</td>
                      <td class="font-medium">{{ f.apellidos }}, {{ f.nombres }}</td>
                      <td class="font-mono">{{ f.dni }}</td>
                      <td>{{ f.gradoLabel }} {{ f.seccion }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Bloqueados -->
        <div class="border border-red-200 rounded-xl overflow-hidden">
          <div class="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
            <span class="icon text-red-500">block</span>
            <h4 class="font-semibold text-red-800 text-sm">No se pueden matricular ({{ p.bloqueados.length }})</h4>
          </div>
          @if (p.bloqueados.length === 0) {
            <p class="p-4 text-sm text-gray-400 text-center">Sin bloqueos</p>
          } @else {
            <div class="max-h-72 overflow-y-auto">
              <table class="data-table text-xs">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Alumno</th>
                    <th>DNI</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of p.bloqueados; track f.fila) {
                    <tr class="hover:bg-red-50/40">
                      <td class="text-gray-400">{{ f.fila }}</td>
                      <td class="font-medium">{{ f.apellidos }}, {{ f.nombres }}</td>
                      <td class="font-mono">{{ f.dni }}</td>
                      <td class="text-red-700">{{ f.motivo }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      @if (p.bloqueados.length > 0 && p.listos.length > 0) {
        <div class="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800">
          <span class="icon text-amber-500 shrink-0" style="font-size:16px">info</span>
          <p>
            Puede matricular ahora los alumnos listos. Los bloqueados (duplicados en BD o datos invalidos)
            puede corregirlos en el Excel y volver a cargar ese grupo en otro momento.
          </p>
        </div>
      }
    </div>
  }

  <!-- Resultado importacion -->
  @if (resultado()) {
    @let r = resultado()!;
    <div class="card p-5 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center"
               [ngClass]="r.creados > 0 ? 'bg-green-100' : 'bg-amber-100'">
            <span class="icon text-2xl"
                  [ngClass]="r.creados > 0 ? 'text-green-600' : 'text-amber-600'">
              {{ r.creados > 0 ? 'check_circle' : 'warning' }}
            </span>
          </div>
          <div>
            <h3 class="font-bold text-gray-900">Resultado del servidor</h3>
            <p class="text-sm text-gray-500">
              {{ r.creados }} de {{ r.total }} matricula(s) registradas en la base de datos
            </p>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm text-xs" (click)="limpiarResultado()">
          <span class="icon icon-sm">clear</span> Limpiar
        </button>
      </div>

      @if (r.estudiantes.length) {
        <div class="overflow-x-auto">
          <table class="data-table text-sm">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Alumno</th>
                <th>Grado</th>
                <th>Seccion</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              @for (e of r.estudiantes; track e.id) {
                <tr>
                  <td class="font-mono text-xs text-gray-500">{{ e.codigo }}</td>
                  <td class="font-medium">{{ e.apellidos }}, {{ e.nombres }}</td>
                  <td>{{ e.gradoLabel }}</td>
                  <td>{{ e.seccion }}</td>
                  <td class="text-xs text-gray-500">{{ e.email }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (r.erroresValidacion.length) {
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <h4 class="text-sm font-semibold text-amber-800 mb-2">
            Filas omitidas por validacion ({{ r.erroresValidacion.length }})
          </h4>
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
          <h4 class="text-sm font-semibold text-red-800 mb-2">
            Errores al guardar en BD ({{ r.errores.length }})
          </h4>
          <div class="space-y-1 max-h-40 overflow-y-auto text-xs">
            @for (err of r.errores; track err.fila + err.mensaje) {
              <p class="text-red-700">
                Fila {{ err.fila }} · DNI {{ err.dni }}: {{ err.mensaje }}
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
export class MasivaComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(MasivaService);

  archivoNombre = signal('');
  errorCarga = signal('');
  preview = signal<MasivaPreviewState | null>(null);
  resultado = signal<BulkImportMatriculaResult | null>(null);
  toast = signal<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  readonly nivelesTexto = NIVELES_VALIDOS.join(', ');

  readonly seleccionados = computed(() =>
    this.preview()?.listos.filter((f) => f.seleccionado) ?? [],
  );

  readonly todosListosSeleccionados = computed(() => {
    const listos = this.preview()?.listos ?? [];
    return listos.length > 0 && listos.every((f) => f.seleccionado);
  });

  readonly totalErrores = computed(() => {
    const r = this.resultado();
    if (!r) return 0;
    return r.errores.length + r.erroresValidacion.length;
  });

  ngOnInit(): void {
    this.layout.setTitle('Matricula Masiva');
  }

  descargarPlantilla(): void {
    descargarPlantillaMatricula();
    this.mostrarToast('Plantilla Excel descargada (10 alumnos de ejemplo)', 'info');
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
          listos: res.listos.map((f) => ({ ...f, seleccionado: true })),
          bloqueados: res.bloqueados,
        });
        if (res.listosCount === 0) {
          this.mostrarToast('Ningun alumno puede matricularse. Revise los bloqueados.', 'error');
        } else if (res.bloqueadosCount > 0) {
          this.mostrarToast(
            `${res.listosCount} listos · ${res.bloqueadosCount} bloqueados`,
            'info',
          );
        } else {
          this.mostrarToast(`${res.listosCount} alumnos listos para matricular`, 'success');
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

  confirmarMatricula(): void {
    const sel = this.seleccionados();
    if (!sel.length) return;

    this.svc
      .bulkImport({
        estudiantes: sel.map((f) => this.toPayload(f)),
      })
      .subscribe({
        next: (res) => {
          this.resultado.set({
            ...res,
            errores: res.errores ?? [],
            erroresValidacion: res.erroresValidacion ?? [],
            omitidos: res.omitidos ?? 0,
          });
          const matriculados = new Set(res.estudiantes.map((e) => e.dni));
          this.preview.update((p) => {
            if (!p) return p;
            return {
              ...p,
              listos: p.listos.filter((f) => !matriculados.has(f.dni)),
            };
          });
          if (res.creados > 0) {
            this.mostrarToast(
              `${res.creados} matricula(s) registradas en el servidor`,
              this.totalErrores() ? 'info' : 'success',
            );
          } else {
            this.mostrarToast('No se registro ninguna matricula.', 'error');
          }
        },
        error: (err: Error) => {
          this.errorCarga.set(err.message);
          this.mostrarToast(err.message, 'error');
        },
      });
  }

  cancelarPreview(): void {
    this.preview.set(null);
    this.archivoNombre.set('');
    this.errorCarga.set('');
  }

  private toPayload(f: BulkMatriculaPreviewItem) {
    return {
      fila: f.fila,
      nombres: f.nombres,
      apellidos: f.apellidos,
      dni: f.dni,
      email: f.email,
      sexo: f.sexo,
      fechaNac: f.fechaNac,
      nivel: f.nivel,
      grado: f.grado,
      seccion: f.seccion,
      anioIngreso: f.anioIngreso,
      apoderadoNombres: f.apoderadoNombres,
      apoderadoApellidos: f.apoderadoApellidos,
      apoderadoDni: f.apoderadoDni,
      apoderadoTelefono: f.apoderadoTelefono,
      apoderadoEmail: f.apoderadoEmail,
    };
  }

  limpiarResultado(): void {
    this.resultado.set(null);
    this.preview.set(null);
    this.archivoNombre.set('');
    this.errorCarga.set('');
  }

  mostrarToast(msg: string, type: 'success' | 'error' | 'info'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
