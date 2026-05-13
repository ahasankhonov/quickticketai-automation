import { test, expect, Page } from '@playwright/test';
import { AdminInvoicesPage } from '../../pages/admin/invoices.page';
import { createManagerContext } from '../../support/setup';

test.describe.serial('Manager Invoices — Negative & Edge Cases', () => {
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

  test('should show a warning prompt when submitting an invoice with no line items', async () => {
    await invoicesPage.clickCreateInvoice();
    await invoicesPage.getSubmitInvoiceButton().click();
    await page.getByRole('textbox', { name: 'Type email here...' }).fill('neg@test.com');
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByRole('button', { name: "Don't Save" })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: "Don't Save" }).click();
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  test('should show a warning prompt when submitting with only header details and no items', async () => {
    await invoicesPage.clickCreateInvoice();
    await invoicesPage.fillInvoiceDetails({
      projectId:    'mgr-neg-test-id',
      customerName: 'Mgr Neg Test Co',
    });
    await invoicesPage.getSubmitInvoiceButton().click();
    await page.getByRole('textbox', { name: 'Type email here...' }).fill('neg@test.com');
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByRole('button', { name: "Don't Save" })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: "Don't Save" }).click();
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  test('Submit dialog Submit button should be disabled when email is empty', async () => {
    await invoicesPage.clickCreateInvoice();
    await invoicesPage.fillInvoiceDetails({ projectId: 'mgr-neg-submit-id' });
    await invoicesPage.addJobTickets();

    await invoicesPage.getSubmitInvoiceButton().click();
    await expect(page.getByRole('button', { name: 'Submit', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  test('should search job tickets with no results and cancel cleanly', async () => {
    await invoicesPage.clickCreateInvoice();
    await invoicesPage.searchAndCancelJobTickets('zzz_no_match_99999');
    await expect(page.getByRole('textbox', { name: 'Enter project ID' })).toBeVisible();
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  test('Add Part dialog Add button should be disabled when required fields are empty', async () => {
    await invoicesPage.clickCreateInvoice();
    await page.getByRole('button', { name: 'Add Items' }).click();
    await page.getByRole('button', { name: /Parts.*Materials/i }).click();
    const tempName = `mgr-negtest-${Date.now()}`;
    await page.getByRole('textbox', { name: /Search Inventory/i }).last().fill(tempName);
    await page.getByRole('button', { name: new RegExp(`Create new part "${tempName}"`) }).click();
    const dialog = page.getByRole('dialog', { name: 'Add Part' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Add' })).toBeDisabled();
    await dialog.getByRole('button', { name: /cancel/i }).click();
    await page.getByRole('button', { name: /cancel/i }).last().click();
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  test('should not execute script injected into the project ID field', async () => {
    let dialogTriggered = false;
    page.once('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await invoicesPage.clickCreateInvoice();
    await page.getByRole('textbox', { name: 'Enter project ID' }).fill('<script>alert("xss")</script>');
    expect(dialogTriggered).toBe(false);
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  test('should handle an excessively long project ID without crashing', async () => {
    await invoicesPage.clickCreateInvoice();
    await page.getByRole('textbox', { name: 'Enter project ID' }).fill('X'.repeat(500));
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  test('Create Invoice button should be visible in Español', async () => {
    await invoicesPage.changeLanguage('Español');
    await expect(invoicesPage.getCreateInvoiceButton()).toBeVisible();
    await invoicesPage.changeLanguage('English US');
  });

  test('Filters panel should open and close correctly on reopen', async () => {
    await invoicesPage.openFilters();
    await invoicesPage.applyFilters();
    await invoicesPage.openFilters();
    await invoicesPage.applyFilters();
  });

  test('should change page size between values without errors', async () => {
    await invoicesPage.changePageSize(50);
    await invoicesPage.changePageSize(10);
    await expect(invoicesPage.getCreateInvoiceButton()).toBeVisible();
  });
});
