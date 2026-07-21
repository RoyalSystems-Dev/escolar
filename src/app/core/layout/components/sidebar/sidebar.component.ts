import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService, NavItem } from '../../services/layout.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="flex flex-col h-full bg-slate-900 text-white transition-all duration-300 ease-in-out overflow-hidden"
      [style.width]="layout.sidebarWidth()"
      [class.fixed]="layout.isMobile()"
      [class.z-30]="layout.isMobile()"
      [style.transform]="layout.isMobile() && !layout.mobileOpen() ? 'translateX(-100%)' : 'translateX(0)'">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 shrink-0">
        <div class="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
          <span class="icon text-white">school</span>
        </div>
        @if (!layout.miniMode() || layout.isMobile()) {
          <div class="overflow-hidden">
            <div class="font-bold text-white text-sm leading-tight">EscolarERP</div>
            <div class="text-slate-400 text-xs">Sistema de Gestion</div>
          </div>
        }
      </div>
      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
        @for (item of visibleNav(); track item.label) {
          @if (!item.children) {
            <a [routerLink]="item.route" [queryParams]="item.queryParams" routerLinkActive="!bg-indigo-600 !text-white"
              [title]="layout.miniMode() && !layout.isMobile() ? item.label : ''"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer">
              <span class="icon icon-lg shrink-0">{{ item.icon }}</span>
              @if (!layout.miniMode() || layout.isMobile()) {
                <span class="text-sm font-medium truncate">{{ item.label }}</span>
              }
            </a>
          } @else {
            <div>
              <button [title]="layout.miniMode() && !layout.isMobile() ? item.label : ''"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors"
                (click)="toggleGroup(item.label)">
                <span class="icon icon-lg shrink-0">{{ item.icon }}</span>
                @if (!layout.miniMode() || layout.isMobile()) {
                  <span class="text-sm font-medium truncate flex-1 text-left">{{ item.label }}</span>
                  <span class="icon text-base transition-transform duration-200 shrink-0"
                    [style.transform]="openGroups().has(item.label) ? 'rotate(90deg)' : ''">chevron_right</span>
                }
              </button>
              @if ((!layout.miniMode() || layout.isMobile()) && openGroups().has(item.label)) {
                <div class="ml-3 mt-0.5 space-y-0.5 border-l border-slate-700/50 pl-3">
                  @for (child of item.children; track child.route) {
                    <a [routerLink]="child.route" [queryParams]="child.queryParams" routerLinkActive="!text-indigo-300 !font-semibold"
                      class="flex items-center gap-2 px-2 py-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white text-sm transition-colors">
                      <span class="icon text-base shrink-0">{{ child.icon }}</span>
                      <span class="truncate">{{ child.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }
        }
      </nav>
      <!-- Usuario -->
      @if (!layout.miniMode() || layout.isMobile()) {
        <div class="shrink-0 border-t border-slate-700/50 px-4 py-3 flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {{ initiales() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-white truncate">{{ auth.nombreCompleto() }}</div>
            <div class="text-xs text-slate-400 truncate">{{ rolLabel() }}</div>
          </div>
          <button class="btn-icon text-slate-400 hover:text-white" (click)="auth.logout()" title="Cerrar sesion">
            <span class="icon">logout</span>
          </button>
        </div>
      }
    </aside>
  `
})
export class SidebarComponent {
  readonly layout = inject(LayoutService);
  readonly auth   = inject(AuthService);
  private readonly _openGroups = signal<Set<string>>(new Set());
  readonly openGroups = this._openGroups.asReadonly();

  readonly visibleNav = computed(() =>
    this.layout.nav
      .map((item) => this.filterNavItem(item))
      .filter((item): item is NavItem => item !== null),
  );

  private filterNavItem(item: NavItem, parentZone?: NavItem['zone']): NavItem | null {
    const zone = item.zone ?? parentZone;

    if (item.children?.length) {
      if (!this.canSeeNavItem(item, zone)) return null;
      const children = item.children
        .map((child) => this.filterNavItem({ ...child, zone: child.zone ?? zone }, zone))
        .filter((child): child is NavItem => child !== null);
      if (!children.length) return null;
      return { ...item, children };
    }

    return this.canSeeNavItem(item, zone) ? item : null;
  }

  private canSeeNavItem(item: NavItem, zone?: NavItem['zone']): boolean {
    const effectiveZone = zone ?? item.zone;

    if (!this.auth.canSeeNavZone(effectiveZone)) return false;

    if (item.roles?.length && !this.auth.hasRole(...item.roles) && !this.auth.isAdmin()) {
      return false;
    }

    if (item.permisos?.length) {
      return this.auth.hasAnyPermiso(...item.permisos);
    }

    if (effectiveZone?.startsWith('portal-')) {
      return true;
    }

    if (effectiveZone === 'staff' && !this.auth.isStaffUser()) {
      return false;
    }

    return true;
  }

  toggleGroup(label: string): void {
    this._openGroups.update(set => { const n = new Set(set); n.has(label) ? n.delete(label) : n.add(label); return n; });
  }

  initiales(): string {
    const u = this.auth.currentUser();
    return u ? `${u.nombre[0]??''}${u.apellido[0]??''}`.toUpperCase() : '?';
  }

  rolLabel(): string {
    const roles = this.auth.userRoles();
    return roles[0] ?? this.auth.currentUser()?.email ?? '';
  }
}
