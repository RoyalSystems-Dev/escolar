import path from 'node:path';
import type { Locator } from '@playwright/test';

/** PDF mínimo válido para pruebas de carga (documentos y tareas). */
export const E2E_UPLOAD_PDF = path.join(process.cwd(), 'e2e', 'fixtures', 'e2e-upload.pdf');

/** Dispara `change` tras `setInputFiles` (inputs ocultos en Angular). */
export async function setFilesAndEmitChange(input: Locator, filePath: string): Promise<void> {
  await input.setInputFiles(filePath);
  await input.evaluate((el) => {
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}
