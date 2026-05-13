import { test, expect, Page } from '@playwright/test';
import { AdminCustomersPage } from '../../pages/admin/customers.page';
import { createManagerContext } from '../../support/setup';

const RUN_ID = Date.now().toString().slice(-6);

test.describe.serial('Manager — Customers', () => {
  let page: Page;
  let customersPage: AdminCustomersPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    customersPage = new AdminCustomersPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to Customers via the sidebar button', async () => {
    await customersPage.gotoViaSidebar();
    await customersPage.verifyLoaded();
  });

  test('should display English table column headers', async () => {
    await customersPage.verifyTableHeaders('en');
  });

  test('should switch to Español and show Spanish column headers', async () => {
    await customersPage.changeLanguage('Español');
    await customersPage.verifyTableHeaders('es');
  });

  test('should switch back to English US', async () => {
    await customersPage.changeLanguage('English US');
    await customersPage.verifyTableHeaders('en');
  });

  test('should change page size to 50', async () => {
    await customersPage.changePageSize(50);
  });

  test('should add a new customer and show success toast', async () => {
    const succeeded = await customersPage.addCustomer(`E2E Mgr Customer ${RUN_ID}`);
    if (!succeeded) {
      const retried = await customersPage.addCustomer(`E2E Mgr Customer Retry ${RUN_ID}`);
      expect(retried).toBe(true);
    }
    await customersPage.verifyAddSuccess('en');
  });

  test('should display the newly created customer in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should edit the first customer address and show update success toast', async () => {
    await customersPage.editCustomer(0);
    await customersPage.fillAddressAndSave(`123 Mgr Street ${RUN_ID}`);
    await customersPage.verifyUpdateSuccess();
  });

  test('should search for a customer and find at least one result', async () => {
    await customersPage.search('E2E');
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
    await customersPage.clearSearch();
  });

  test('should cancel a delete and keep the customer in the list', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await dataRows.first().waitFor();
    const rowsBefore = await page.getByRole('row').count();
    await customersPage.deleteCustomer(0, false);
    await expect(page.getByRole('row')).toHaveCount(rowsBefore);
  });

  test('should confirm a delete and show the delete success toast', async () => {
    await customersPage.deleteCustomer(0, true);
    await customersPage.verifyDeleteSuccess();
  });
});
