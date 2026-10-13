import {
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../../auth/services/auth.service';
import { TenantContextService } from '../../../tenant/tenant-context.service';
import {
  DirectorioInstitucionesService,
  InstitucionDirectorio,
} from '../../../../features/instituciones/directorio-instituciones.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <header class="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0 shadow-sm">
      @if (!auth.isPortalEstudiante() || !layout.isPhone()) {
        <button class="btn-icon" (click)="layout.toggle()" title="Menu">
          <span class="icon">menu</span>
        </button>
      }
      <h1 class="text-base font-semibold text-gray-800 flex-1 truncate">{{ layout.pageTitle() }}</h1>
      @if (auth.isSiagie()) {
        <div class="relative shrink-0 min-w-0 max-w-[min(100%,20rem)] sm:max-w-[22rem]">
          @if (ieOpen()) {
            <div class="fixed inset-0 z-40" (click)="closeIePanel()" aria-hidden="true"></div>
          }
          <button
            type="button"
            id="tenant-ie-select"
            class="flex items-center gap-2 w-full min-w-0 rounded-xl border bg-white px-2.5 py-2 text-left shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
            [class.border-amber-300]="tenant.requiresSelection()"
            [class.ring-2]="tenant.requiresSelection()"
            [class.ring-amber-100]="tenant.requiresSelection()"
            [class.border-gray-200]="!tenant.requiresSelection()"
            (click)="toggleIePanel()"
            [attr.aria-expanded]="ieOpen()"
            aria-haspopup="listbox">
            <span class="icon icon-sm text-indigo-600 shrink-0">school</span>
            @if (selectedInstitucion(); as ie) {
              <span class="badge badge-indigo text-[10px] font-bold shrink-0">{{ ie.siglas }}</span>
              <span class="truncate text-sm font-medium text-gray-800 min-w-0">{{ ie.nombre }}</span>
              <span class="hidden md:inline text-[11px] text-gray-500 shrink-0 tabular-nums">{{ ie.alumnos }} al.</span>
            } @else {
              <span class="truncate text-sm font-medium text-amber-800">Seleccionar institución</span>
            }
            <span class="icon icon-sm text-gray-400 shrink-0 ml-auto">{{ ieOpen() ? 'expand_less' : 'expand_more' }}</span>
          </button>
          @if (ieOpen()) {
            <div
              class="dropdown-menu left-0 right-auto w-[min(100vw-2rem,26rem)] max-h-[min(70vh,28rem)] flex flex-col p-0 overflow-hidden shadow-lg border border-gray-100"
              role="listbox"
              aria-label="Instituciones educativas">
              <div class="px-3 py-2.5 border-b border-gray-100 bg-gray-50/80 shrink-0 space-y-1.5">
                <div class="flex items-baseline justify-between gap-2">
                  <div class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Buscar institución
                  </div>
                  <span class="text-[11px] text-gray-400 tabular-nums shrink-0">{{ ieListadoResumen() }}</span>
                </div>
                <div class="relative">
                  <span class="icon icon-sm text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
                  <input
                    #ieSearchInput
                    type="search"
                    class="form-input text-sm py-2 pl-9 pr-8"
                    placeholder="Nombre, siglas, modular, UGEL, distrito…"
                    autocomplete="off"
                    [ngModel]="ieSearch()"
                    (ngModelChange)="ieSearch.set($event)"
                    (keydown)="onIeSearchKeydown($event)"
                    (click)="$event.stopPropagation()"
                  />
                  @if (ieSearch()) {
                    <button
                      type="button"
                      class="absolute right-1 top-1/2 -translate-y-1/2 btn-icon !w-7 !h-7"
                      title="Limpiar búsqueda"
                      (click)="ieSearch.set(''); $event.stopPropagation()">
                      <span class="icon icon-sm text-gray-500">close</span>
                    </button>
                  }
                </div>
              </div>
              <div class="overflow-y-auto flex-1 py-1">
                @if (institucionesFiltradas().length === 0) {
                  <p class="px-3 py-6 text-center text-sm text-gray-400">Sin coincidencias</p>
                }
                @for (ie of institucionesFiltradas(); track ie.id) {
                  <button
                    type="button"
                    role="option"
                    class="w-full text-left px-3 py-2.5 transition-colors hover:bg-indigo-50/80"
                    [class.bg-indigo-50]="tenant.activeInstitutionId() === ie.id"
                    [attr.aria-selected]="tenant.activeInstitutionId() === ie.id"
                    (click)="selectInstitucion(ie.id)">
                    <div class="flex items-start gap-2.5">
                      <span class="badge badge-indigo text-[10px] font-bold mt-0.5 shrink-0 min-w-[2.5rem] justify-center">
                        {{ ie.siglas }}
                      </span>
                      <div class="min-w-0 flex-1">
                        <div class="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{{ ie.nombre }}</div>
                        <div class="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                          @if (ie.codigoModular) {
                            <span>Mod. {{ ie.codigoModular }}</span>
                          }
                          @if (ie.ugel) {
                            <span>{{ ie.ugel }}</span>
                          }
                        </div>
                      </div>
                      <span
                        class="text-[11px] font-semibold tabular-nums text-gray-600 bg-gray-100 rounded-full px-2 py-0.5 shrink-0"
                        title="Alumnos activos">
                        {{ ie.alumnos }}
                      </span>
                    </div>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
      <div class="flex items-center gap-1">
        <button class="btn-icon" title="Buscar"><span class="icon">search</span></button>
        <!-- Notificaciones -->
        <div class="relative">
          <button class="btn-icon relative" (click)="notifOpen.set(!notifOpen())" title="Notificaciones">
            <span class="icon">notifications</span>
            <span class="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none">3</span>
          </button>
          @if (notifOpen()) {
            <div class="dropdown-menu dropdown-menu-right w-80">
              <div class="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800 text-sm">Notificaciones</div>
              @for (n of notifications; track n.id) {
                <div class="dropdown-item !items-start !py-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" [class]="n.iconBg">
                    <span class="icon icon-sm text-white">{{ n.icon }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-800">{{ n.title }}</div>
                    <div class="text-xs text-gray-500">{{ n.time }}</div>
                  </div>
                </div>
              }
              <div class="px-4 py-2 border-t border-gray-100 text-center">
                <a
                  [routerLink]="notificacionesRoute()"
                  class="text-xs text-indigo-600 hover:underline"
                  (click)="notifOpen.set(false)">Ver todas</a>
              </div>
            </div>
          }
        </div>
        <!-- Perfil -->
        <div class="relative ml-1">
          <button class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
            (click)="userOpen.set(!userOpen())">{{ initiales() }}</button>
          @if (userOpen()) {
            <div class="dropdown-menu dropdown-menu-right w-56">
              <div class="px-4 py-3 border-b border-gray-100 pointer-events-none">
                <div class="font-semibold text-gray-800 text-sm">{{ auth.nombreCompleto() }}</div>
                <div class="text-xs text-gray-500 truncate">{{ auth.currentUser()?.email }}</div>
              </div>
              <a
                class="dropdown-item"
                [routerLink]="perfilRoute()"
                (click)="userOpen.set(false)">
                <span class="icon icon-sm">person</span> Mi Perfil
              </a>
              <a
                class="dropdown-item"
                routerLink="/cuenta/cambiar-contrasena"
                (click)="userOpen.set(false)">
                <span class="icon icon-sm">lock</span> Cambiar contraseña
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item danger w-full text-left" (click)="auth.logout()">
                <span class="icon icon-sm">logout</span> Cerrar Sesion
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit {
  readonly layout = inject(LayoutService);
  readonly auth   = inject(AuthService);
  readonly tenant = inject(TenantContextService);
  private readonly directorio = inject(DirectorioInstitucionesService);
  readonly instituciones = signal<InstitucionDirectorio[]>([]);
  ieOpen = signal(false);
  ieSearch = signal('');
  notifOpen = signal(false);
  userOpen  = signal(false);

  readonly selectedInstitucion = computed(() => {
    const id = this.tenant.activeInstitutionId();
    if (id == null) return null;
    return this.instituciones().find((item) => item.id === id) ?? null;
  });

  private readonly ieSearchInput = viewChild<ElementRef<HTMLInputElement>>('ieSearchInput');

  readonly institucionesFiltradas = computed(() => {
    const q = this.ieSearch().trim().toLowerCase();
    const list = this.instituciones();
    if (!q) return list;
    const tokens = q.split(/\s+/).filter(Boolean);
    return list.filter((ie) => {
      const haystack = [
        ie.nombre,
        ie.siglas,
        ie.codigoModular,
        ie.ugel,
        ie.dre,
        ie.distrito,
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  });

  readonly ieListadoResumen = computed(() => {
    const total = this.instituciones().length;
    const visibles = this.institucionesFiltradas().length;
    const q = this.ieSearch().trim();
    if (!total) return 'Sin IE';
    if (!q) return `${total} IE`;
    return `${visibles} de ${total}`;
  });
  notifications = [
    { id: 1, title: 'Nuevo pago registrado', time: 'Hace 5 min', icon: 'payments', iconBg: 'bg-green-500' },
    { id: 2, title: '3 solicitudes de matricula pendientes', time: 'Hace 1 hora', icon: 'assignment', iconBg: 'bg-blue-500' },
    { id: 3, title: 'Alerta: 5 estudiantes con inasistencia', time: 'Hace 2 horas', icon: 'warning', iconBg: 'bg-orange-500' },
  ];
  ngOnInit(): void {
    if (!this.auth.isSiagie()) return;
    this.directorio.instituciones().subscribe({
      next: (list) => {
        this.instituciones.set(list);
        this.syncInstitutionLabel(list);
        this.ensureDefaultInstitution(list);
      },
      error: () => this.instituciones.set([]),
    });
  }

  private institutionLabel(ie: InstitucionDirectorio): string {
    return `${ie.siglas} · ${ie.nombre}`;
  }

  private syncInstitutionLabel(list: InstitucionDirectorio[]): void {
    const id = this.tenant.activeInstitutionId();
    if (id == null) return;
    const ie = list.find((item) => item.id === id);
    if (ie) {
      this.tenant.setActiveInstitutionId(id, { label: this.institutionLabel(ie) });
    }
  }

  /** Primera visita SIAGIE: selecciona la IE con más alumnos para evitar listas vacías. */
  private ensureDefaultInstitution(list: InstitucionDirectorio[]): void {
    if (!list.length || this.tenant.activeInstitutionId() != null) return;
    const best = [...list].sort((a, b) => b.alumnos - a.alumnos)[0];
    if (best?.alumnos > 0) {
      this.tenant.setActiveInstitutionId(best.id, { label: this.institutionLabel(best) });
    }
  }

  toggleIePanel(): void {
    const next = !this.ieOpen();
    this.ieOpen.set(next);
    if (next) {
      this.notifOpen.set(false);
      this.userOpen.set(false);
      queueMicrotask(() => this.ieSearchInput()?.nativeElement.focus());
    } else {
      this.ieSearch.set('');
    }
  }

  onIeSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeIePanel();
    }
  }

  closeIePanel(): void {
    this.ieOpen.set(false);
    this.ieSearch.set('');
  }

  selectInstitucion(id: number): void {
    const ie = this.instituciones().find((item) => item.id === id);
    this.tenant.setActiveInstitutionId(id, {
      label: ie ? this.institutionLabel(ie) : undefined,
    });
    this.closeIePanel();
  }

  initiales(): string {
    const u = this.auth.currentUser();
    return u ? `${u.nombre[0]??''}${u.apellido[0]??''}`.toUpperCase() : '?';
  }

  perfilRoute(): string {
    if (this.auth.isPortalEstudiante()) return '/portal-estudiante/perfil';
    if (this.auth.isPortalDocente()) return '/portal-docente/mis-datos';
    if (this.auth.isPortalPadre()) return '/portal-padre/ficha';
    return '/perfil';
  }

  notificacionesRoute(): string {
    if (this.auth.isPortalEstudiante()) return '/portal-estudiante/comunicados';
    if (this.auth.isPortalDocente()) return '/portal-docente/comunicados';
    if (this.auth.isPortalPadre()) return '/portal-padre/comunicacion';
    return '/comunicaciones/notificaciones';
  }
}
