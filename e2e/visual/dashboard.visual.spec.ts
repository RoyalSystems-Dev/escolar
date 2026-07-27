import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth.helper';

test.describe('Dashboard', () => {
  test('regresión visual del panel principal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('h1').filter({ hasText: 'Buenos días' }).waitFor({ timeout: 30_000 });

    await expect(page.locator('main, .space-y-6').first()).toHaveScreenshot('dashboard-main.png', {
      mask: [
        page.locator('h1').filter({ hasText: 'Buenos días' }),
        page.locator('p').filter({ hasText: 'resumen de hoy' }),
      ],
    });
  });
});
