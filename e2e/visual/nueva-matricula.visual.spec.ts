import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth.helper';

test.describe('Nueva matrícula', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/matricula/nueva');
    await page.locator('h2', { hasText: 'Nueva Matrícula' }).waitFor();
  });

  test('regresión visual del paso 1 (datos del estudiante)', async ({ page }) => {
    await page.getByRole('heading', { name: 'Datos del Estudiante' }).waitFor();

    await expect(page.locator('.max-w-3xl')).toHaveScreenshot('nueva-matricula-paso-1.png');
  });
});
