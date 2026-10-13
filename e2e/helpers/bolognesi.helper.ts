import { expect, Page } from '@playwright/test';

import { APIRequestContext } from '@playwright/test';

import {

  ApiAuthSession,

  findInstitutionByCodigoModular,

  IE_CODIGO_BOLOGNESI,

  loginApi,

} from './tenant.helper';

import { gotoAppRoute } from './routing.helper';
import { loginAsSiagieWithInstitution, selectInstitutionInHeader } from './siagie.helper';



/** Sesión API con tenant I.E. Francisco Bolognesi (cod. modular 7654321). */

export async function adminSessionBolognesi(

  request: APIRequestContext,

): Promise<ApiAuthSession & { bolognesiId: number }> {

  const siagie = await loginApi(request, 'siagie');

  const ie = await findInstitutionByCodigoModular(

    request,

    siagie.accessToken,

    IE_CODIGO_BOLOGNESI,

  );

  return { ...siagie, institutionId: ie.id, bolognesiId: ie.id };

}



/**

 * Inicia sesión como SIAGIE y activa la IE Francisco Bolognesi (administración del colegio en E2E).

 */

export async function loginAsAdminEnBolognesi(

  page: Page,

  request: APIRequestContext,

): Promise<void> {

  const { bolognesiId } = await adminSessionBolognesi(request);

  await loginAsSiagieWithInstitution(page, request, bolognesiId);

  await gotoAppRoute(page, '/dashboard');

  await expect(page.getByText(/Francisco Bolognesi|IEFB|7654321/i).first()).toBeVisible({

    timeout: 15_000,

  }).catch(() => undefined);

}

/** Reafirma la IE Bolognesi si el selector tenant cambió tras navegar (SIAGIE). */
export async function ensureBolognesiInstitutionContext(
  page: Page,
  request: APIRequestContext,
): Promise<void> {
  const { bolognesiId } = await adminSessionBolognesi(request);
  const select = page.locator('#tenant-ie-select');
  if (!(await select.isVisible().catch(() => false))) return;
  const current = await select.inputValue();
  if (Number(current) === bolognesiId) return;
  await selectInstitutionInHeader(page, bolognesiId);
}

/** Sesión de secretaría nativa de I.E. Francisco Bolognesi (`m.destino`). */
export async function secretariaSessionBolognesi(
  request: APIRequestContext,
): Promise<ApiAuthSession & { bolognesiId: number }> {
  const secretaria = await loginApi(request, 'm.destino');
  const { bolognesiId } = await adminSessionBolognesi(request);
  expect(secretaria.institutionId, 'm.destino debe pertenecer a Bolognesi').toBe(bolognesiId);
  return { ...secretaria, institutionId: bolognesiId, bolognesiId };
}

/** Login UI como secretaría de Bolognesi (sin selector de IE). */
export async function loginAsSecretariaBolognesi(page: Page): Promise<void> {
  await gotoAppRoute(page, '/auth/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  const user = page.locator('#username');
  const pass = page.locator('#password');
  await expect(user).toBeVisible({ timeout: 20_000 });
  await user.fill('m.destino');
  await pass.fill('admin123');
  const submit = page.getByRole('button', { name: 'Ingresar al Sistema' });
  await expect(submit).toBeEnabled({ timeout: 10_000 });
  await submit.click();
  await expect(page.getByText(/Destino/i).first()).toBeVisible({ timeout: 60_000 });
  await expect(page).not.toHaveURL(/auth\/login/);
  await expect(page.locator('#tenant-ie-select')).toHaveCount(0);
}

