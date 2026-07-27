import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth.helper';

test('crear nueva matricula desde el wizard', async ({ page }) => {
  const dniAlumno = '90345678';
  const nombres = 'Diego';
  const apellidoPaterno = 'Quispe';
  const apellidoMaterno = 'Mamani';

  await loginAsAdmin(page);
  await page.goto('/matricula/nueva');
  await expect(page.locator('h2', { hasText: 'Nueva Matrícula' })).toBeVisible();

  // Paso 1: Estudiante
  await page.getByPlaceholder('Ej: Juan Carlos').fill(nombres);
  await page.getByPlaceholder('Ej: García').fill(apellidoPaterno);
  await page.getByPlaceholder('Ej: Pérez').fill(apellidoMaterno);
  await page.locator('input[inputmode="numeric"]').first().fill(dniAlumno);
  await page.getByPlaceholder('Av. / Jr. / Calle, N° de vivienda').fill('Jr. Los Laureles 456, Surco');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Paso 2: Apoderado principal
  await expect(page.getByRole('heading', { name: 'Apoderados' })).toBeVisible();
  await page.getByPlaceholder('Ej: Carlos').first().fill('Roberto');
  await page.getByPlaceholder('Ej: Vega').first().fill('Quispe');
  await page.getByPlaceholder('Ej: Ramos').first().fill('Flores');
  await page.getByPlaceholder('00000000').fill('90345679');
  await page.getByPlaceholder('999 999 999').first().fill('987654321');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Paso 3: Grado (Primaria 5° Sección B)
  await expect(page.getByRole('heading', { name: 'Nivel Educativo y Grado' })).toBeVisible();
  await page.getByRole('button', { name: '5°', exact: true }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Paso 4: Documentos (opcional) → Finalizar
  await expect(page.getByRole('heading', { name: /Documentos/ })).toBeVisible();
  const finalizar = page.locator('button.btn-primary').filter({ hasText: 'Finalizar' });
  await finalizar.scrollIntoViewIfNeeded();
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/v1/students') && res.request().method() === 'POST',
  );
  await finalizar.click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();

  // Paso 5: Confirmación
  await expect(page.getByRole('heading', { name: '¡Matrícula completada!' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText(`${nombres} ${apellidoPaterno} ${apellidoMaterno}`, { exact: true })).toBeVisible();
  await expect(page.getByText(/Código:/)).toBeVisible();
});
