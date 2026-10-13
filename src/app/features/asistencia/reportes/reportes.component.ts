import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import {
  ESTADO_ASISTENCIA_LABEL,
  ReporteAsistenciaContext,
  ReporteAsistenciaTipo,
  ReporteColumn,
  ReporteFilters,
  ReporteFormato,
  ReporteJob,
  ReporteMeta,
  ReportePagination,
  ReporteRow,
  TIPOS_REPORTE_ASISTENCIA,
  tipoReporteAsistenciaLabel,
} from './reportes.model';
import { AsistenciaReportesService, triggerFileDownload } from './reportes.service';

@Component({
  selector: 'app-asistencia-reportes',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="space-y-5 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Asistencia</h3>
          @if (context(); as ctx) {
            <p class="text-sm text-gray-500 mt-0.5">{{ ctx.alcance.label }}</p>
            <p class="text-xs text-gray-400 mt-1">
              Ruta: <span class="font-mono">/reportes/asistencia</span>
              · Menú: Reportería → Asistencia
              · Año {{ ctx.anioEscolar }} · Mes {{ filtro().mes ?? ctx.mesActual }}
            </p>
            @if (ctx.alcance.consolidado) {
              <p class="text-xs text-indigo-600 mt-1 font-medium">
                Vista consolidada · {{ ctx.alcance.institucionesCount }} institución(es)
              </p>
            }
          }
        </div>
        <div class="flex flex-wrap gap-2">
          @if (puedeExportar()) {
            <button class="btn btn-secondary btn-sm" (click)="exportar('csv')" [disabled]="svc.exporting()">
              <span class="icon icon-sm">download</span> CSV
            </button>
            <button class="btn btn-secondary btn-sm" (click)="exportar('xlsx')" [disabled]="svc.exporting()">
              <span class="icon icon-sm">table_view</span> XLSX
            </button>
            <button class="btn btn-secondary btn-sm" (click)="exportar('pdf')" [disabled]="svc.exporting()">
              <span class="icon icon-sm">picture_as_pdf</span> PDF
            </button>
          }
          <button class="btn btn-primary btn-sm" (click)="cargar()" [disabled]="svc.loading()">
            <span class="icon icon-sm">refresh</span> Generar
          </button>
        </div>
      </div>

      @if (meta(); as m) {
        <div class="card p-4 bg-indigo-50/50 border border-indigo-100 text-sm">
          <div class="flex flex-wrap gap-x-6 gap-y-1 text-gray-600">
            <span><strong>Fecha de corte:</strong> {{ m.fechaCorte | date:'dd/MM/yyyy HH:mm' }}</span>
            <span><strong>Tipo:</strong> {{ tipoReporteAsistenciaLabel(m.tipo) }}</span>
            <span><strong>Fuente:</strong> {{ m.fuente }}</span>
          </div>
          @if (totalesEntries().length) {
            <div class="flex flex-wrap gap-3 mt-3">
              @for (t of totalesEntries(); track t.key) {
                <span class="badge badge-indigo">{{ t.label }}: {{ t.value ?? '—' }}</span>
              }
            </div>
          }
        </div>
      }

      <div class="card p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          @if (mostrarFiltrosTerritoriales()) {
            <div>
              <label class="form-label mb-1 block">DRE</label>
              <select class="form-select" [ngModel]="filtro().dre ?? ''" (ngModelChange)="setTerritorial('dre', $event)">
                <option value="">Todas</option>
                @for (d of dres(); track d) { <option [value]="d">{{ d }}</option> }
              </select>
            </div>
            <div>
              <label class="form-label mb-1 block">UGEL</label>
              <select class="form-select" [ngModel]="filtro().ugel ?? ''" (ngModelChange)="setTerritorial('ugel', $event)">
                <option value="">Todas</option>
                @for (u of ugels(); track u) { <option [value]="u">{{ u }}</option> }
              </select>
            </div>
          }
          <div>
            <label class="form-label mb-1 block">Tipo de reporte</label>
            <select class="form-select" [ngModel]="filtro().tipo" (ngModelChange)="setTipo($event)">
              @for (t of tipos; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Mes (YYYY-MM)</label>
            <input class="form-input" type="month" [ngModel]="filtro().mes" (ngModelChange)="setFiltro('mes', $event)">
          </div>
          <div>
            <label class="form-label mb-1 block">Nivel</label>
            <select class="form-select" [ngModel]="filtro().nivel ?? ''" (ngModelChange)="setFiltro('nivel', $event)">
              <option value="">Todos</option>
              @for (n of niveles(); track n) { <option [value]="n">{{ n }}</option> }
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Grado</label>
            <select class="form-select" [ngModel]="filtro().grado ?? ''" (ngModelChange)="setFiltro('grado', $event)">
              <option value="">Todos</option>
              @for (g of grados(); track g) { <option [value]="g">{{ g }}</option> }
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Sección</label>
            <select class="form-select" [ngModel]="filtro().seccion ?? ''" (ngModelChange)="setFiltro('seccion', $event)">
              <option value="">Todas</option>
              @for (s of secciones(); track s) { <option [value]="s">{{ s }}</option> }
            </select>
          </div>
          <div>
            <label class="form-label mb-1 block">Estado</label>
            <select class="form-select" [ngModel]="filtro().estado ?? ''" (ngModelChange)="setFiltro('estado', $event)">
              <option value="">Todos</option>
              @for (e of estados(); track e) {
                <option [value]="e">{{ estadoLabel(e) }}</option>
              }
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="form-label mb-1 block">Buscar</label>
            <input class="form-input" placeholder="Estudiante, DNI..."
              [ngModel]="filtro().busqueda" (ngModelChange)="setFiltro('busqueda', $event)">
          </div>
        </div>
      </div>

      @if (puedeExportar() && jobs().length) {
        <div class="card p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">Exportaciones en cola</h3>
          @for (job of jobs(); track job.id) {
            <div class="flex flex-wrap items-center justify-between gap-2 text-sm border rounded-lg px-3 py-2 mb-2">
              <span>#{{ job.id }} · {{ job.reportType }} · {{ jobStatusLabel(job.status) }}</span>
              @if (job.status === 'completed') {
                <button class="btn btn-secondary btn-sm" (click)="descargarJob(job)">Descargar</button>
              }
            </div>
          }
        </div>
      }

      @if (error()) {
        <div class="card p-8 text-center text-red-600" role="alert">{{ error() }}</div>
      } @else if (svc.loading()) {
        <div class="card p-12 text-center text-gray-400">Generando reporte…</div>
      } @else if (!items().length) {
        <div class="card p-16 text-center text-gray-500">
          Configure los filtros y pulse <strong>Generar</strong>.
        </div>
      } @else {
        <div class="card overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                @for (col of columns(); track col.key) {
                  <th class="px-4 py-3 font-semibold">{{ col.label }}</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (row of items(); track $index) {
                <tr class="hover:bg-gray-50">
                  @for (col of columns(); track col.key) {
                    <td class="px-4 py-2.5 text-gray-700">{{ formatCell(row, col) }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
          @if (pagination(); as p) {
            <div class="px-4 py-3 flex justify-between items-center text-sm border-t">
              <span>Página {{ p.page }} / {{ p.totalPages }} · {{ p.totalItems }} registro(s)</span>
              <div class="flex gap-2">
                <button class="btn btn-secondary btn-sm" [disabled]="p.page <= 1" (click)="irPagina(p.page - 1)">Anterior</button>
                <button class="btn btn-secondary btn-sm" [disabled]="p.page >= p.totalPages" (click)="irPagina(p.page + 1)">Siguiente</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AsistenciaReportesComponent implements OnInit {
  readonly svc = inject(AsistenciaReportesService);
  private readonly layout = inject(LayoutService);
  private readonly auth = inject(AuthService);

  readonly tipos = TIPOS_REPORTE_ASISTENCIA;
  readonly tipoReporteAsistenciaLabel = tipoReporteAsistenciaLabel;

  readonly context = signal<ReporteAsistenciaContext | null>(null);
  readonly meta = signal<ReporteMeta | null>(null);
  readonly columns = signal<ReporteColumn[]>([]);
  readonly items = signal<ReporteRow[]>([]);
  readonly pagination = signal<ReportePagination | null>(null);
  readonly error = signal<string | null>(null);
  readonly jobs = signal<ReporteJob[]>([]);

  readonly filtro = signal<ReporteFilters>({
    tipo: 'asistencia_resumen',
    page: 1,
    pageSize: 25,
  });

  readonly niveles = computed(() => this.context()?.filtros.niveles ?? []);
  readonly grados = computed(() => this.context()?.filtros.grados ?? []);
  readonly secciones = computed(() => this.context()?.filtros.secciones ?? []);
  readonly estados = computed(() => this.context()?.filtros.estados ?? []);
  readonly dres = computed(() => this.context()?.filtros.dres ?? []);
  readonly ugels = computed(() => this.context()?.filtros.ugels ?? []);
  readonly mostrarFiltrosTerritoriales = computed(() => {
    const ctx = this.context();
    return ctx?.alcance.consolidado || ctx?.alcance.nivel === 'MINEDU';
  });

  readonly totalesEntries = computed(() => {
    const totales = this.meta()?.totales ?? {};
    const labels: Record<string, string> = {
      totalAlumnos: 'Alumnos',
      totalRegistros: 'Registros',
      presentes: 'Presentes',
      faltas: 'Faltas',
      tardanzas: 'Tardanzas',
      justificadas: 'Justificadas',
      institucionesIncluidas: 'Instituciones',
    };
    return Object.entries(totales).map(([key, value]) => ({
      key,
      label: labels[key] ?? key,
      value,
    }));
  });

  ngOnInit(): void {
    this.layout.setTitle('Reportes de asistencia');
    this.cargarContexto();
    if (this.puedeExportar()) this.refrescarJobs();
  }

  estadoLabel(code: string): string {
    return ESTADO_ASISTENCIA_LABEL[code] ?? code;
  }

  private cargarContexto(): void {
    const f = this.filtro();
    this.svc.loadContext({ dre: f.dre, ugel: f.ugel }).subscribe({
      next: (ctx) => {
        this.context.set(ctx);
        this.filtro.update((cur) => ({
          ...cur,
          anio: cur.anio ?? ctx.anioEscolar,
          mes: cur.mes ?? ctx.mesActual,
        }));
      },
      error: () => this.error.set('No se pudo cargar el contexto institucional'),
    });
  }

  setTerritorial(key: 'dre' | 'ugel', value: string): void {
    this.filtro.update((f) => ({ ...f, [key]: value || undefined, page: 1 }));
    this.cargarContexto();
  }

  refrescarJobs(): void {
    const f = this.filtro();
    this.svc.listJobs({ dre: f.dre, ugel: f.ugel }).subscribe({
      next: (list) => this.jobs.set(list),
    });
  }

  jobStatusLabel(status: ReporteJob['status']): string {
    return ({ pending: 'Pendiente', processing: 'Procesando', completed: 'Listo', failed: 'Fallido' })[status];
  }

  descargarJob(job: ReporteJob): void {
    const f = this.filtro();
    this.svc.downloadJob(job.id, { dre: f.dre, ugel: f.ugel }).subscribe({
      next: (blob) => triggerFileDownload(blob, job.archivoNombre ?? `asistencia-${job.id}.${job.format}`),
    });
  }

  puedeExportar(): boolean {
    return this.auth.hasAnyPermiso('asistencia.exportar', 'admin.reportes');
  }

  setTipo(tipo: ReporteAsistenciaTipo): void {
    this.filtro.update((f) => ({ ...f, tipo, page: 1 }));
  }

  setFiltro<K extends keyof ReporteFilters>(key: K, value: ReporteFilters[K]): void {
    this.filtro.update((f) => ({ ...f, [key]: value || undefined, page: 1 }));
  }

  cargar(): void {
    this.error.set(null);
    this.svc.load(this.filtro()).subscribe({
      next: (res) => {
        this.meta.set(res.meta);
        this.columns.set(res.columns);
        this.items.set(res.items);
        this.pagination.set(res.pagination);
      },
      error: (err) => {
        this.items.set([]);
        this.error.set(err?.error?.message ?? 'Error al generar el reporte');
      },
    });
  }

  irPagina(page: number): void {
    this.filtro.update((f) => ({ ...f, page }));
    this.cargar();
  }

  exportar(format: ReporteFormato): void {
    const total = this.pagination()?.totalItems ?? 0;
    if (total > 500) {
      this.svc.createJob(this.filtro(), format).subscribe({
        next: (res) => {
          if (res.async && res.jobId) this.refrescarJobs();
          else this.exportarSync(format);
        },
      });
      return;
    }
    this.exportarSync(format);
  }

  private exportarSync(format: ReporteFormato): void {
    this.svc.exportSync(this.filtro(), format).subscribe({
      next: (blob) => triggerFileDownload(blob, `asistencia-${this.filtro().tipo}.${format}`),
      error: (err) => this.error.set(err?.error?.message ?? 'Error al exportar'),
    });
  }

  formatCell(row: ReporteRow, col: ReporteColumn): string {
    const val = row[col.key];
    return val == null || val === '' ? '—' : String(val);
  }
}
