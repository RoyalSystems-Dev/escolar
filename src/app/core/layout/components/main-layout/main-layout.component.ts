import { Component, inject, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from '../../services/layout.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      @if (layout.isMobile() && layout.mobileOpen()) {
        <div class="fixed inset-0 bg-black/40 z-20 lg:hidden" (click)="layout.closeMobile()"></div>
      }
      <app-sidebar />
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300 ease-in-out">
        <app-header />
        <main class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6">
          <router-outlet />
        </main>
        <footer class="shrink-0 border-t border-gray-100 bg-white px-6 py-2">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>© 2025 EscolarERP — Sistema Integral de Gestion Escolar</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>
      <div id="app-overlay-root" class="overlay-host" aria-hidden="true"></div>
    </div>
  `
})
export class MainLayoutComponent implements OnInit {
  readonly layout = inject(LayoutService);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    this._checkMobile();
    if (this.auth.isAuthenticated()) {
      this.auth.syncSessionFromServer().subscribe({ error: () => {} });
    }
  }
  @HostListener('window:resize')
  onResize(): void { this._checkMobile(); }
  private _checkMobile(): void { this.layout.setMobile(window.innerWidth < 1024); }
}
