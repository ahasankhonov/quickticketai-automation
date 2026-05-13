import { test, expect, Page } from '@playwright/test';
import { AdminInvoicesPage } from '../../pages/admin/invoices.page';
import { createManagerContext } from '../../support/setup';

test.describe.serial('Manager — Invoices', () => {
  let page: Page;
  let invoicesPage: AdminInvoicesPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    invoicesPage = new AdminInvoicesPage(page);
    await invoicesPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to the Invoices page and verify it loaded', async () => {
    await invoicesPage.verifyLoaded();
  });

  test('should display English stat cards', async () => {
    await invoicesPage.verifyStatCards('en');
  });

  test('should display all English column headers', async () => {
    await invoicesPage.verifyTableHeaders('en');
  });

  test('should switch to Español and show Spanish column headers', async () => {
    await invoicesPage.changeLanguage('Español');
    await invoicesPage.verifyTableHeaders('es');
  });

  test('should switch back to English US', async () => {
    await invoicesPage.changeLanguage('English US');
    await invoicesPage.verifyTableHeaders('en');
  });

  test('should open the Filters panel and apply with no selections', async () => {
    await invoicesPage.openFilters();
    await invoicesPage.applyFilters();
  });

  test('should open the Create Invoice form', async () => {
    await invoicesPage.clickCreateInvoice();
    await expect(page.getByRole('textbox', { name: 'Enter project ID' })).toBeVisible();
  });

  test('should fill in all invoice header details', async () => {
    await invoicesPage.fillInvoiceDetails({
      projectId:    'mgr-e2etestid',
      poNumber:     'PO-MGR-001',
      dueDays:      '30',
      customerName: 'E2E Mgr Test Company',
      contactName:  'E2E Mgr Contact',
      location:     'E2E Mgr Location',
      description:  'Automated E2E manager test invoice',
    });
  });

  test('should add an available job ticket to the invoice', async () => {
    await invoicesPage.addJobTickets();
    await expect(page.getByRole('button', { name: 'Add Items' })).toBeVisible();
  });

  test('should add a part to the invoice', async () => {
    const partName = `mgr-e2epart-${Date.now()}`;
    await invoicesPage.addPart({
      name:        partName,
      unit:        'pcs',
      quantity:    2,
      price:       15,
      cost:        10,
      description: 'E2E manager test part for invoice',
    });
    await expect(invoicesPage.getSubmitInvoiceButton()).toBeVisible();
  });

  test('should submit the invoice and show the success toast', async () => {
    await invoicesPage.submitInvoice('test@test.com', 5);
    await invoicesPage.dismissSavePromptIfPresent();

    if (await invoicesPage.getSubmitInvoiceButton().isVisible()) {
      await invoicesPage.addJobTickets();
      await invoicesPage.submitInvoice('test@test.com', 5);
    }

    await invoicesPage.goto();
    await invoicesPage.verifyInvoiceSubmitted();
  });

  test('should change the page size to 50', async () => {
    await invoicesPage.changePageSize(50);
  });

  test('should open and close a row action menu', async () => {
    const rows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await rows.first().waitFor();
    await invoicesPage.openRowMenu(0);
    await page.keyboard.press('Escape');
  });

  test('should show the Get Paid button on the invoices page', async () => {
    await expect(page.getByRole('button', { name: 'Get Paid' }).first()).toBeVisible();
  });

  test('should open the QuickPay modal via Get Paid', async () => {
    await page.getByRole('button', { name: 'Get Paid' }).first().click();
    await expect(page.getByText(/QuickPay/i).first()).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
