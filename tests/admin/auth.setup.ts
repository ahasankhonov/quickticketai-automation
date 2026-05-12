import { test as setup } from '@playwright/test';
import { AdminLoginPage } from '../../pages/admin/login.page';

const AUTH_FILE = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  const loginPage = new AdminLoginPage(page);
  await loginPage.gotoLogin();
  await loginPage.login('coxav22257@inreur.com', 'qwerty123');
  await page.context().storageState({ path: AUTH_FILE });
});
