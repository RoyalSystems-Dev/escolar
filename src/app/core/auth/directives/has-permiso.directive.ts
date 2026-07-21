import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Muestra el contenido si el usuario tiene al menos uno de los permisos indicados.
 * Uso: *appHasPermiso="'matricula.aprobar'" o *appHasPermiso="['a', 'b']"
 */
@Directive({
  selector: '[appHasPermiso]',
  standalone: true,
})
export class HasPermisoDirective {
  private readonly auth = inject(AuthService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);

  readonly appHasPermiso = input<string | string[]>([], { alias: 'appHasPermiso' });
  readonly appHasPermisoMode = input<'any' | 'all'>('any');

  constructor() {
    effect(() => {
      const raw = this.appHasPermiso();
      const list = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
      const visible = list.length === 0
        ? true
        : this.appHasPermisoMode() === 'all'
          ? this.auth.hasPermiso(...list)
          : this.auth.hasAnyPermiso(...list);

      this.vcr.clear();
      if (visible) {
        this.vcr.createEmbeddedView(this.template);
      }
    });
  }
}
