import { Component, inject } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { TenantContextService } from '../../../tenant/tenant-context.service';

@Component({
  selector: 'app-tenant-scope-banner',
  standalone: true,
  template: `
    @if (auth.isSiagie() && tenant.requiresSelection()) {
      <div
        class="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 shrink-0"
        role="status">
        Seleccione una institución educativa en la barra superior. Todo el sistema operará en el contexto de esa IE.
      </div>
    }
    @if (auth.isSiagie() && tenant.activeInstitutionId(); as ieId) {
      <div
        class="bg-indigo-50/90 border-b border-indigo-100 px-4 py-2 text-xs text-indigo-900 shrink-0 flex items-center gap-2.5"
        role="status">
        <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
          <span class="icon icon-sm">school</span>
        </span>
        <span class="min-w-0 leading-snug">
          <span class="text-indigo-600/90">Contexto activo</span>
          <strong class="font-semibold text-indigo-950 block sm:inline sm:ml-1">
            {{ tenant.activeInstitutionLabel() ?? ('Institución #' + ieId) }}
          </strong>
          <span class="hidden sm:inline text-indigo-700/80">
            — datos de alumnos, matrícula y operación acotados a esta IE.
          </span>
        </span>
      </div>
    }
  `,
})
export class TenantScopeBannerComponent {
  readonly auth = inject(AuthService);
  readonly tenant = inject(TenantContextService);
}
