import { test as setup } from '@playwright/test';
import { AdminLoginPage } from '../../pages/admin/login.page';
import { TECHNICIAN_AUTH } from '../../support/setup';

setup('authenticate as technician', async ({ page }) => {
  const loginPage = new AdminLoginPage(page);
  await loginPage.gotoLogin();
  await loginPage.login('e2etech1778674243317@test.com', 'qwerty123');
  await page.context().storageState({ path: TECHNICIAN_AUTH });
});
