import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import {
  combinarRequisitosConDocumentos,
  DocumentoMatriculaVista,
} from '../shared/documentos-requisitos';
import { Estudiante, ExpedientesService } from '../services/expedientes.service';
import { ApiStudentDocumentsResponse } from '../../../core/api/api.models';

@Component({
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Documentos de Estudiantes</h2>
          <p class="text-sm text-gray-500 mt-0.5">
            Busca un alumno y actualiza los documentos solicitados en matrícula
          </p>
          @if (!loading() && !error() && resultados().length) {
            <p class="text-xs text-teal-600 mt-1">
              {{ resultados().length }} estudiante(s) desde la base de datos
            </p>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Búsqueda -->
        <div class="lg:col-span-4 space-y-4">
          <div class="card p-4 space-y-3">
            <label class="form-label">Buscar estudiante</label>
            <div class="flex gap-2">
              <input
                class="form-input flex-1"
                [(ngModel)]="busqueda"
                placeholder="Nombre, DNI, código o email"
                (keyup.enter)="buscar()"
              >
              <button class="btn btn-primary" (click)="buscar()" [disabled]="loading()">
                <span class="icon icon-sm">search</span>
              </button>
            </div>
            @if (loading()) {
              <p class="text-xs text-indigo-500">Cargando...</p>
            }
            @if (error()) {
              <p class="text-xs text-red-500">{{ error() }}</p>
            }
          </div>

          <div class="card overflow-hidden">
            <div class="px-4 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              Resultados ({{ resultados().length }})
            </div>
            <div class="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
              @if (loading()) {
                <div class="p-8 text-center text-sm text-indigo-500">
                  Cargando estudiantes desde la base de datos...
                </div>
              } @else if (error()) {
                <div class="p-8 text-center text-sm text-red-500">
                  {{ error() }}
                </div>
              } @else if (!resultados().length) {
                <div class="p-8 text-center text-sm text-gray-400">
                  No hay estudiantes registrados en la base de datos
                </div>
              }
              @for (e of resultados(); track e.id) {
                <button
                  type="button"
                  class="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors"
                  [class.bg-indigo-50]="seleccionado()?.id === e.id"
                  (click)="seleccionar(e)"
                >
                  <div class="font-medium text-gray-900 text-sm">
                    {{ e.apellidos }}, {{ e.nombres }}
                  </div>
                  <div class="text-xs text-gray-500 mt-0.5">
                    {{ e.codigo }} · DNI {{ e.dni || '—' }} · {{ e.grado }} {{ e.seccion }}
                  </div>
                  <div class="text-xs mt-1"
                    [class.text-green-600]="pctEntregados(e) === 100"
                    [class.text-amber-600]="pctEntregados(e) > 0 && pctEntregados(e) < 100"
                    [class.text-red-500]="pctEntregados(e) === 0">
                    Documentos: {{ docsEntregados(e) }}/{{ docsTotal(e) }} entregados
                  </div>
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Panel documentos -->
        <div class="lg:col-span-8">
          @if (!seleccionado()) {
            <div class="card p-16 text-center text-gray-400">
              <span class="icon icon-2xl text-indigo-200 mb-3 block">folder_open</span>
              Selecciona un estudiante para gestionar sus documentos
            </div>
          } @else {
              @if (loadingDocs()) {
                <div class="card p-12 text-center text-sm text-indigo-500">
                  Cargando documentos desde la base de datos...
                </div>
              } @else if (docsError()) {
                <div class="card p-8 text-center text-sm text-red-500">{{ docsError() }}</div>
              } @else {
            <div class="space-y-4">
              <div class="card p-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">
                      {{ seleccionado()!.apellidos }}, {{ seleccionado()!.nombres }}
                    </h3>
                    <p class="text-sm text-gray-500">
                      {{ seleccionado()!.codigo }} · {{ seleccionado()!.grado }} {{ seleccionado()!.seccion }}
                      · Matrícula {{ seleccionado()!.anioIngreso }}
                    </p>
                  </div>
                  <button
                    class="btn btn-secondary btn-sm"
                    (click)="sincronizarRequisitos()"
                    [disabled]="saving()"
                  >
                    <span class="icon icon-sm">sync</span>
                    Completar requisitos de matrícula
                  </button>
                </div>

                <div class="mt-4">
                  <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Progreso documental</span>
                    <span class="font-semibold">{{ pctActual() }}%</span>
                  </div>
                  <div class="progress">
                    <div class="progress-bar bg-teal-500 transition-all" [style.width]="pctActual() + '%'"></div>
                  </div>
                  <p class="text-xs text-gray-400 mt-2">
                    {{ entregadosActual() }} de {{ filas().length }} documentos entregados
                    · {{ obligatoriosPendientes() }} obligatorio(s) pendiente(s)
                  </p>
                </div>
              </div>

              @if (mensaje()) {
                <div class="card p-3 text-sm"
                  [class.bg-green-50]="mensajeTipo() === 'ok'"
                  [class.text-green-700]="mensajeTipo() === 'ok'"
                  [class.bg-red-50]="mensajeTipo() === 'error'"
                  [class.text-red-700]="mensajeTipo() === 'error'">
                  {{ mensaje() }}
                </div>
              }

              <div class="card overflow-hidden">
                <div class="px-4 py-3 border-b bg-teal-50 flex items-center gap-2">
                  <span class="icon icon-sm text-teal-600">checklist</span>
                  <span class="text-sm font-semibold text-teal-800">
                    Requisitos para {{ seleccionado()!.grado }}
                  </span>
                </div>

                <div class="divide-y divide-gray-100">
                  @for (doc of filas(); track doc.tipo) {
                    <div class="p-4 flex flex-col sm:flex-row gap-4">
                      <div class="flex items-start gap-3 flex-1 min-w-0">
                        <label class="flex items-center gap-2 cursor-pointer shrink-0 mt-1">
                          <input
                            type="checkbox"
                            class="rounded border-gray-300 text-teal-600"
                            [checked]="doc.estado === 'entregado'"
                            (change)="toggleEntregado(doc, $event)"
                            [disabled]="saving()"
                          >
                        </label>
                        <div class="min-w-0">
                          <div class="font-medium text-gray-800 text-sm">{{ doc.tipo }}</div>
                          <div class="flex flex-wrap items-center gap-2 mt-1">
                            @if (doc.obligatorio) {
                              <span class="badge badge-red text-[10px]">Obligatorio</span>
                            } @else {
                              <span class="badge badge-gray text-[10px]">Opcional</span>
                            }
                            @if (!doc.registrado) {
                              <span class="badge badge-yellow text-[10px]">Sin registrar</span>
                            }
                            <span class="badge text-[10px]"
                              [ngClass]="doc.estado === 'entregado' ? 'badge-green' : doc.estado === 'vencido' ? 'badge-red' : 'badge-gray'">
                              {{ doc.estado }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="flex flex-col sm:flex-row gap-2 sm:items-center shrink-0">
                        <input
                          class="form-input text-xs w-full sm:w-36"
                          placeholder="N° / código"
                          [ngModel]="doc.numero"
                          (ngModelChange)="doc.numero = $event"
                          (blur)="guardarCampo(doc)"
                        >
                        <label class="btn btn-secondary btn-sm cursor-pointer whitespace-nowrap">
                          <span class="icon icon-sm">{{ doc.imagenUrl ? 'image' : 'upload_file' }}</span>
                          {{ doc.imagenUrl ? 'Cambiar' : 'Adjuntar' }}
                          <input type="file" accept="image/*,application/pdf" class="hidden"
                            (change)="onArchivo(doc, $event)">
                        </label>
                        @if (doc.imagenUrl) {
                          <button class="btn btn-ghost btn-sm" (click)="verImagen(doc)">
                            <span class="icon icon-sm">visibility</span>
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
              }
          }
        </div>
      </div>
    </div>

    @if (visorUrl()) {
      <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" (click)="visorUrl.set('')">
        <div class="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto p-4" (click)="$event.stopPropagation()">
          <div class="flex justify-between mb-3">
            <span class="font-semibold text-sm">{{ visorTitulo() }}</span>
            <button class="btn-icon" (click)="visorUrl.set('')"><span class="icon">close</span></button>
          </div>
          <img [src]="visorUrl()" alt="documento" class="max-w-full mx-auto">
        </div>
      </div>
    }
  `,
})
export class DocumentosComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  private readonly expedientesSvc = inject(ExpedientesService);

  readonly loading = this.expedientesSvc.loading;
  readonly error = this.expedientesSvc.error;

  busqueda = '';
  readonly loadingDocs = signal(false);
  readonly docsError = signal('');
  readonly documentosAlumno = signal<ApiStudentDocumentsResponse | null>(null);
  readonly seleccionado = signal<Estudiante | null>(null);
  readonly saving = signal(false);
  readonly mensaje = signal('');
  readonly mensajeTipo = signal<'ok' | 'error'>('ok');
  readonly visorUrl = signal('');
  readonly visorTitulo = signal('');

  readonly resultados = computed(() => this.expedientesSvc.estudiantes());

  readonly filas = computed(() => {
    const data = this.documentosAlumno();
    if (!data) return [] as DocumentoMatriculaVista[];
    return data.documentos.map((d) => ({
      id: d.id,
      tipo: d.tipo,
      obligatorio: d.obligatorio,
      estado: d.estado,
      numero: d.numero,
      fechaEntrega: d.fechaEntrega,
      imagenUrl: d.imagenUrl,
      registrado: d.registrado,
    }));
  });

  readonly entregadosActual = computed(() =>
    this.filas().filter((d) => d.estado === 'entregado').length,
  );

  readonly pctActual = computed(() => {
    const total = this.filas().length;
    if (!total) return 0;
    return Math.round((this.entregadosActual() / total) * 100);
  });

  readonly obligatoriosPendientes = computed(() =>
    this.filas().filter((d) => d.obligatorio && d.estado !== 'entregado').length,
  );

  ngOnInit(): void {
    this.layout.setTitle('Documentos');
    this.expedientesSvc.load();
  }

  buscar(): void {
    this.expedientesSvc.search(this.busqueda);
    this.seleccionado.set(null);
    this.documentosAlumno.set(null);
    this.docsError.set('');
  }

  docsEntregados(e: Estudiante): number {
    return combinarRequisitosConDocumentos(e.grado, e.documentos)
      .filter((d) => d.estado === 'entregado').length;
  }

  docsTotal(e: Estudiante): number {
    return combinarRequisitosConDocumentos(e.grado, e.documentos).length;
  }

  pctEntregados(e: Estudiante): number {
    const total = this.docsTotal(e);
    if (!total) return 0;
    return Math.round((this.docsEntregados(e) / total) * 100);
  }

  seleccionar(e: Estudiante): void {
    this.mensaje.set('');
    this.docsError.set('');
    this.seleccionado.set(e);
    this.cargarDocumentos(e.id);
  }

  private cargarDocumentos(studentId: number): void {
    this.loadingDocs.set(true);
    this.documentosAlumno.set(null);
    this.expedientesSvc.loadStudentDocuments(studentId).subscribe({
      next: (data) => {
        this.documentosAlumno.set(data);
        this.loadingDocs.set(false);
      },
      error: () => {
        this.docsError.set('No se pudieron cargar los documentos desde la base de datos.');
        this.loadingDocs.set(false);
      },
    });
  }

  sincronizarRequisitos(): void {
    const e = this.seleccionado();
    if (!e) return;
    this.saving.set(true);
    this.mensaje.set('');
    this.expedientesSvc.syncRequisitosMatricula(e.id).subscribe({
      next: () => {
        this.cargarDocumentos(e.id);
        this.expedientesSvc.refreshOne(e.id).subscribe();
        this.mensajeTipo.set('ok');
        this.mensaje.set('Requisitos de matrícula sincronizados correctamente.');
        this.saving.set(false);
      },
      error: () => {
        this.mensajeTipo.set('error');
        this.mensaje.set('No se pudieron sincronizar los requisitos.');
        this.saving.set(false);
      },
    });
  }

  toggleEntregado(doc: DocumentoMatriculaVista, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    doc.estado = checked ? 'entregado' : 'pendiente';
    if (checked && !doc.fechaEntrega) {
      const hoy = new Date();
      doc.fechaEntrega = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
    }
    this.persistirDocumento(doc);
  }

  guardarCampo(doc: DocumentoMatriculaVista): void {
    this.persistirDocumento(doc);
  }

  onArchivo(doc: DocumentoMatriculaVista, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      doc.imagenUrl = e.target?.result as string;
      doc.estado = 'entregado';
      if (!doc.fechaEntrega) {
        const hoy = new Date();
        doc.fechaEntrega = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
      }
      this.persistirDocumento(doc);
    };
    reader.readAsDataURL(file);
  }

  verImagen(doc: DocumentoMatriculaVista): void {
    if (!doc.imagenUrl) return;
    this.visorUrl.set(doc.imagenUrl);
    this.visorTitulo.set(doc.tipo);
  }

  private persistirDocumento(doc: DocumentoMatriculaVista): void {
    const e = this.seleccionado();
    if (!e) return;

    const payload = {
      tipo: doc.tipo,
      numero: doc.numero,
      estado: doc.estado,
      fechaEntrega: doc.fechaEntrega,
      imagenUrl: doc.imagenUrl,
    };

    this.saving.set(true);
    const req = doc.id
      ? this.expedientesSvc.updateDocument(e.id, doc.id, payload)
      : this.expedientesSvc.addDocument(e.id, payload);

    req.subscribe({
      next: () => {
        this.cargarDocumentos(e.id);
        this.expedientesSvc.refreshOne(e.id).subscribe();
        this.mensajeTipo.set('ok');
        this.mensaje.set(`Documento "${doc.tipo}" actualizado.`);
        this.saving.set(false);
      },
      error: () => {
        this.mensajeTipo.set('error');
        this.mensaje.set('Error al guardar el documento.');
        this.saving.set(false);
      },
    });
  }
}
