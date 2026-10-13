import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsEstudiante } from '../helpers/auth.helper';
import {
  abrirDrawerRegistrarIncidente,
  guardarIncidente,
  incidenteDrawer,
  seleccionarAlumnoIncidente,
} from '../helpers/conducta-form.helper';
import {
  expectEstudianteAuditoriaContains,
  expectFormValidationBlocked,
  uniqueLetras,
  uniqueSuffix,
  waitForAuditFlush,
} from '../helpers/crud-audit.helper';
import {
  ESTUDIANTES_STAFF_ROUTES,
  expectEstudiantesRouteAccessible,
  PORTAL_ESTUDIANTE_ROUTES,
} from '../helpers/estudiantes-nav.helper';
import { fillEstudianteMinimo, submitEstudianteNuevo } from '../helpers/estudiante-form.helper';
import { E2E_UPLOAD_PDF, setFilesAndEmitChange } from '../helpers/files.helper';
import {
  ensureInstitutionAnioEscolarCoherente,
  resolveAnioEscolarInstitucion,
} from '../helpers/maestros-setup.helper';
import { gotoAppRoute } from '../helpers/routing.helper';
import { loginApi } from '../helpers/tenant.helper';

test.describe('Estudiantes — staff, procesos, auditoría y portal', () => {
  test.describe('Navegación staff', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('smoke — rutas del módulo Estudiantes', async ({ page }) => {
      for (const spec of ESTUDIANTES_STAFF_ROUTES) {
        await expectEstudiantesRouteAccessible(page, spec);
      }
    });
  });

  test.describe('Operaciones y validación (admin)', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test.describe('Expedientes — alta, edición con motivo, baja y auditoría', () => {
      test('valida formulario, crea, edita, elimina y registra auditoría', async ({ page, request }) => {
        const admin = await loginApi(request, 'admin');
        const anioInst = await resolveAnioEscolarInstitucion(request, admin);
        const dni = `${String(Date.now()).slice(-8)}`;
        const nombres = `Lucia${uniqueLetras(3)}`;
        const apellidos = `Prueba${uniqueLetras(4)}`;
        const apellidosEdit = `${apellidos} Mod`;

        await gotoAppRoute(page, '/estudiantes/expedientes');
        await page.getByRole('button', { name: /Nuevo Estudiante/i }).click();
        await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeVisible();
        await expectFormValidationBlocked(page, /Registrar estudiante/i);

        await fillEstudianteMinimo(page, { nombres, apellidos, dni, anioEscolar: anioInst });
        await submitEstudianteNuevo(page);
        await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeHidden({
          timeout: 20_000,
        });

        await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(dni);
        await expect(page.getByText(nombres).first()).toBeVisible({ timeout: 15_000 });

        await page.locator('table tbody tr').filter({ hasText: dni }).getByRole('button', { name: 'edit' }).click();
        await expect(page.locator('h3', { hasText: 'Editar Estudiante' })).toBeVisible();
        await page.getByPlaceholder('Apellidos').fill(apellidosEdit);
        await page.getByRole('button', { name: /Guardar cambios/i }).click();
        await expect(
          page.getByPlaceholder('Ej: Corrección de domicilio solicitada por apoderado'),
        ).toBeVisible();
        await page
          .getByPlaceholder('Ej: Corrección de domicilio solicitada por apoderado')
          .fill('Actualización E2E módulo estudiantes');
        await page.getByRole('button', { name: /Guardar cambios/i }).click();
        await expect(page.locator('h3', { hasText: 'Editar Estudiante' })).toBeHidden({
          timeout: 20_000,
        });

        await waitForAuditFlush(page);
        await expectEstudianteAuditoriaContains(page, 'Actualización E2E');

        await gotoAppRoute(page, '/estudiantes/expedientes');
        await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(dni);
        await page
          .locator('table tbody tr')
          .filter({ hasText: dni })
          .getByRole('button', { name: 'delete_outline' })
          .click();
        await page.waitForTimeout(800);
        await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(dni);
        await expect(page.getByText(nombres)).toHaveCount(0, { timeout: 15_000 });
      });
    });

    test.describe('Conducta — incidentes', () => {
      test('valida drawer, registra, actualiza estado y elimina incidente', async ({ page, request }) => {
        test.setTimeout(120_000);
        const admin = await loginApi(request, 'admin');
        const anioInst = await ensureInstitutionAnioEscolarCoherente(request, admin);
        const dni = `${String(Date.now()).slice(-8)}`;
        const nombres = `Con${uniqueLetras(3)}`;
        const apellidos = `Inc${uniqueLetras(4)}`;
        const descripcion = `Incidente E2E ${uniqueSuffix()}`;

        await gotoAppRoute(page, '/estudiantes/expedientes');
        await page.getByRole('button', { name: /Nuevo Estudiante/i }).click();
        await fillEstudianteMinimo(page, { nombres, apellidos, dni, anioEscolar: anioInst });
        await submitEstudianteNuevo(page);
        await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeHidden({
          timeout: 20_000,
        });
        await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(dni);
        await expect(page.getByText(nombres).first()).toBeVisible({ timeout: 15_000 });

        await gotoAppRoute(page, '/estudiantes/conducta');
        await expect(page.locator('h2', { hasText: 'Control de Conducta' })).toBeVisible();

        await abrirDrawerRegistrarIncidente(page);
        const drawer = incidenteDrawer(page);
        await expect(drawer.locator('.border-t').getByRole('button', { name: /Guardar/i })).toBeDisabled();
        await seleccionarAlumnoIncidente(page, apellidos);
        await guardarIncidente(page, descripcion);

        await page.getByPlaceholder('Buscar alumno...').fill(nombres);
        await expect(page.locator('table tbody').getByText(descripcion)).toBeVisible({
          timeout: 15_000,
        });

        await page.locator('table tbody tr').filter({ hasText: descripcion }).getByTitle('Ver detalle').click();
        const patch = page.waitForResponse(
          (res) =>
            res.url().includes('/conduct-incidents/') && res.request().method() === 'PATCH',
        );
        await page.getByRole('button', { name: 'Resuelto' }).click();
        expect((await patch).ok()).toBeTruthy();
        await expect(page.getByText('Estado actualizado.')).toBeVisible({ timeout: 15_000 });
        await expect(
          page.locator('table tbody tr').filter({ hasText: descripcion }).getByText('Resuelto'),
        ).toBeVisible({ timeout: 15_000 });
        await page.locator('.fixed.inset-y-0.right-0').getByRole('button', { name: 'close' }).click();

        await page.locator('table tbody tr').filter({ hasText: descripcion }).getByTitle('Eliminar').click();
        await expect(page.getByText(descripcion)).toHaveCount(0, { timeout: 15_000 });

        await gotoAppRoute(page, '/estudiantes/expedientes');
        await page.getByPlaceholder('Buscar por nombre, DNI o codigo...').fill(dni);
        await page
          .locator('table tbody tr')
          .filter({ hasText: dni })
          .getByRole('button', { name: 'delete_outline' })
          .click();
      });
    });

    test.describe('Documentos', () => {
      test('exige selección de estudiante y permite marcar entrega', async ({ page, request }) => {
        test.setTimeout(120_000);
        const admin = await loginApi(request, 'admin');
        const anioInst = await ensureInstitutionAnioEscolarCoherente(request, admin);
        const dni = `${String(Date.now()).slice(-8)}`;
        const nombres = `Doc${uniqueLetras(3)}`;
        const apellidos = `Alu${uniqueLetras(4)}`;

        await gotoAppRoute(page, '/estudiantes/expedientes');
        await page.getByRole('button', { name: /Nuevo Estudiante/i }).click();
        await fillEstudianteMinimo(page, { nombres, apellidos, dni, anioEscolar: anioInst });
        await submitEstudianteNuevo(page);
        await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeHidden({
          timeout: 20_000,
        });

        await gotoAppRoute(page, '/estudiantes/documentos');
        await expect(page.getByText('Selecciona un estudiante para gestionar sus documentos')).toBeVisible();
        await expect(page.getByText('Cargando estudiantes desde la base de datos...')).toBeHidden({
          timeout: 30_000,
        });

        await page.getByPlaceholder('Nombre, DNI, código o email').fill(dni);
        const filaAlumno = page
          .locator('.max-h-\\[520px\\] button')
          .filter({ hasText: apellidos })
          .first();
        await expect(filaAlumno).toBeVisible({ timeout: 20_000 });
        await filaAlumno.click();
        await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: apellidos })).toBeVisible({
          timeout: 20_000,
        });

        await expect(page.getByText(/Requisitos para/i)).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText('Cargando documentos desde la base de datos...')).toBeHidden({
          timeout: 20_000,
        });
        const filaFut = page.locator('.divide-y > div').filter({ hasText: 'Ficha de Matrícula' });
        let fileInput = filaFut.locator('input[type="file"]');
        if (!(await fileInput.isVisible())) {
          await page.getByRole('button', { name: /Completar requisitos de matrícula/i }).click();
          await expect(fileInput).toBeAttached({ timeout: 20_000 });
        }
        if (await fileInput.count()) {
          await setFilesAndEmitChange(fileInput, E2E_UPLOAD_PDF);
          const modalCarga = page.getByRole('dialog');
          await expect(modalCarga.getByRole('heading', { name: /Confirmar carga/i })).toBeVisible({
            timeout: 10_000,
          });
          await expect(modalCarga.getByRole('button', { name: /Subir documento/i })).toBeDisabled();
          await modalCarga.locator('textarea').fill('Entrega E2E documento sustentatorio');
          const uploadReq = page.waitForResponse(
            (res) =>
              res.url().includes('/documents/') &&
              res.url().includes('/upload') &&
              res.request().method() === 'POST',
          );
          await modalCarga.getByRole('button', { name: /Subir documento/i }).click();
          expect((await uploadReq).ok()).toBeTruthy();
          await expect(modalCarga).toBeHidden({ timeout: 20_000 });
          await expect(page.getByText(/Ficha de Matrícula \(FUT\).*cargado correctamente/i)).toBeVisible({
            timeout: 15_000,
          });
        }

        const checkbox = page.locator('input[type="checkbox"]').first();
        if (await checkbox.isVisible()) {
          const wasChecked = await checkbox.isChecked();
          await checkbox.click();
          await page.waitForTimeout(600);
          await expect(checkbox).toBeChecked({ checked: !wasChecked });
          await checkbox.click();
        }
      });
    });

    test.describe('Vínculos representante', () => {
      test('valida búsqueda, asocia, audita y cesa vínculo', async ({ page, request }) => {
        test.setTimeout(120_000);
        const admin = await loginApi(request, 'admin');
        const anioInst = await ensureInstitutionAnioEscolarCoherente(request, admin);
        const dniAlu = `${String(Date.now()).slice(-8)}`;
        const nombres = `Vin${uniqueLetras(3)}`;
        const apellidos = `Alu${uniqueLetras(4)}`;
        const dniRep = `${String(Date.now() + 17).slice(-8)}`;

        await gotoAppRoute(page, '/estudiantes/expedientes');
        await page.getByRole('button', { name: /Nuevo Estudiante/i }).click();
        await fillEstudianteMinimo(page, { nombres, apellidos, dni: dniAlu, anioEscolar: anioInst });
        await submitEstudianteNuevo(page);
        await expect(page.locator('h3', { hasText: 'Nuevo Estudiante' })).toBeHidden({
          timeout: 20_000,
        });

        await gotoAppRoute(page, '/estudiantes/representante-vinculos');
        await expect(page.locator('h2', { hasText: 'Vínculos representante' })).toBeVisible();
        const btnBuscar = page.getByRole('button', { name: /Buscar/i });
        await btnBuscar.click();
        await expect(page.getByText('Ingrese el número de documento')).toBeVisible();

        await page.getByPlaceholder('Ej: 12345678').fill(dniRep);
        await btnBuscar.click();
        await expect(page.getByText('2. Datos del representante')).toBeVisible({ timeout: 15_000 });

        const cardRep = page.locator('.card').filter({
          has: page.locator('h3', { hasText: '2. Datos del representante' }),
        });
        await cardRep.locator('input.form-input').first().fill(`Carlos${uniqueLetras(3)}`);
        await cardRep.locator('input.form-input').nth(1).fill(`Perez${uniqueLetras(3)}`);
        await cardRep.locator('input[type="email"]').fill(`rep.${uniqueSuffix()}@e2e.test`);
        await page.getByPlaceholder('Filtrar estudiantes por nombre, código o DNI...').fill(apellidos);
        const filaEst = page.locator('label').filter({ hasText: nombres }).first();
        await expect(filaEst).toBeVisible({ timeout: 20_000 });
        await filaEst.locator('input[type="checkbox"]').check();
        await page.getByPlaceholder('Motivo de la asociación').fill('Vínculo creado en prueba E2E');
        await expect(page.getByRole('button', { name: /Asociar seleccionados/i })).toBeEnabled();
        const linkPost = page.waitForResponse(
          (res) =>
            res.url().includes('/representative-links/associate') && res.request().method() === 'POST',
        );
        await page.getByRole('button', { name: /Asociar seleccionados/i }).click();
        const linkRes = await linkPost;
        expect(
          linkRes.ok(),
          `asociar vínculo → HTTP ${linkRes.status()} ${await linkRes.text().catch(() => '')}`,
        ).toBeTruthy();
        await expect(page.locator('table tbody').getByText(apellidos)).toBeVisible({
          timeout: 15_000,
        });
        await expect(page.getByText('Creación de vínculo').first()).toBeVisible({ timeout: 15_000 });

        const filaVinculo = page.locator('table tbody tr').filter({ hasText: apellidos });
        await filaVinculo.getByRole('button', { name: 'Editar' }).click();
        await expect(page.getByRole('dialog').getByText('Editar vínculo')).toBeVisible();
        await page.getByRole('dialog').locator('select.form-select').selectOption('padre');
        await page.getByRole('dialog').locator('textarea').fill('Cambio E2E de tipo de vínculo');
        const patchLink = page.waitForResponse(
          (res) =>
            res.url().includes('/representative-links/') &&
            res.request().method() === 'PATCH' &&
            !res.url().includes('/associate'),
        );
        await page.getByRole('dialog').getByRole('button', { name: /Guardar cambios/i }).click();
        expect((await patchLink).ok()).toBeTruthy();
        await expect(page.getByRole('dialog').getByText('Editar vínculo')).toBeHidden({
          timeout: 15_000,
        });
        await expect(page.getByText('Actualización').first()).toBeVisible({ timeout: 15_000 });

        await filaVinculo.getByRole('button', { name: 'Cesar' }).click();
        const ceseReq = page.waitForResponse(
          (res) =>
            res.url().includes('/representative-links/') &&
            res.request().method() === 'POST' &&
            res.url().includes('/cessation'),
        );
        await page.locator('textarea.form-input').fill('Cese por prueba E2E automatizada');
        await page.getByRole('button', { name: 'Confirmar cese' }).click();
        expect((await ceseReq).ok()).toBeTruthy();
        await expect(page.getByText('Sin vínculos activos para este representante.')).toBeVisible({
          timeout: 15_000,
        });
        await expect(page.getByText('Cese de vínculo').first()).toBeVisible({ timeout: 15_000 });
      });
    });

    test.describe('Auditoría — pantalla', () => {
      test('historial de cambios carga filtros y pestaña de notificaciones', async ({ page }) => {
        await gotoAppRoute(page, '/estudiantes/auditoria-cambios');
        await expect(
          page.locator('h2', { hasText: 'Privacidad y auditoría — Estudiantes' }),
        ).toBeVisible();
        await expect(page.getByPlaceholder('Estudiante, código, motivo...')).toBeVisible();
        await page.getByRole('button', { name: 'Notificaciones sensibles' }).click();
        await expect(page.getByText(/Notificaciones sensibles|Sin notificaciones/i).first()).toBeVisible({
          timeout: 20_000,
        });
      });
    });

    test.describe('Matrícula — procesos sobre estudiantes', () => {
      test('retiro no registra sin estudiante', async ({ page }) => {
        await gotoAppRoute(page, '/matricula/retiro');
        await expect(page.locator('h2', { hasText: 'Registrar retiro del estudiante' })).toBeVisible();
        await page.getByRole('button', { name: /Registrar retiro/i }).click();
        await expect(page.getByText(/Registrado correctamente|retiro registrado/i)).toHaveCount(0);
      });

      test('reingreso exige datos obligatorios', async ({ page }) => {
        await gotoAppRoute(page, '/matricula/reingreso');
        await expect(page.locator('h2', { hasText: 'Registrar reingreso del estudiante' })).toBeVisible();
        await expectFormValidationBlocked(page, /Registrar reingreso/i);
      });

      test('evaluaciones exigen datos obligatorios', async ({ page }) => {
        await gotoAppRoute(page, '/matricula/evaluaciones');
        await expect(page.locator('h2', { hasText: 'Evaluaciones de matrícula' })).toBeVisible();
        await expectFormValidationBlocked(page, /Registrar evaluación/i);
      });
    });
  });

  test.describe('Portal estudiante — navegación', () => {
    test.use({
      storageState: { cookies: [], origins: [] },
      viewport: { width: 390, height: 844 },
    });

    test.beforeEach(async ({ page }) => {
      await loginAsEstudiante(page);
    });

    test('barra inferior y rutas principales cargan', async ({ page }) => {
      await expect(
        page.locator('nav[aria-label="Navegación principal del portal estudiante"]'),
      ).toBeVisible();
      for (const spec of PORTAL_ESTUDIANTE_ROUTES) {
        await expectEstudiantesRouteAccessible(page, spec);
      }
    });

    test('mi ficha muestra datos del alumno demo', async ({ page }) => {
      await gotoAppRoute(page, '/portal-estudiante/perfil');
      await expect(page.locator('h2', { hasText: 'Mi ficha' })).toBeVisible();
      await expect(page.locator('.card').filter({ hasText: /Código|DNI/i }).first()).toBeVisible({
        timeout: 20_000,
      });
    });

    test('tareas — valida entrega y sube archivo si hay tarea pendiente', async ({ page }) => {
      test.setTimeout(120_000);
      await gotoAppRoute(page, '/portal-estudiante/tareas');
      await expect(page.locator('h2', { hasText: 'Mis Tareas' })).toBeVisible({ timeout: 20_000 });

      const subirEntrega = page.getByRole('button', { name: /Subir entrega|Reenviar/i }).first();
      const hayEntregables = await subirEntrega
        .waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true)
        .catch(() => false);
      if (!hayEntregables) {
        await expect(
          page.getByText(/No hay tareas|Total/i).first(),
        ).toBeVisible();
        return;
      }

      await subirEntrega.click();
      await expect(page.getByRole('button', { name: /Enviar entrega/i })).toBeDisabled();
      await page.locator('input[type="file"]').last().setInputFiles(E2E_UPLOAD_PDF);
      await expect(page.getByRole('button', { name: /Enviar entrega/i })).toBeEnabled({
        timeout: 10_000,
      });

      const entregaReq = page.waitForResponse(
        (res) => res.url().includes('/tasks/') && res.url().includes('/submit'),
      );
      await page.getByRole('button', { name: /Enviar entrega/i }).click();
      expect((await entregaReq).ok()).toBeTruthy();
      await expect(page.getByText(/enviada correctamente/i)).toBeVisible({ timeout: 20_000 });
    });
  });
});
