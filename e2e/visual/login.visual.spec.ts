import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('regresión visual de la pantalla de acceso', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('h1', { hasText: 'EscolarERP' }).waitFor();
    await page.getByRole('heading', { name: 'Iniciar Sesion' }).waitFor();

    await expect(page).toHaveScreenshot('login-page.png', { fullPage: true });
  });
});
