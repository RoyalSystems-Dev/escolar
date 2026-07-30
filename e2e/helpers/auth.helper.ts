import { Page } from '@playwright/test';
import { gotoAppRoute } from './routing.helper';

export async function loginAsAdmin(page: Page): Promise<void> {
  await gotoAppRoute(page, '/auth/login');
  await page.getByRole('button', { name: 'Administrador' }).click();
  await page.waitForURL('**/#/dashboard**', { timeout: 30_000 });
}

export async function waitForAppShell(page: Page): Promise<void> {
  await page.locator('app-main-layout, .min-h-screen').first().waitFor({ state: 'visible' });
}
