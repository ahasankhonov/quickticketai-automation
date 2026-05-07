import { test, expect, Page } from '@playwright/test';
import { AdminLoginPage } from '../../pages/admin/login.page';
import { AdminInvoicesPage } from '../../pages/admin/invoices.page';

const ADMIN_EMAIL = 'coxav22257@inreur.com';
const ADMIN_PASSWORD = 'qwerty123';

test.describe.serial('Admin Invoices — Negative & Edge Cases', () => {
  let page: Page;
  let invoicesPage: AdminInvoicesPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const loginPage = new AdminLoginPage(page);
    invoicesPage = new AdminInvoicesPage(page);
    await loginPage.gotoLogin();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await invoicesPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Create Invoice form validation ────────────────────────────────────────

  test('should show a warning prompt when submitting an invoice with no line items', async () => {
    await invoicesPage.clickCreateInvoice();
    // Submit Invoice is enabled even on an empty form — clicking it opens the modal
    await invoicesPage.getSubmitInvoiceButton().click();
    // Fill the required email so the Submit button inside the modal becomes enabled
    await page.getByRole('textbox', { name: 'Type email here...' }).fill('neg@test.com');
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    // The app should show a "Don't Save" prompt because there are no line items
    await expect(page.getByRole('button', { name: "Don't Save" })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: "Don't Save" }).click();
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  test('should show a warning prompt when submitting with only header details and no items', async () => {
    await invoicesPage.clickCreateInvoice();
    await invoicesPage.fillInvoiceDetails({
      projectId:    'neg-test-id',
      customerName: 'Neg Test Co',
    });
    await invoicesPage.getSubmitInvoiceButton().click();
    await page.getByRole('textbox', { name: 'Type email here...' }).fill('neg@test.com');
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByRole('button', { name: "Don't Save" })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: "Don't Save" }).click();
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  // ── Submit Invoice dialog validation ──────────────────────────────────────

  test('Submit dialog Submit button should be disabled when email is empty', async () => {
    await invoicesPage.clickCreateInvoice();
    await invoicesPage.fillInvoiceDetails({ projectId: 'neg-submit-id' });
    await invoicesPage.addJobTickets();

    await invoicesPage.getSubmitInvoiceButton().click();
    // Email is blank — Submit must be disabled
    await expect(page.getByRole('button', { name: 'Submit', exact: true })).toBeDisabled();
    // Dismiss the submit dialog
    await page.keyboard.press('Escape');
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  // ── Add Job Ticket dialog ─────────────────────────────────────────────────

  test('should search job tickets with no results and cancel cleanly', async () => {
    await invoicesPage.clickCreateInvoice();
    await invoicesPage.searchAndCancelJobTickets('zzz_no_match_99999');
    // After cancel we are back on the create invoice form
    await expect(page.getByRole('textbox', { name: 'Enter project ID' })).toBeVisible();
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  // ── Add Part dialog validation ────────────────────────────────────────────

  test('Add Part dialog Add button should be disabled when required fields are empty', async () => {
    await invoicesPage.clickCreateInvoice();
    await page.getByRole('button', { name: 'Add Items' }).click();
    await page.getByRole('button', { name: /Parts.*Materials/i }).click();
    // Search with a unique term so "Create new part" button always appears
    const tempName = `negtest-${Date.now()}`;
    await page.getByRole('textbox', { name: /Search Inventory/i }).last().fill(tempName);
    await page.getByRole('button', { name: new RegExp(`Create new part "${tempName}"`) }).click();
    // "Add Part" detail form is now open — no required fields filled yet
    const dialog = page.getByRole('dialog', { name: 'Add Part' });
    await expect(dialog).toBeVisible();
    // Add button must be disabled until required fields (unit, price, etc.) are filled
    await expect(dialog.getByRole('button', { name: 'Add' })).toBeDisabled();
    // Cancel out via button — Escape leaves a zero-qty line item that triggers a validation toast on navigate
    await dialog.getByRole('button', { name: /cancel/i }).click();
    // Also dismiss the inventory search panel
    await page.getByRole('button', { name: /cancel/i }).last().click();
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  // ── XSS ───────────────────────────────────────────────────────────────────

  test('should not execute script injected into the project ID field', async () => {
    let dialogTriggered = false;
    page.once('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await invoicesPage.clickCreateInvoice();
    await page.getByRole('textbox', { name: 'Enter project ID' }).fill('<script>alert("xss")</script>');
    // No JS dialog should fire
    expect(dialogTriggered).toBe(false);
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  // ── Long input ────────────────────────────────────────────────────────────

  test('should handle an excessively long project ID without crashing', async () => {
    await invoicesPage.clickCreateInvoice();
    await page.getByRole('textbox', { name: 'Enter project ID' }).fill('X'.repeat(500));
    // Page must remain stable
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/dashboard/invoices');
    await invoicesPage.verifyLoaded();
  });

  // ── Language in Create Invoice context ────────────────────────────────────

  test('Create Invoice button should be visible in Español', async () => {
    await invoicesPage.changeLanguage('Español');
    await expect(invoicesPage.getCreateInvoiceButton()).toBeVisible();
    await invoicesPage.changeLanguage('English US');
  });

  // ── Filters panel ─────────────────────────────────────────────────────────

  test('Filters panel should open and close correctly on reopen', async () => {
    await invoicesPage.openFilters();
    await invoicesPage.applyFilters();
    // Reopen and apply again — must be stable on second interaction
    await invoicesPage.openFilters();
    await invoicesPage.applyFilters();
  });

  // ── Page size ─────────────────────────────────────────────────────────────

  test('should change page size between values without errors', async () => {
    await invoicesPage.changePageSize(50);
    await invoicesPage.changePageSize(10);
    await expect(invoicesPage.getCreateInvoiceButton()).toBeVisible();
  });
});
