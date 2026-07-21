import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { forkJoin } from 'rxjs';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { HorariosService } from '../../academico/horarios/services/horarios.service';
import { PortalEstudianteService } from '../services/portal-estudiante.service';
import { ClasesTemarioService } from './clases-temario.service';
import {
  estadoTemarioBadge,
  estadoTemarioLabel,
  materialTemarioLabel,
  TemarioClaseItem,
  temarioImagenUrl,
  temarioMaterialUrl,
  tieneContenidoClase,
} from '../../portal-docente/temario/temario.model';
import {
  formatBytes,
  resourceFileUrl,
  tipoRecursoBadge,
  tipoRecursoEmoji,
  tipoRecursoLabel,
} from '../../portal-docente/recursos/recursos.model';
import { ApiResource } from '../../../core/api/api.models';
import { ClasesEstudianteService } from './clases-estudiante.service';
import {
  CursoClaseEstudiante,
  SesionClaseDetalle,
  sesionKey,
} from './clases.model';
import { RecursosEstudianteService } from './recursos-estudiante.service';

@Component({
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="space-y-5 animate-fade-in">
      @if (!cursoSeleccionado()) {
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Mis Clases</h2>
            <p class="text-sm text-gray-400 mt-0.5">
              {{ auth.nombreCompleto() }} · {{ perfil().aulaLabel }} · Selecciona un curso para ver el temario
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="cargarCursos()" [disabled]="loadingCursos()">
            <span class="icon icon-sm">refresh</span> Actualizar
          </button>
        </div>

        @if (error()) {
          <div class="card p-4 border-red-200 bg-red-50 text-red-700 text-sm">{{ error() }}</div>
        }

        @if (loadingCursos() || horarios.loading()) {
          <div class="card p-12 text-center text-gray-400 text-sm">Cargando tus cursos…</div>
        } @else if (!cursos().length) {
          <div class="card p-16 text-center">
            <span class="text-4xl mb-4 block">📚</span>
            <h3 class="text-lg font-semibold text-gray-700">Sin cursos asignados</h3>
            <p class="text-sm text-gray-500 mt-1">Aún no hay cursos en tu horario escolar.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            @for (c of cursos(); track c.id) {
              <button type="button"
                class="card overflow-hidden p-0 text-left hover:shadow-md hover:border-indigo-200 border border-transparent transition-all group flex"
                (click)="seleccionarCurso(c)">
                <div class="w-24 sm:w-28 shrink-0 overflow-hidden bg-gray-100">
                  <img [src]="c.imagenCabecera" [alt]="c.nombre"
                    class="w-full h-full min-h-[5.5rem] object-cover transition-transform duration-300 group-hover:scale-105">
                </div>
                <div class="flex-1 min-w-0 p-3 flex flex-col justify-between gap-2">
                  <div>
                    <h3 class="font-bold text-gray-900 text-sm truncate">{{ c.nombre }}</h3>
                    <p class="text-xs text-gray-500 mt-0.5 truncate">{{ c.area }} · {{ c.docenteAbrev }}</p>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex flex-wrap gap-1">
                      <span class="badge badge-indigo text-[10px]">{{ c.sesionesSemana }}/sem</span>
                      <span class="badge badge-gray text-[10px]">{{ c.diasSemana.length }} días</span>
                    </div>
                    <span class="icon text-gray-300 shrink-0 text-lg group-hover:text-indigo-400 transition-colors">chevron_right</span>
                  </div>
                </div>
              </button>
            }
          </div>
        }
      } @else {
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <button type="button" class="btn btn-ghost btn-sm self-start" (click)="volver()">
            <span class="icon icon-sm">arrow_back</span> Mis clases
          </button>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="w-3 h-3 rounded-full" [ngClass]="cursoSeleccionado()!.dotClass"></span>
              <h2 class="text-2xl font-bold text-gray-900">{{ cursoSeleccionado()!.nombre }}</h2>
            </div>
            <p class="text-sm text-gray-500 mt-0.5">
              {{ cursoSeleccionado()!.area }} · Prof. {{ cursoSeleccionado()!.docenteNombre }}
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="recargarCurso()" [disabled]="loadingCurso()">
            <span class="icon icon-sm">refresh</span> Actualizar
          </button>
        </div>

        @if (errorCurso()) {
          <div class="card p-4 border-red-200 bg-red-50 text-red-700 text-sm">{{ errorCurso() }}</div>
        }

        @if (loadingCurso()) {
          <div class="card p-12 text-center text-gray-400 text-sm">Cargando temario del curso…</div>
        } @else if (!sesiones().length) {
          <div class="card p-10 text-center text-gray-500 text-sm">
            Tu docente aún no ha publicado clases para este curso.
          </div>
        } @else {
          <p class="text-sm text-gray-500">{{ sesiones().length }} clase(s) en orden cronológico.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            @for (ses of sesiones(); track ses.fechaClase) {
              <div class="card overflow-hidden flex flex-col">
                <button type="button"
                  class="w-full text-left flex hover:bg-gray-50/80 transition-colors"
                  (click)="toggleSesion(ses.fechaClase)">
                  <div class="w-24 sm:w-28 shrink-0 overflow-hidden bg-gray-100">
                    <img
                      [src]="ses.imagenCabecera || cursoSeleccionado()!.imagenCabecera"
                      [alt]="ses.imagenCabeceraAlt || cursoSeleccionado()!.nombre"
                      class="w-full h-full min-h-[6.5rem] object-cover">
                  </div>
                  <div class="flex-1 min-w-0 p-3 flex flex-col justify-between gap-2">
                    <div>
                      <span class="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-1.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs mb-1.5">
                        {{ ses.orden }}
                      </span>
                      <div class="font-semibold text-gray-900 text-sm leading-snug">{{ ses.fechaClaseDisplay }}</div>
                      <div class="text-xs text-gray-500 mt-0.5">
                        {{ ses.temas.length }} tema(s)
                        @if (ses.recursos.length) { · {{ ses.recursos.length }} recurso(s) }
                      </div>
                    </div>
                    <span class="icon text-gray-400 text-lg self-end transition-transform"
                      [class.rotate-180]="sesionExpandida(ses.fechaClase)">expand_more</span>
                  </div>
                </button>

                @if (sesionExpandida(ses.fechaClase)) {
                  <div class="px-3 pb-3 pt-0 border-t border-gray-100 space-y-3 max-h-[28rem] overflow-y-auto">
                    @for (t of ses.temas; track t.id) {
                      <div class="rounded-lg border border-gray-100 bg-gray-50/60 overflow-hidden mt-3">
                        <button type="button"
                          class="w-full flex items-start gap-3 p-3 text-left hover:bg-white transition-colors"
                          (click)="toggleTema(t.id)">
                          <div class="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 text-xs font-bold">
                            {{ t.numero }}
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="font-medium text-gray-900">{{ t.titulo }}</div>
                          </div>
                          <span class="badge text-xs shrink-0" [ngClass]="estadoBadge(t.estado)">
                            {{ estadoLabel(t.estado) }}
                          </span>
                          <span class="icon text-gray-400 text-sm shrink-0"
                            [class.rotate-180]="temaExpandido(t.id)">expand_more</span>
                        </button>

                        @if (temaExpandido(t.id)) {
                          <div class="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100 bg-white">
                            @if (t.contenidoClase) {
                              <div>
                                <p class="text-xs font-semibold text-gray-500 mb-1">Desarrollo de la clase</p>
                                <div class="text-sm text-gray-800 whitespace-pre-line leading-relaxed rounded-lg bg-gray-50 p-3">{{ t.contenidoClase }}</div>
                              </div>
                            }
                            @if (t.descripcion) {
                              <div>
                                <p class="text-xs font-semibold text-gray-500 mb-1">Resumen</p>
                                <p class="text-sm text-gray-700 whitespace-pre-line">{{ t.descripcion }}</p>
                              </div>
                            }
                            @if (t.objetivos) {
                              <div>
                                <p class="text-xs font-semibold text-gray-500 mb-1">Objetivos</p>
                                <p class="text-sm text-gray-600 whitespace-pre-line">{{ t.objetivos }}</p>
                              </div>
                            }
                            @if (t.imagenesClase?.length) {
                              <div>
                                <p class="text-xs font-semibold text-gray-500 mb-2">Imágenes y recursos visuales</p>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  @for (img of t.imagenesClase; track img.url) {
                                    <figure class="rounded-lg border border-gray-100 overflow-hidden">
                                      <img [src]="imagenUrl(img)" [alt]="img.nombre" class="w-full h-28 object-cover">
                                      @if (img.nombre || img.leyenda) {
                                        <figcaption class="p-2 text-xs text-gray-600">
                                          @if (img.nombre) { <span class="font-medium text-gray-800">{{ img.nombre }}</span> }
                                          @if (img.leyenda) { <p class="mt-0.5">{{ img.leyenda }}</p> }
                                        </figcaption>
                                      }
                                    </figure>
                                  }
                                </div>
                              </div>
                            }
                            @if (t.tieneMaterial) {
                              <div class="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 space-y-2">
                                <p class="text-xs font-semibold text-indigo-700">
                                  Material del docente · {{ materialLabel(t.materialTipo) }}
                                </p>
                                @if (t.materialTitulo) {
                                  <p class="text-sm font-medium text-gray-900">{{ t.materialTitulo }}</p>
                                }
                                @if (t.materialDescripcion) {
                                  <p class="text-sm text-gray-700 whitespace-pre-line">{{ t.materialDescripcion }}</p>
                                }
                                @if (materialUrl(t); as url) {
                                  <a [href]="url" target="_blank" rel="noopener"
                                    class="btn btn-secondary btn-sm inline-flex">
                                    <span class="icon icon-sm">open_in_new</span>
                                    @if (t.materialTipo === 'video' || t.materialTipo === 'enlace') { Ver enlace }
                                    @else { Abrir material }
                                  </a>
                                }
                              </div>
                            }
                            @if (!tieneContenido(t) && !t.tieneMaterial) {
                              <p class="text-sm text-gray-400 italic">Sin contenido publicado aún.</p>
                            }
                          </div>
                        }
                      </div>
                    }

                    @if (ses.recursos.length) {
                      <div>
                        <h4 class="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Recursos compartidos</h4>
                        <div class="space-y-2">
                          @for (r of ses.recursos; track r.id) {
                            <div class="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                              <span class="text-xl shrink-0">{{ tipoEmoji(r.tipo) }}</span>
                              <div class="flex-1 min-w-0">
                                <div class="flex flex-wrap items-center gap-2">
                                  <span class="font-medium text-gray-900 text-sm">{{ r.titulo }}</span>
                                  <span class="badge text-xs" [ngClass]="tipoBadge(r.tipo)">{{ tipoLabel(r.tipo) }}</span>
                                </div>
                                @if (r.descripcion) {
                                  <p class="text-xs text-gray-500 mt-1">{{ r.descripcion }}</p>
                                }
                              </div>
                              @if (linkRecurso(r); as url) {
                                <a [href]="url" target="_blank" rel="noopener"
                                  class="btn btn-secondary btn-sm shrink-0">Abrir</a>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class ClasesEstudianteComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly auth = inject(AuthService);
  readonly horarios = inject(HorariosService);
  readonly portal = inject(PortalEstudianteService);
  readonly temarioSvc = inject(ClasesTemarioService);
  readonly recursosSvc = inject(RecursosEstudianteService);
  readonly clasesSvc = inject(ClasesEstudianteService);

  private readonly _temario = signal<TemarioClaseItem[]>([]);
  private readonly _recursos = signal<ApiResource[]>([]);
  private readonly _loadingCursos = signal(false);
  private readonly _loadingCurso = signal(false);
  readonly error = signal('');
  readonly errorCurso = signal('');
  readonly cursoSeleccionado = signal<CursoClaseEstudiante | null>(null);
  readonly sesionesExpandidas = signal<Set<string>>(new Set());
  readonly temasExpandidos = signal<Set<number>>(new Set());

  readonly loadingCursos = this._loadingCursos.asReadonly();
  readonly loadingCurso = computed(
    () => this._loadingCurso() || this.temarioSvc.loading() || this.recursosSvc.loading(),
  );
  readonly perfil = computed(() => this.horarios.getPerfilEstudiante());
  readonly cursos = computed(() => this.clasesSvc.buildCursosAsignados());

  readonly sesiones = computed((): SesionClaseDetalle[] => {
    if (!this.cursoSeleccionado()) return [];
    return this.clasesSvc.buildSesionesPorCurso(this._temario(), this._recursos());
  });

  readonly estadoBadge = estadoTemarioBadge;
  readonly estadoLabel = estadoTemarioLabel;
  readonly tipoEmoji = tipoRecursoEmoji;
  readonly tipoLabel = tipoRecursoLabel;
  readonly tipoBadge = tipoRecursoBadge;
  readonly formatBytes = formatBytes;
  readonly materialLabel = materialTemarioLabel;
  readonly materialUrl = temarioMaterialUrl;
  readonly imagenUrl = temarioImagenUrl;
  readonly tieneContenido = tieneContenidoClase;

  ngOnInit(): void {
    this.layout.setTitle('Clases');
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.error.set('');
    this._loadingCursos.set(true);

    const iniciar = () => {
      if (!this.horarios.entradas().length && !this.horarios.loading()) {
        this.horarios.load();
      }
      const esperar = () => {
        if (this.horarios.loading()) {
          globalThis.setTimeout(esperar, 150);
          return;
        }
        this._loadingCursos.set(false);
      };
      esperar();
    };

    if (this.auth.hasRole('ESTUDIANTE')) {
      this.portal.ensureLoaded().subscribe(() => iniciar());
    } else {
      iniciar();
    }
  }

  seleccionarCurso(curso: CursoClaseEstudiante): void {
    this.cursoSeleccionado.set(curso);
    this.sesionesExpandidas.set(new Set());
    this.temasExpandidos.set(new Set());
    this._temario.set([]);
    this._recursos.set([]);
    this.cargarContenidoCurso(curso);
  }

  recargarCurso(): void {
    const curso = this.cursoSeleccionado();
    if (curso) this.cargarContenidoCurso(curso);
  }

  volver(): void {
    this.cursoSeleccionado.set(null);
    this._temario.set([]);
    this._recursos.set([]);
    this.errorCurso.set('');
  }

  private cargarContenidoCurso(curso: CursoClaseEstudiante): void {
    this.errorCurso.set('');
    this._loadingCurso.set(true);
    const p = this.perfil();

    forkJoin({
      temario: this.temarioSvc.listByCurso({
        curso: curso.nombre,
        nivel: p.nivel,
        grado: p.grado,
        seccion: p.seccion,
        anioEscolar: new Date().getFullYear(),
      }),
      recursos: this.recursosSvc.load({
        nivel: p.nivel,
        grado: p.grado,
        seccion: p.seccion,
        curso: curso.nombre,
      }),
    }).subscribe({
      next: ({ temario, recursos }) => {
        this._temario.set(temario);
        this._recursos.set(recursos);
        this._loadingCurso.set(false);
      },
      error: () => {
        this.errorCurso.set('No se pudo cargar el temario de este curso');
        this._loadingCurso.set(false);
      },
    });
  }

  toggleSesion(fecha: string): void {
    const key = sesionKey(fecha);
    const next = new Set(this.sesionesExpandidas());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.sesionesExpandidas.set(next);
  }

  sesionExpandida(fecha: string): boolean {
    return this.sesionesExpandidas().has(sesionKey(fecha));
  }

  toggleTema(id: number): void {
    const next = new Set(this.temasExpandidos());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.temasExpandidos.set(next);
  }

  temaExpandido(id: number): boolean {
    return this.temasExpandidos().has(id);
  }

  linkRecurso(r: ApiResource): string | null {
    if (r.url?.startsWith('http')) return r.url;
    if (r.url) return resourceFileUrl(r.url);
    return null;
  }
}
