import { Page } from '@playwright/test';

/** Ruta interna de la SPA con estrategia hash (`/#/ruta`). */
export function appRoute(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/#${normalized}`;
}

export async function gotoAppRoute(page: Page, path: string): Promise<void> {
  await page.goto(appRoute(path));
}
