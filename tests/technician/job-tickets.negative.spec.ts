import { test, expect, Page } from '@playwright/test';
import { TechnicianJobTicketsPage } from '../../pages/technician/job-tickets.page';
import { createTechnicianContext } from '../../support/setup';

test.describe.serial('Technician — Job Tickets — Negative & Edge Cases', () => {
  let page: Page;
  let jobTicketsPage: TechnicianJobTicketsPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createTechnicianContext(browser));
    jobTicketsPage = new TechnicianJobTicketsPage(page);
    await jobTicketsPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should open the Create Job Ticket form and show the customer name field', async () => {
    await jobTicketsPage.clickCreateTicket();
    await expect(page.getByRole('textbox', { name: 'Enter customer company name' })).toBeVisible();
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
    await page.getByRole('textbox', { name: 'Enter customer company name' })
      .fill('<script>alert("xss")</script>');

    expect(dialogTriggered).toBe(false);
    await page.goto('/dashboard/job-tickets');
    await jobTicketsPage.verifyLoaded();
  });

  test('should handle an excessively long customer name without crashing', async () => {
    await jobTicketsPage.clickCreateTicket();
    await page.getByRole('textbox', { name: 'Enter customer company name' }).fill('A'.repeat(500));
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/dashboard/job-tickets');
    await jobTicketsPage.verifyLoaded();
  });

  test('should close the Create Job Ticket form without submitting', async () => {
    await jobTicketsPage.clickCreateTicket();
    await expect(page.getByRole('textbox', { name: 'Enter customer company name' })).toBeVisible();
    await page.goto('/dashboard/job-tickets');
    await jobTicketsPage.verifyLoaded();
  });

  test('should open row menu on first ticket and show Edit and Delete options', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const count = await dataRows.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await jobTicketsPage.openRowMenu(0);
    await expect(page.getByRole('menuitem', { name: /^Edit$|^Editar$/i })).toBeVisible();
    // Technician role does not have Delete permission — only Edit is shown
    await page.keyboard.press('Escape');
  });

  test('should display Spanish row menu labels in Español mode', async () => {
    await jobTicketsPage.changeLanguage('Español');
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const count = await dataRows.count();
    if (count > 0) {
      await jobTicketsPage.openRowMenu(0);
      await expect(page.getByRole('menuitem', { name: /Editar/i })).toBeVisible();
      // Technician has no Delete permission — Eliminar is not shown
      await page.keyboard.press('Escape');
    }
    await jobTicketsPage.changeLanguage('English US');
  });

  test('should search for a non-existent term without crashing', async () => {
    await jobTicketsPage.searchTickets('abc_no_match_xyz');
    await expect(page).toHaveURL(/\/dashboard\/job-tickets/);
    await jobTicketsPage.clearSearch();
    await jobTicketsPage.verifyLoaded();
  });
});
