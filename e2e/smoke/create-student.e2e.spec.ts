import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth.helper';
import { gotoAppRoute } from '../helpers/routing.helper';

test('crear nuevo estudiante desde expedientes', async ({ page }) => {
  const dni = '78901235';
  const nombres = 'Lucía';
  const apellidos = 'Vega Salazar';

  await loginAsAdmin(page);
  await gotoAppRoute(page, '/estudiantes/expedientes');
  await page.getByRole('button', { name: /Nuevo Estudiante/i }).click();
  await expect(page.getByRole('heading', { name: 'Nuevo Estudiante' })).toBeVisible();

  await page.getByPlaceholder('Nombres completos').fill(nombres);
  await page.getByPlaceholder('Apellidos').fill(apellidos);
  await page.getByPlaceholder('12345678').fill(dni);
  await page.locator('input[type="date"]').first().fill('2014-06-20');
  await page.locator('select').filter({ hasText: 'Primaria' }).first().selectOption('5° Primaria');
  await page.getByRole('button', { name: /Registrar estudiante/i }).click();

  await expect(page.getByRole('heading', { name: 'Nuevo Estudiante' })).toBeHidden({
    timeout: 15_000,
  });

  await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(apellidos);
  await expect(page.getByText(`${nombres}`).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(dni).first()).toBeVisible();
});
