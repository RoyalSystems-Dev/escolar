import { test, expect } from '@playwright/test';
import { gotoAppRoute } from '../helpers/routing.helper';

test.describe('Login', () => {
  test('regresión visual de la pantalla de acceso', async ({ page }) => {
    await gotoAppRoute(page, '/auth/login');
    await page.locator('h1', { hasText: 'EscolarERP' }).waitFor();
    await page.getByRole('heading', { name: 'Iniciar Sesion' }).waitFor();

    await expect(page).toHaveScreenshot('login-page.png', { fullPage: true });
  });
});
