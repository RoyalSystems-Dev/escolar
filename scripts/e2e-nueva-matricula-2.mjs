import { chromium } from 'playwright';

const BASE = 'http://localhost:4200';

const MATRICULA = {
  nombres: 'Isabella',
  apellidos: 'Rojas Mendez',
  dni: '80456789',
  sexo: 'Femenino',
  telEmergencia: '987222333',
  apoderado: 'Patricia Mendez Solis',
  celular: '987222333',
  nivel: 'Secundaria',
  grado: '1',
  seccion: 'B',
};

async function login(page) {
  await page.goto(`${BASE}/#/auth/login`);
  await page.getByRole('button', { name: 'Administrador' }).click();
  await page.waitForURL('**/#/dashboard**', { timeout: 20000 });
}

async function crearMatricula(page, data) {
  await page.goto(`${BASE}/#/matricula/nueva`);
  await page.locator('h2', { hasText: 'Nueva Matrícula' }).waitFor();

  await page.getByPlaceholder('Ej: Juan Carlos').fill(data.nombres);
  await page.getByPlaceholder('Ej: García Pérez').fill(data.apellidos);
  await page.locator('input[placeholder="00000000"]').first().fill(data.dni);
  await page.getByPlaceholder('999 999 999').first().fill(data.telEmergencia);
  await page.getByRole('button', { name: data.sexo }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await page.getByPlaceholder('Nombre completo').first().fill(data.apoderado);
  await page.locator('input[type="tel"][placeholder="999 999 999"]').first().fill(data.celular);
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await page.getByRole('button', { name: data.nivel }).click();
  await page.getByRole('button', { name: `${data.grado}°`, exact: true }).click();
  await page.locator(`button:has(span:text-is("${data.seccion}"))`).first().click();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await page.getByRole('button', { name: 'Finalizar' }).click();
  await page.getByText('¡Matrícula completada!').waitFor({ timeout: 30000 });
  const codigoRaw = await page.locator('div.font-mono').first().textContent();
  const codigo = codigoRaw?.replace('Código:', '').trim() ?? '';

  return { codigo, nombre: `${data.nombres} ${data.apellidos}`, dni: data.dni };
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await login(page);
  const res = await crearMatricula(page, MATRICULA);
  console.log(`OK: ${res.nombre} (${res.dni}) -> ${res.codigo}`);
  console.log('RESULTADOS_JSON:', JSON.stringify([res]));
} catch (err) {
  console.error('ERROR E2E:', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
