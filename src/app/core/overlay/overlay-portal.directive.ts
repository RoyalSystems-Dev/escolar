import {
  Directive,
  ElementRef,
  inject,
  PLATFORM_ID,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const OVERLAY_ROOT_ID = 'app-overlay-root';

/** Teleporta el elemento al host global para que fixed/inset cubra toda la ventana. */
@Directive({
  selector: '[appOverlayPortal]',
  standalone: true,
})
export class OverlayPortalDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    afterNextRender(() => this.teleport());
  }

  private teleport(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = document.getElementById(OVERLAY_ROOT_ID);
    const node = this.el.nativeElement;
    if (root && node.parentElement !== root) {
      root.appendChild(node);
    }
  }
}
