import {
  Directive,
  ElementRef,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const OVERLAY_ROOT_ID = 'app-overlay-root';

/** Teleporta el elemento al host global para que fixed/inset cubra toda la ventana. */
@Directive({
  selector: '[appOverlayPortal]',
  standalone: true,
})
export class OverlayPortalDirective implements OnInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = document.getElementById(OVERLAY_ROOT_ID);
    if (root && this.el.nativeElement.parentElement !== root) {
      root.appendChild(this.el.nativeElement);
    }
  }
}
