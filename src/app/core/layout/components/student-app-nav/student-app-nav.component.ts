import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-student-app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav
      class="shrink-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navegación principal del portal estudiante">
      <div class="flex items-stretch justify-around max-w-lg mx-auto">
        @for (item of layout.studentAppNav; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="text-indigo-600"
            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
            class="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-1 text-gray-500 hover:text-indigo-600 transition-colors min-w-0">
            <span class="icon text-[22px] leading-none">{{ item.icon }}</span>
            <span class="text-[10px] font-medium truncate max-w-full">{{ item.label }}</span>
          </a>
        }
      </div>
    </nav>
  `,
})
export class StudentAppNavComponent {
  readonly layout = inject(LayoutService);
}
