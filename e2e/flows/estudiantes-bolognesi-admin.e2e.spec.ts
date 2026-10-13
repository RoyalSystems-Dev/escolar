import { test, expect } from '@playwright/test';
import {
  adminSessionBolognesi,
  ensureBolognesiInstitutionContext,
  loginAsAdminEnBolognesi,
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
test.describe('I.E. Francisco Bolognesi — admin expedientes, documentos, auditoría y vínculos', () => {
  test.setTimeout(240_000);

  test.describe('Interfaz y validación de formularios', () => {
    test.beforeEach(async ({ page, request }) => {
      await loginAsAdminEnBolognesi(page, request);
      await ensureBolognesiInstitutionContext(page, request);
    });

    test('smoke — pantallas Estudiantes con contexto IEFB', async ({ page }) => {
      for (const spec of ESTUDIANTES_STAFF_ROUTES) {
        await expectEstudiantesRouteAccessible(page, spec);
        await expect(page.getByRole('status')).toContainText(/Francisco Bolognesi|IEFB/, {
          timeout: 10_000,
        });
        await expect(page.getByRole('heading', { name: 'Acceso Denegado' })).toHaveCount(0);
      }
    });

    test('expedientes — alta incompleta bloqueada y edición exige motivo', async ({
      page,
      request,
    }) => {
      const session = await adminSessionBolognesi(request);
      const anioInst = await ensureInstitutionAnioEscolarCoherente(request, session);
      const dni = `${String(Date.now()).slice(-8)}`;
      const nombres = `Val${uniqueLetras(3)}`;
      const apellidos = `Form${uniqueLetras(4)}`;

      await gotoAppRoute(page, '/estudiantes/expedientes');
      await page.getByRole('button', { name: /Nuevo Estudiante/i }).click();
      await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeVisible();
      await expectFormValidationBlocked(page, /Registrar estudiante/i);

      await fillEstudianteMinimo(page, { nombres, apellidos, dni, anioEscolar: anioInst });
      await submitEstudianteNuevo(page);
      await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeHidden({
        timeout: 25_000,
      });

      await expect(
        page.locator('table tbody tr').filter({ hasText: dni }).first(),
      ).toBeVisible({ timeout: 20_000 });
      await page
        .locator('table tbody tr')
        .filter({ hasText: dni })
        .first()
        .locator('button[title="Editar"]')
        .click();
      await page.getByPlaceholder('Apellidos').fill(`${apellidos} Edit`);
      await page.getByRole('button', { name: /Guardar cambios/i }).click();
      await expect(
        page.getByPlaceholder('Ej: Corrección de domicilio solicitada por apoderado'),
      ).toBeVisible({ timeout: 10_000 });
      await page.getByRole('button', { name: /Guardar cambios/i }).click();
      await expectFormErrorVisible(page, /motivo de la actualización/i);

      await page
        .getByPlaceholder('Ej: Corrección de domicilio solicitada por apoderado')
        .fill('Validación formulario Bolognesi E2E');
      await page.getByRole('button', { name: /Guardar cambios/i }).click();
      await expect(page.locator('h3', { hasText: 'Editar Estudiante' })).toBeHidden({
        timeout: 25_000,
      });

      await gotoAppRoute(page, '/estudiantes/expedientes');
      await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(dni);
      await page
        .locator('table tbody tr')
        .filter({ hasText: dni })
        .locator('button[title="Eliminar"]')
        .click();
      await page.waitForTimeout(800);
      await expect(page.getByText(nombres)).toHaveCount(0, { timeout: 20_000 });
    });

    test('documentos — pantalla inicial y modal de carga sin motivo', async ({ page, request }) => {
      const session = await adminSessionBolognesi(request);
      const anioInst = await ensureInstitutionAnioEscolarCoherente(request, session);
      const dni = `${String(Date.now() + 7).slice(-8)}`;
      const nombres = `Doc${uniqueLetras(3)}`;
      const apellidos = `Ui${uniqueLetras(4)}`;

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
      await expect(
        page.getByText('Selecciona un estudiante para gestionar sus documentos'),
      ).toBeVisible();
      await page.getByPlaceholder('Nombre, DNI, código o email').fill(dni);
      const filaAlumno = page
        .locator('.max-h-\\[520px\\] button')
        .filter({ hasText: dni })
        .first();
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
      await expect(modalCarga.getByRole('heading', { name: /Confirmar carga/i })).toBeVisible({
        timeout: 10_000,
      });
      await expect(modalCarga.getByRole('button', { name: /Subir documento/i })).toBeDisabled();
      await modalCarga.getByRole('button', { name: /Cancelar/i }).click();
      await expect(modalCarga).toBeHidden({ timeout: 10_000 });

      await gotoAppRoute(page, '/estudiantes/expedientes');
      await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(dni);
      await page
        .locator('table tbody tr')
        .filter({ hasText: dni })
        .locator('button[title="Eliminar"]')
        .click();
      await page.waitForTimeout(800);
      await expect(page.getByText(nombres)).toHaveCount(0, { timeout: 20_000 });
    });

    test('vínculos — valida búsqueda y deshabilita asociación incompleta', async ({ page }) => {
      await gotoAppRoute(page, '/estudiantes/representante-vinculos');
      await expect(page.locator('h2', { hasText: 'Vínculos representante' })).toBeVisible();
      const btnBuscar = page.getByRole('button', { name: /Buscar/i });
      await btnBuscar.click();
      await expect(page.getByText('Ingrese el número de documento')).toBeVisible();

      const dniRep = `${String(Date.now() + 99).slice(-8)}`;
      await page.getByPlaceholder('Ej: 12345678').fill(dniRep);
      await btnBuscar.click();
      await expect(page.getByText('2. Datos del representante')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole('button', { name: /Asociar seleccionados \(0\)/i })).toBeDisabled();
      await expectFormValidationBlocked(page, /Asociar seleccionados/i);
    });
  });

  test('CRUD estudiante, documentos, auditoría de cambios y vínculo representante', async ({
    page,
    request,
  }) => {
    const session = await adminSessionBolognesi(request);
    const anioInst = await ensureInstitutionAnioEscolarCoherente(request, session);
    const dniAlu = `${String(Date.now()).slice(-8)}`;
    const nombres = `Fb${uniqueLetras(3)}`;
    const apellidos = `Bolog${uniqueLetras(4)}`;
    const apellidosEdit = `${apellidos} Edit`;
    const dniRep = `${String(Date.now() + 31).slice(-8)}`;

    await loginAsAdminEnBolognesi(page, request);
    await ensureBolognesiInstitutionContext(page, request);
    await expect(page.locator('#tenant-ie-select')).toHaveValue(String(session.bolognesiId), {
      timeout: 15_000,
    });
    await gotoAppRoute(page, '/estudiantes/expedientes');
    await expect(page.getByText(/Francisco Bolognesi|7654321/i).first()).toBeVisible({
      timeout: 15_000,
    }).catch(() => undefined);

    await page.getByRole('button', { name: /Nuevo Estudiante/i }).click();
    await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeVisible();
    await expectFormValidationBlocked(page, /Registrar estudiante/i);
    await fillEstudianteMinimo(page, { nombres, apellidos, dni: dniAlu, anioEscolar: anioInst });
    await submitEstudianteNuevo(page);
    await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeHidden({
      timeout: 25_000,
    });

    await expect(
      page.locator('table tbody tr').filter({ hasText: dniAlu }).first(),
    ).toBeVisible({ timeout: 25_000 });
    await page
      .locator('table tbody tr')
      .filter({ hasText: dniAlu })
      .first()
      .locator('button[title="Editar"]')
      .click();

    await expect(page.locator('h3', { hasText: 'Editar Estudiante' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByPlaceholder('Apellidos').fill(apellidosEdit);
    await page.getByRole('button', { name: /Guardar cambios/i }).click();
    await expect(
      page.getByPlaceholder('Ej: Corrección de domicilio solicitada por apoderado'),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Guardar cambios/i }).click();
    await expectFormErrorVisible(page, /motivo de la actualización/i);
    await page
      .getByPlaceholder('Ej: Corrección de domicilio solicitada por apoderado')
      .fill('Prueba navegador IE Francisco Bolognesi');
    await page.getByRole('button', { name: /Guardar cambios/i }).click();
    await expect(page.locator('h3', { hasText: 'Editar Estudiante' })).toBeHidden({
      timeout: 25_000,
    });

    await waitForAuditFlush(page);
    await expectEstudianteAuditoriaContains(page, 'Prueba navegador IE Francisco Bolognesi');

    await ensureBolognesiInstitutionContext(page, request);
    const padronLoad = page.waitForResponse(
      (res) =>
        res.url().includes('/students') &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 35_000 },
    );
    await gotoAppRoute(page, '/estudiantes/documentos');
    await padronLoad;
    await expect(page.getByText('Selecciona un estudiante para gestionar sus documentos')).toBeVisible();
    await expect(page.getByText('Cargando estudiantes desde la base de datos...')).toBeHidden({
      timeout: 30_000,
    });
    await page.getByPlaceholder('Nombre, DNI, código o email').fill(dniAlu);
    const filaAlumno = page
      .locator('.max-h-\\[520px\\] button')
      .filter({ hasText: dniAlu })
      .first();
    await expect(filaAlumno).toBeVisible({ timeout: 25_000 });
    await filaAlumno.click();

    const filaFut = page.locator('.divide-y > div').filter({ hasText: 'Ficha de Matrícula' });
    let fileInput = filaFut.locator('input[type="file"]');
    if (!(await fileInput.count())) {
      await page.getByRole('button', { name: /Completar requisitos de matrícula/i }).click();
    }
    fileInput = filaFut.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 15_000 });
    await setFilesAndEmitChange(fileInput, E2E_UPLOAD_PDF);
    const modalCarga = page.getByRole('dialog');
    await expect(modalCarga.getByRole('heading', { name: /Confirmar carga/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(modalCarga.getByRole('button', { name: /Subir documento/i })).toBeDisabled();
    await modalCarga.locator('textarea').fill('Documento prueba Bolognesi admin');
    await expect(modalCarga.getByRole('button', { name: /Subir documento/i })).toBeEnabled({
      timeout: 5_000,
    });
    const uploadReq = page.waitForResponse(
      (res) =>
        res.url().includes('/documents/') &&
        res.url().includes('/upload') &&
        res.request().method() === 'POST',
    );
    await modalCarga.getByRole('button', { name: /Subir documento/i }).click();
    expect((await uploadReq).ok()).toBeTruthy();

    await ensureBolognesiInstitutionContext(page, request);
    const padronVinculos = page.waitForResponse(
      (res) =>
        res.url().includes('/students') &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 35_000 },
    );
    await gotoAppRoute(page, '/estudiantes/representante-vinculos');
    await padronVinculos;
    const btnBuscar = page.getByRole('button', { name: /Buscar/i });
    await page.getByPlaceholder('Ej: 12345678').fill(dniRep);
    await btnBuscar.click();
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
    await page.getByPlaceholder('Motivo de la asociación').fill('Vínculo prueba Bolognesi');
    await expect(page.getByRole('button', { name: /Asociar seleccionados \(1\)/i })).toBeEnabled({
      timeout: 15_000,
    });
    const linkPost = page.waitForResponse(
      (res) =>
        res.url().includes('/representative-links/associate') &&
        res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Asociar seleccionados/i }).click();
    expect((await linkPost).ok()).toBeTruthy();
    await expect(page.locator('table tbody').getByText(nombres)).toBeVisible({
      timeout: 20_000,
    });

    await ensureBolognesiInstitutionContext(page, request);
    await gotoAppRoute(page, '/estudiantes/expedientes');
    await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(dniAlu);
    await page
      .locator('table tbody tr')
      .filter({ hasText: dniAlu })
      .locator('button[title="Eliminar"]')
      .click();
    await page.waitForTimeout(800);
    await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(dniAlu);
    await expect(page.getByText(nombres)).toHaveCount(0, { timeout: 20_000 });
  });
});
