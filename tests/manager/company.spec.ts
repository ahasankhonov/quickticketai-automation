import { test, expect, Page } from '@playwright/test';
import { ManagerCompanyPage } from '../../pages/manager/company.page';
import { createManagerContext } from '../../support/setup';

test.describe.serial('Manager — Company Info (tab access restrictions)', () => {
  let page: Page;
  let companyPage: ManagerCompanyPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    companyPage = new ManagerCompanyPage(page);
    await companyPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Accessible tabs — confirm they work ────────────────────────────────────

  test('Technician Roles tab should be accessible to the manager', async () => {
    await companyPage.verifyTechnicianRolesTabAccessible();
  });

  test('Managers tab should be accessible to the manager', async () => {
    await companyPage.verifyManagersTabAccessible();
  });

  // ── Restricted tabs — must not be accessible ───────────────────────────────

  test('Billing tab should not be accessible to the manager', async () => {
    await companyPage.verifyBillingTabRestricted();
  });

  test('Activity tab should not be accessible to the manager', async () => {
    await companyPage.verifyActivityTabRestricted();
  });
});
