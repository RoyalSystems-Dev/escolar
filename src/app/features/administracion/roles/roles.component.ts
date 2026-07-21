import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { RolesService } from './roles.service';
import { RolCodigo, RolDto, SeccionPermisos } from './roles.model';

interface Rol {
  codigo: RolCodigo;
  label: string;
  descripcion: string;
  color: string;
  esAdmin: boolean;
  permisos: Set<string>;
  usuariosCount: number;
}

function mapRol(dto: RolDto): Rol {
  return {
    codigo: dto.codigo,
    label: dto.label,
    descripcion: dto.descripcion,
    color: dto.color,
    esAdmin: dto.esAdmin,
    permisos: new Set(dto.permisos),
    usuariosCount: dto.usuariosCount,
  };
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="flex gap-5 h-full">
      <div class="w-72 shrink-0 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800">Roles</h2>
        </div>

        @if (cargando()) {
          <div class="card p-6 text-center text-sm text-gray-500">Cargando roles...</div>
        } @else if (error()) {
          <div class="card p-6 text-center text-sm text-red-600">{{ error() }}</div>
        } @else {
          @for (rol of roles(); track rol.codigo) {
            <button class="w-full text-left card p-4 hover:shadow-md transition-shadow border-2"
              [ngClass]="rolActivo()?.codigo === rol.codigo ? 'border-indigo-400 bg-indigo-50' : 'border-transparent'"
              (click)="seleccionarRol(rol)">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
                    [ngClass]="rol.color">
                    <span class="icon text-base">shield</span>
                  </div>
                  <span class="font-semibold text-gray-800 text-sm">{{ rol.label }}</span>
                </div>
                @if (rol.esAdmin) {
                  <span class="badge badge-indigo text-xs">Admin</span>
                }
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ rol.descripcion }}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-gray-400">
                  <span class="icon text-sm align-middle">group</span>
                  {{ rol.usuariosCount }} usuario(s)
                </span>
                <span class="text-xs font-medium text-indigo-600">
                  {{ permisosActivos(rol) }} permisos
                </span>
              </div>
            </button>
          }
        }
      </div>

      <div class="flex-1 min-w-0">
        @if (!rolActivo()) {
          <div class="card p-16 flex flex-col items-center justify-center text-center h-full">
            <span class="icon icon-2xl text-indigo-200 mb-3">touch_app</span>
            <p class="text-gray-500">Selecciona un rol para ver y editar sus permisos</p>
          </div>
        } @else {
          <div class="space-y-4 animate-fade-in">
            <div class="card p-5">
              <div class="flex items-center justify-between flex-wrap gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    [ngClass]="rolActivo()!.color">
                    <span class="icon">shield</span>
                  </div>
                  <div>
                    <h3 class="font-bold text-gray-900 text-lg">{{ rolActivo()!.label }}</h3>
                    <p class="text-sm text-gray-500">{{ rolActivo()!.descripcion }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  @if (!rolActivo()!.esAdmin) {
                    <button class="btn btn-secondary btn-sm" (click)="desmarcarTodos()">
                      <span class="icon">remove_done</span> Quitar todos
                    </button>
                    <button class="btn btn-secondary btn-sm" (click)="marcarTodos()">
                      <span class="icon">done_all</span> Marcar todos
                    </button>
                  }
                  <button class="btn btn-primary btn-sm" (click)="guardarPermisos()"
                    [disabled]="!cambiosPendientes() || guardando()">
                    <span class="icon">save</span> {{ guardando() ? 'Guardando...' : 'Guardar' }}
                  </button>
                </div>
              </div>

              @if (rolActivo()!.esAdmin) {
                <div class="mt-3 flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700">
                  <span class="icon icon-sm">info</span>
                  El rol Administrador tiene acceso total al sistema y no puede ser modificado.
                </div>
              }

              <div class="mt-4">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Permisos asignados</span>
                  <span class="font-semibold text-indigo-600">{{ permisosSeleccionados() }} / {{ totalPermisos() }}</span>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-indigo-500 transition-all duration-500"
                    [style.width]="(permisosSeleccionados() / totalPermisos() * 100) + '%'"></div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              @for (sec of secciones(); track sec.modulo) {
                <div class="card p-4">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="icon text-indigo-500">{{ sec.icono }}</span>
                      <span class="font-semibold text-gray-800 text-sm">{{ sec.modulo }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-gray-400">
                        {{ permisosSeccion(sec) }}/{{ sec.permisos.length }}
                      </span>
                      @if (!rolActivo()!.esAdmin) {
                        <button class="text-xs text-indigo-500 hover:underline"
                          (click)="toggleSeccion(sec)">
                          {{ todaSeccionActiva(sec) ? 'Quitar' : 'Todos' }}
                        </button>
                      }
                    </div>
                  </div>
                  <div class="h-1 bg-gray-100 rounded-full mb-3">
                    <div class="h-1 rounded-full transition-all duration-300"
                      [ngClass]="permisosSeccion(sec) === sec.permisos.length ? 'bg-green-400' : permisosSeccion(sec) > 0 ? 'bg-indigo-400' : 'bg-gray-200'"
                      [style.width]="(permisosSeccion(sec) / sec.permisos.length * 100) + '%'"></div>
                  </div>
                  <div class="space-y-1.5">
                    @for (permiso of sec.permisos; track permiso.codigo) {
                      <label class="flex items-center gap-2.5 cursor-pointer group"
                        [class.opacity-60]="rolActivo()!.esAdmin">
                        <input type="checkbox"
                          class="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 shrink-0"
                          [checked]="tienePermiso(permiso.codigo)"
                          [disabled]="rolActivo()!.esAdmin"
                          (change)="togglePermiso(permiso.codigo, $event)">
                        <span class="text-xs text-gray-600 group-hover:text-gray-900 transition-colors leading-tight">
                          {{ permiso.label }}
                        </span>
                        @if (rolActivo()!.esAdmin) {
                          <span class="icon text-green-500 ml-auto text-sm shrink-0">check</span>
                        }
                      </label>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>

    @if (notificacion(); as n) {
      <div class="fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in z-50"
        [ngClass]="n.tipo === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'">
        <span class="icon">{{ n.tipo === 'success' ? 'check_circle' : 'error' }}</span>
        {{ n.mensaje }}
      </div>
    }
  `
})
export class RolesComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  private readonly rolesService = inject(RolesService);
  private readonly auth = inject(AuthService);

  readonly secciones = signal<SeccionPermisos[]>([]);
  readonly totalPermisos = computed(() =>
    this.secciones().reduce((acc, s) => acc + s.permisos.length, 0),
  );

  readonly cargando = this.rolesService.loading;
  readonly guardando = this.rolesService.saving;
  readonly error = signal<string | null>(null);
  readonly notificacion = signal<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  private readonly _roles = signal<Rol[]>([]);
  readonly roles = this._roles.asReadonly();

  private readonly _rolActivo = signal<Rol | null>(null);
  readonly rolActivo = this._rolActivo.asReadonly();

  private readonly _permisosEditando = signal<Set<string>>(new Set());

  readonly cambiosPendientes = computed(() => {
    const r = this._rolActivo();
    if (!r) return false;
    const orig = [...r.permisos].sort().join(',');
    const edit = [...this._permisosEditando()].sort().join(',');
    return orig !== edit;
  });

  readonly permisosSeleccionados = computed(() => this._permisosEditando().size);

  ngOnInit(): void {
    this.layout.setTitle('Roles y Permisos');
    this.cargarRoles();
  }

  private cargarRoles(): void {
    this.rolesService.load().subscribe({
      next: (data) => {
        this.secciones.set(data.catalog);
        this._roles.set(data.roles.map(mapRol));
        this.error.set(null);
      },
      error: () => {
        this.error.set('No se pudieron cargar los roles. Verifica que el backend este activo.');
      },
    });
  }

  seleccionarRol(rol: Rol): void {
    this._rolActivo.set(rol);
    this._permisosEditando.set(new Set(rol.permisos));
  }

  tienePermiso(codigo: string): boolean {
    return this._rolActivo()?.esAdmin || this._permisosEditando().has(codigo);
  }

  togglePermiso(codigo: string, e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    this._permisosEditando.update((set) => {
      const next = new Set(set);
      if (checked) next.add(codigo);
      else next.delete(codigo);
      return next;
    });
  }

  toggleSeccion(sec: SeccionPermisos): void {
    const todos = sec.permisos.every((p) => this._permisosEditando().has(p.codigo));
    this._permisosEditando.update((set) => {
      const next = new Set(set);
      sec.permisos.forEach((p) =>
        todos ? next.delete(p.codigo) : next.add(p.codigo),
      );
      return next;
    });
  }

  marcarTodos(): void {
    this._permisosEditando.set(
      new Set(this.secciones().flatMap((s) => s.permisos.map((p) => p.codigo))),
    );
  }

  desmarcarTodos(): void {
    this._permisosEditando.set(new Set());
  }

  permisosActivos(rol: Rol): number {
    return rol.esAdmin ? this.totalPermisos() : rol.permisos.size;
  }

  permisosSeccion(sec: SeccionPermisos): number {
    if (this._rolActivo()?.esAdmin) return sec.permisos.length;
    return sec.permisos.filter((p) => this._permisosEditando().has(p.codigo)).length;
  }

  todaSeccionActiva(sec: SeccionPermisos): boolean {
    return sec.permisos.every((p) => this._permisosEditando().has(p.codigo));
  }

  guardarPermisos(): void {
    const rol = this._rolActivo();
    if (!rol || rol.esAdmin) return;

    const permisos = [...this._permisosEditando()];
    this.rolesService.updatePermissions(rol.codigo, { permisos }).subscribe({
      next: (actualizado) => {
        const actualizadoRol = mapRol(actualizado);
        this._roles.update((list) =>
          list.map((r) => (r.codigo === rol.codigo ? actualizadoRol : r)),
        );
        this._rolActivo.set(actualizadoRol);
        this._permisosEditando.set(new Set(actualizadoRol.permisos));
        this.mostrarNotificacion(
          this.auth.userRoles().includes(rol.codigo)
            ? `Permisos guardados para ${actualizadoRol.label}. Tu sesión se actualizó.`
            : `Permisos guardados para ${actualizadoRol.label}. Los usuarios con ese rol deben refrescar la página o volver a iniciar sesión.`,
          'success',
        );
        if (this.auth.userRoles().includes(rol.codigo)) {
          this.auth.syncSessionFromServer().subscribe({ error: () => {} });
        }
      },
      error: () => {
        this.mostrarNotificacion('Error al guardar los permisos', 'error');
      },
    });
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.notificacion.set({ mensaje, tipo });
    setTimeout(() => this.notificacion.set(null), 3000);
  }
}
