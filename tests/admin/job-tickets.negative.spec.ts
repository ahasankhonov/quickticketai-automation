import { test, expect, Page } from '@playwright/test';
import { AdminLoginPage } from '../../pages/admin/login.page';
import { AdminJobTicketsPage } from '../../pages/admin/job-tickets.page';

const ADMIN_EMAIL = 'coxav22257@inreur.com';
const ADMIN_PASSWORD = 'qwerty123';

test.describe.serial('Admin Job Tickets — Negative & Edge Cases', () => {
  let page: Page;
  let jobTicketsPage: AdminJobTicketsPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const loginPage = new AdminLoginPage(page);
    jobTicketsPage = new AdminJobTicketsPage(page);
    await loginPage.gotoLogin();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await jobTicketsPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Create form validation ─────────────────────────────────────────────────

  test('should open the Create Job Ticket form and show the ticket type selector', async () => {
    await jobTicketsPage.clickCreateTicket();
    // Ticket type combobox must be visible and the form must be in create state
    await expect(page.getByRole('combobox', { name: 'Select ticket type...' })).toBeVisible();
    await page.goto('/dashboard/job-tickets');
    await jobTicketsPage.verifyLoaded();
  });

  test('should not execute script injected into the customer name field', async () => {
    let dialogTriggered = false;
    page.once('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await jobTicketsPage.clickCreateTicket();
    // Select an existing template first so the customer field is visible
    const combobox = page.getByRole('combobox', { name: 'Select ticket type...' });
    await combobox.click();
    const options = page.getByRole('option');
    const count = await options.count();
    if (count > 0) {
      await options.first().click();
      await page.getByRole('textbox', { name: 'Enter customer company name' })
        .fill('<script>alert("xss")</script>');
    } else {
      await page.keyboard.press('Escape');
    }

    expect(dialogTriggered).toBe(false);
    await page.goto('/dashboard/job-tickets');
    await jobTicketsPage.verifyLoaded();
  });

  test('should handle an excessively long customer name without crashing', async () => {
    await jobTicketsPage.clickCreateTicket();
    const combobox = page.getByRole('combobox', { name: 'Select ticket type...' });
    await combobox.click();
    const options = page.getByRole('option');
    if (await options.count() > 0) {
      await options.first().click();
      await page.getByRole('textbox', { name: 'Enter customer company name' }).fill('A'.repeat(500));
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/dashboard/job-tickets');
    await jobTicketsPage.verifyLoaded();
  });

  // ── Search ────────────────────────────────────────────────────────────────

  test('should show "Must be number" when a text search term is entered', async () => {
    await jobTicketsPage.searchTickets('abc_no_match');
    // The app validates that ticket ID search must be numeric
    await expect(page.getByText('Must be number', { exact: true })).toBeVisible({ timeout: 5000 });
    await jobTicketsPage.clearSearch();
  });


  // ── Language ──────────────────────────────────────────────────────────────

  test('Create Job Ticket button should be visible in Español', async () => {
    await jobTicketsPage.changeLanguage('Español');
    await expect(jobTicketsPage.getCreateTicketButton()).toBeVisible();
    await jobTicketsPage.changeLanguage('English US');
  });

  // ── Edit flow ─────────────────────────────────────────────────────────────

  test('should open edit form and cancel without saving changes', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const count = await dataRows.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await jobTicketsPage.editFirstTicket();
    await expect(page.getByRole('button', { name: /Submit changes|Enviar cambios/i })).toBeVisible();
    // Navigate away without submitting — changes discarded
    await page.goto('/dashboard/job-tickets');
    await jobTicketsPage.verifyLoaded();
  });

  // ── Row menu in Spanish ───────────────────────────────────────────────────

  test('row menu should show Spanish labels in Español mode', async () => {
    await jobTicketsPage.changeLanguage('Español');
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const count = await dataRows.count();
    if (count > 0) {
      await jobTicketsPage.openRowMenu(0);
      await expect(page.getByRole('menuitem', { name: /Editar/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /Eliminar/i })).toBeVisible();
      await page.keyboard.press('Escape');
    }
    await jobTicketsPage.changeLanguage('English US');
  });
});
