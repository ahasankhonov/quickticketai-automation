import { test as setup } from '@playwright/test';
import { AdminLoginPage } from '../../pages/admin/login.page';
import { MANAGER_AUTH } from '../../support/setup';

setup('authenticate as manager', async ({ page }) => {
  const loginPage = new AdminLoginPage(page);
  await loginPage.gotoLogin();
  await loginPage.login('e2emgr445036@example.com', 'qwerty123');
  await page.context().storageState({ path: MANAGER_AUTH });
});
