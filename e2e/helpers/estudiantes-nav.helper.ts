import { expect, Page } from '@playwright/test';
import { gotoAppRoute } from './routing.helper';

export interface EstudiantesRouteSpec {
  route: string;
  heading: RegExp;
}

/** Rutas staff del área Estudiantes (+ auditoría). */
export const ESTUDIANTES_STAFF_ROUTES: EstudiantesRouteSpec[] = [
  { route: '/estudiantes/expedientes', heading: /Gestion de Estudiantes|Gestión de Estudiantes/i },
  { route: '/estudiantes/documentos', heading: /Documentos de Estudiantes/i },
  { route: '/estudiantes/conducta', heading: /Control de Conducta/i },
  { route: '/estudiantes/auditoria-cambios', heading: /Privacidad y auditoría/i },
  { route: '/estudiantes/representante-vinculos', heading: /Vínculos representante/i },
];

/** Rutas del portal estudiante (barra inferior + accesos frecuentes). */
export const PORTAL_ESTUDIANTE_ROUTES: EstudiantesRouteSpec[] = [
  { route: '/portal-estudiante/inicio', heading: /^Hola,/i },
  { route: '/portal-estudiante/clases', heading: /Mis Clases/i },
  { route: '/portal-estudiante/tareas', heading: /Mis Tareas/i },
  { route: '/portal-estudiante/comunicados', heading: /Comunicados/i },
  { route: '/portal-estudiante/perfil', heading: /Mi ficha/i },
  { route: '/portal-estudiante/horarios', heading: /Mis Horarios/i },
  { route: '/portal-estudiante/notas', heading: /Mis Notas/i },
  { route: '/portal-estudiante/asistencia', heading: /Mi Asistencia/i },
];

export async function expectEstudiantesRouteAccessible(
  page: Page,
  spec: EstudiantesRouteSpec,
): Promise<void> {
  await gotoAppRoute(page, spec.route);
  await expect(page.getByRole('heading', { name: spec.heading }).first()).toBeVisible({
    timeout: 25_000,
  });
}
