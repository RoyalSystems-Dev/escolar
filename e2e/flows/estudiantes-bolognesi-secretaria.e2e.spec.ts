import { test, expect, APIRequestContext } from '@playwright/test';
import {
  adminSessionBolognesi,
  loginAsSecretariaBolognesi,
  secretariaSessionBolognesi,
} from '../helpers/bolognesi.helper';
import {
  expectEstudianteAuditoriaContains,
  expectFormErrorVisible,
  expectFormValidationBlocked,
  uniqueLetras,
  uniqueSuffix,
  waitForAuditFlush,
} from '../helpers/crud-audit.helper';
import {
  ESTUDIANTES_STAFF_ROUTES,
  expectEstudiantesRouteAccessible,
} from '../helpers/estudiantes-nav.helper';
import { fillEstudianteMinimo, submitEstudianteNuevo } from '../helpers/estudiante-form.helper';
import { E2E_UPLOAD_PDF, setFilesAndEmitChange } from '../helpers/files.helper';
import { ensureInstitutionAnioEscolarCoherente } from '../helpers/maestros-setup.helper';
import { gotoAppRoute } from '../helpers/routing.helper';
import { API_V1, authHeaders } from '../helpers/tenant.helper';

async function anioBolognesi(request: APIRequestContext): Promise<number> {
  const session = await adminSessionBolognesi(request);
  return ensureInstitutionAnioEscolarCoherente(request, session);
}

/** Limpieza vía SIAGIE: la secretaría no tiene permiso de baja. */
async function eliminarAlumnoComoSiagie(request: APIRequestContext, dni: string): Promise<void> {
  const session = await adminSessionBolognesi(request);
  const headers = authHeaders(session.accessToken, session.bolognesiId);
  const list = await request.get(`${API_V1}/students`, {
    headers,
    params: { q: dni, page: '1', pageSize: '5' },
  });
  if (!list.ok()) return;
  const body = (await list.json()) as { items?: Array<{ id: number }> };
  const id = body.items?.[0]?.id;
  if (!id) return;
  await request.delete(`${API_V1}/students/${id}`, { headers });
}

