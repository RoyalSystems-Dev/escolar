import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth.helper';

test.describe('Smoke E2E', () => {
  test('admin puede abrir nueva matrícula', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/matricula/nueva');

    await expect(page.locator('h2', { hasText: 'Nueva Matrícula' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Datos del Estudiante' })).toBeVisible();
  });
});
