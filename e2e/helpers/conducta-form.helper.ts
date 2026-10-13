import { expect, Page } from '@playwright/test';

export function incidenteDrawer(page: Page) {
  return page.locator('aside.fixed.inset-y-0.right-0').filter({
    has: page.locator('h3', { hasText: 'Registrar Incidente' }),
  });
}

export async function abrirDrawerRegistrarIncidente(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Registrar Incidente/i }).click();
  await expect(incidenteDrawer(page)).toBeVisible();
}

export async function seleccionarAlumnoIncidente(page: Page, textoBusqueda: string): Promise<void> {
  const drawer = incidenteDrawer(page);
  const input = drawer.getByPlaceholder('Buscar alumno por nombre...');
  await input.click();
  for (let intento = 0; intento < 5; intento++) {
    await input.fill(intento === 0 ? textoBusqueda : `${textoBusqueda}${intento}`);
    await input.fill(textoBusqueda);
    const token = textoBusqueda.split(/\s+/)[0] ?? textoBusqueda;
    const opcion = drawer.locator('button').filter({ hasText: new RegExp(token, 'i') }).first();
    if (await opcion.isVisible().catch(() => false)) {
      await opcion.click();
      break;
    }
    await page.waitForTimeout(400);
    if (intento === 4) {
      await expect(opcion).toBeVisible({ timeout: 5_000 });
    }
  }
  await expect(drawer.locator('.border-indigo-200.bg-indigo-50')).toBeVisible();
}

export async function guardarIncidente(page: Page, descripcion: string): Promise<void> {
  const drawer = incidenteDrawer(page);
  await drawer.locator('textarea').fill(descripcion);
  const save = drawer.locator('.border-t').getByRole('button', { name: /Guardar/i });
  await expect(save).toBeEnabled({ timeout: 10_000 });
  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/conduct-incidents') && res.request().method() === 'POST',
  );
  await save.click();
  const response = await createResponse;
  expect(response.ok(), `crear incidente → HTTP ${response.status()}`).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Registrar Incidente' })).toBeHidden({
    timeout: 15_000,
  });
}