test.describe('I.E. Francisco Bolognesi — secretaría m.destino', () => {
  test.setTimeout(240_000);

  test.beforeEach(async ({ page }) => {
    await loginAsSecretariaBolognesi(page);
  });

  test('smoke — pantallas Estudiantes sin selector de IE', async ({ page }) => {
    await expect(page.locator('#tenant-ie-select')).toHaveCount(0);
    for (const spec of ESTUDIANTES_STAFF_ROUTES) {
      await expectEstudiantesRouteAccessible(page, spec);
      await expect(page.getByRole('heading', { name: 'Acceso Denegado' })).toHaveCount(0);
      await expect(page.getByText(/Destino/i).first()).toBeVisible();
    }
  });

  test('expedientes — valida formularios y la baja queda rechazada', async ({ page, request }) => {
    const anioInst = await anioBolognesi(request);
    await secretariaSessionBolognesi(request);
    const dni = `${String(Date.now()).slice(-8)}`;
    const nombres = `Sec${uniqueLetras(3)}`;
    const apellidos = `Dest${uniqueLetras(4)}`;

    try {
      await gotoAppRoute(page, '/estudiantes/expedientes');
      await page.getByRole('button', { name: /Nuevo Estudiante/i }).click();
      await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeVisible();
      await expectFormValidationBlocked(page, /Registrar estudiante/i);

      await fillEstudianteMinimo(page, { nombres, apellidos, dni, anioEscolar: anioInst });
      await submitEstudianteNuevo(page);
      await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeHidden({
        timeout: 25_000,
      });

      const fila = page.locator('table tbody tr').filter({ hasText: dni }).first();
      await expect(fila).toBeVisible({ timeout: 20_000 });
      await fila.locator('button[title="Editar"]').click();
      await page.getByPlaceholder('Apellidos').fill(`${apellidos} Edit`);
      await page.getByRole('button', { name: /Guardar cambios/i }).click();
      await expect(
        page.getByPlaceholder('Ej: Corrección de domicilio solicitada por apoderado'),
      ).toBeVisible({ timeout: 10_000 });
      await page.getByRole('button', { name: /Guardar cambios/i }).click();
      await expectFormErrorVisible(page, /motivo de la actualización/i);
      await page
        .getByPlaceholder('Ej: Corrección de domicilio solicitada por apoderado')
        .fill('Edición secretaría Bolognesi');
      await page.getByRole('button', { name: /Guardar cambios/i }).click();
      await expect(page.locator('h3', { hasText: 'Editar Estudiante' })).toBeHidden({
        timeout: 25_000,
      });

      await gotoAppRoute(page, '/estudiantes/expedientes');
      await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(dni);
      const filaBuscada = page.locator('table tbody tr').filter({ hasText: dni }).first();
      await expect(filaBuscada).toBeVisible({ timeout: 20_000 });
      const deleteRes = page.waitForResponse(
        (res) => res.url().includes('/students/') && res.request().method() === 'DELETE',
      );
      await filaBuscada.locator('button[title="Eliminar"]').click();
      expect((await deleteRes).status()).toBe(403);
      await expect(filaBuscada).toBeVisible();
    } finally {
      await eliminarAlumnoComoSiagie(request, dni);
    }
  });

  test('documentos — modal de carga exige motivo', async ({ page, request }) => {
    const anioInst = await anioBolognesi(request);
    const dni = `${String(Date.now() + 11).slice(-8)}`;
    const nombres = `Doc${uniqueLetras(3)}`;
    const apellidos = `Sec${uniqueLetras(4)}`;

    try {
      await gotoAppRoute(page, '/estudiantes/expedientes');
      await page.getByRole('button', { name: /Nuevo Estudiante/i }).click();
      await fillEstudianteMinimo(page, { nombres, apellidos, dni, anioEscolar: anioInst });
      await submitEstudianteNuevo(page);
      await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeHidden({
        timeout: 25_000,
      });

      const padronLoad = page.waitForResponse(
        (res) =>
          res.url().includes('/students') &&
          res.request().method() === 'GET' &&
          res.ok(),
        { timeout: 35_000 },
      );
      await gotoAppRoute(page, '/estudiantes/documentos');
      await padronLoad;
      await page.getByPlaceholder('Nombre, DNI, código o email').fill(dni);
      const filaAlumno = page.locator('.max-h-\\[520px\\] button').filter({ hasText: dni }).first();
      await expect(filaAlumno).toBeVisible({ timeout: 25_000 });
      await filaAlumno.click();

      const filaFut = page.locator('.divide-y > div').filter({ hasText: 'Ficha de Matrícula' });
      let fileInput = filaFut.locator('input[type="file"]');
      if (!(await fileInput.count())) {
        await page.getByRole('button', { name: /Completar requisitos de matrícula/i }).click();
      }
      fileInput = filaFut.locator('input[type="file"]');
      await setFilesAndEmitChange(fileInput, E2E_UPLOAD_PDF);
      const modalCarga = page.getByRole('dialog');
      await expect(modalCarga.getByRole('button', { name: /Subir documento/i })).toBeDisabled();
      await modalCarga.locator('textarea').fill('Documento secretaría Bolognesi');
      await expect(modalCarga.getByRole('button', { name: /Subir documento/i })).toBeEnabled();
      const uploadReq = page.waitForResponse(
        (res) =>
          res.url().includes('/documents/') &&
          res.url().includes('/upload') &&
          res.request().method() === 'POST',
      );
      await modalCarga.getByRole('button', { name: /Subir documento/i }).click();
      expect((await uploadReq).ok()).toBeTruthy();
    } finally {
      await eliminarAlumnoComoSiagie(request, dni);
    }
  });

  test('vínculos — búsqueda vacía y asociación incompleta', async ({ page }) => {
    await gotoAppRoute(page, '/estudiantes/representante-vinculos');
    await expect(page.locator('h2', { hasText: 'Vínculos representante' })).toBeVisible();
    const btnBuscar = page.getByRole('button', { name: /Buscar/i });
    await btnBuscar.click();
    await expect(page.getByText('Ingrese el número de documento')).toBeVisible();

    await page.getByPlaceholder('Ej: 12345678').fill(`${String(Date.now()).slice(-8)}`);
    await btnBuscar.click();
    await expect(page.getByText('2. Datos del representante')).toBeVisible({ timeout: 20_000 });
    await expectFormValidationBlocked(page, /Asociar seleccionados/i);
  });

  test('crea, edita, audita, documenta y vincula sin poder eliminar', async ({ page, request }) => {
    const anioInst = await anioBolognesi(request);
    const dniAlu = `${String(Date.now() + 3).slice(-8)}`;
    const nombres = `Fb${uniqueLetras(3)}`;
    const apellidos = `Sec${uniqueLetras(4)}`;
    const apellidosEdit = `${apellidos} Edit`;
    const dniRep = `${String(Date.now() + 41).slice(-8)}`;

    try {
      await gotoAppRoute(page, '/estudiantes/expedientes');
      await page.getByRole('button', { name: /Nuevo Estudiante/i }).click();
      await expectFormValidationBlocked(page, /Registrar estudiante/i);
      await fillEstudianteMinimo(page, { nombres, apellidos, dni: dniAlu, anioEscolar: anioInst });
      await submitEstudianteNuevo(page);
      await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeHidden({
        timeout: 25_000,
      });

      const fila = page.locator('table tbody tr').filter({ hasText: dniAlu }).first();
      await expect(fila).toBeVisible({ timeout: 20_000 });
      await fila.locator('button[title="Editar"]').click();
      await page.getByPlaceholder('Apellidos').fill(apellidosEdit);
      await page.getByRole('button', { name: /Guardar cambios/i }).click();
      await page
        .getByPlaceholder('Ej: Corrección de domicilio solicitada por apoderado')
        .fill('Auditoría secretaría Francisco Bolognesi');
      await page.getByRole('button', { name: /Guardar cambios/i }).click();
      await expect(page.locator('h3', { hasText: 'Editar Estudiante' })).toBeHidden({
        timeout: 25_000,
      });

      await waitForAuditFlush(page);
      await expectEstudianteAuditoriaContains(page, 'Auditoría secretaría Francisco Bolognesi');

      const padronLoad = page.waitForResponse(
        (res) =>
          res.url().includes('/students') &&
          res.request().method() === 'GET' &&
          res.ok(),
        { timeout: 35_000 },
      );
      await gotoAppRoute(page, '/estudiantes/documentos');
      await padronLoad;
      await page.getByPlaceholder('Nombre, DNI, código o email').fill(dniAlu);
      await page.locator('.max-h-\\[520px\\] button').filter({ hasText: dniAlu }).first().click();
      const filaFut = page.locator('.divide-y > div').filter({ hasText: 'Ficha de Matrícula' });
      let fileInput = filaFut.locator('input[type="file"]');
      if (!(await fileInput.count())) {
        await page.getByRole('button', { name: /Completar requisitos de matrícula/i }).click();
      }
      fileInput = filaFut.locator('input[type="file"]');
      await setFilesAndEmitChange(fileInput, E2E_UPLOAD_PDF);
      const modalCarga = page.getByRole('dialog');
      await expect(modalCarga.getByRole('button', { name: /Subir documento/i })).toBeDisabled();
      await modalCarga.locator('textarea').fill('FUT secretaría Bolognesi');
      const uploadReq = page.waitForResponse(
        (res) =>
          res.url().includes('/documents/') &&
          res.url().includes('/upload') &&
          res.request().method() === 'POST',
      );
      await modalCarga.getByRole('button', { name: /Subir documento/i }).click();
      expect((await uploadReq).ok()).toBeTruthy();

      const padronVinculos = page.waitForResponse(
        (res) =>
          res.url().includes('/students') &&
          res.request().method() === 'GET' &&
          res.ok(),
        { timeout: 35_000 },
      );
      await gotoAppRoute(page, '/estudiantes/representante-vinculos');
      await padronVinculos;
      await page.getByPlaceholder('Ej: 12345678').fill(dniRep);
      await page.getByRole('button', { name: /Buscar/i }).click();
      const cardRep = page.locator('.card').filter({
        has: page.locator('h3', { hasText: '2. Datos del representante' }),
      });
      await expect(cardRep).toBeVisible({ timeout: 20_000 });
      await cardRep.locator('input.form-input').first().fill(`Rep${uniqueLetras(3)}`);
      await cardRep.locator('input.form-input').nth(1).fill(`Apo${uniqueLetras(3)}`);
      await cardRep.locator('input[type="email"]').fill(`rep.${uniqueSuffix()}@e2e.test`);
      await page.getByPlaceholder('Filtrar estudiantes por nombre, código o DNI...').fill(nombres);
      const filaEst = page.locator('label').filter({ hasText: nombres }).first();
      await expect(filaEst).toBeVisible({ timeout: 20_000 });
      await filaEst.locator('input[type="checkbox"]').check();
      await page.getByPlaceholder('Motivo de la asociación').fill('Vínculo secretaría Bolognesi');
      await expect(page.getByRole('button', { name: /Asociar seleccionados \(1\)/i })).toBeEnabled();
      const linkPost = page.waitForResponse(
        (res) =>
          res.url().includes('/representative-links/associate') &&
          res.request().method() === 'POST',
      );
      await page.getByRole('button', { name: /Asociar seleccionados/i }).click();
      expect((await linkPost).ok()).toBeTruthy();
      await expect(page.locator('table tbody').getByText(nombres)).toBeVisible({ timeout: 20_000 });
    } finally {
      await eliminarAlumnoComoSiagie(request, dniAlu);
    }
  });
});
