import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

function redirectSinPermiso(): ReturnType<Router['createUrlTree']> {
  return inject(Router).createUrlTree(['/sin-permiso']);
}

/** Acceso al dashboard según permiso en BD (p. ej. dashboard.ver). */
export const dashboardGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isPortalPadre()) {
    return router.createUrlTree(['/portal-padre/inicio']);
  }
  if (auth.isPortalEstudiante()) {
    return router.createUrlTree(['/portal-estudiante/dashboard']);
  }
  if (auth.isPortalDocente()) {
    return router.createUrlTree(['/portal-docente']);
  }
  if (!auth.hasAnyPermiso('dashboard.ver')) {
    return router.createUrlTree(['/sin-permiso']);
  }
  return true;
};

/** Bloquea módulos administrativos a roles de portal (docente, estudiante, padre). */
export const staffAreaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAdmin()) return true;
  if (auth.isPortalDocente() || auth.isPortalEstudiante() || auth.isPortalPadre()) {
    return redirectSinPermiso();
  }
  return true;
};

/** Requiere al menos uno de los roles indicados */
export const roleGuard = (...roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  if (!roles.length) return true;
  return auth.hasRole(...roles) ? true : redirectSinPermiso();
};

/** Requiere al menos uno de los permisos indicados */
export const permisoGuard = (...permisos: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  if (!permisos.length) return true;
  if (auth.isAdmin() || auth.hasRole('DIRECTOR')) return true;
  return auth.hasAnyPermiso(...permisos) ? true : redirectSinPermiso();
};

/** Requiere todos los permisos indicados */
export const permisoAllGuard = (...permisos: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  if (!permisos.length) return true;
  return auth.hasPermiso(...permisos) ? true : redirectSinPermiso();
};
