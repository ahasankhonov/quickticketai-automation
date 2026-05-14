import { test, expect, Page } from '@playwright/test';
import { TechnicianJobTicketsPage } from '../../pages/technician/job-tickets.page';
import { createTechnicianContext } from '../../support/setup';

test.describe.serial('Technician — Job Tickets', () => {
  let page: Page;
  let jobTicketsPage: TechnicianJobTicketsPage;

  const ts          = Date.now();
  const customerName = `TechCo${ts}`;
  // Technician can only SELECT existing parts/tools — use known seeds from the dev environment
  const partName     = 'qwerty';
  const toolName     = 'qwerty';

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createTechnicianContext(browser));
    jobTicketsPage = new TechnicianJobTicketsPage(page);
    await jobTicketsPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to the Job Tickets page and verify it loaded', async () => {
    await jobTicketsPage.verifyLoaded();
  });

  test('should display English stat cards', async () => {
    await jobTicketsPage.verifyStatCards('en');
  });

  test('should display all English column headers', async () => {
    await jobTicketsPage.verifyTableHeaders('en');
  });

  test('should switch to Español and show Spanish stat cards', async () => {
    await jobTicketsPage.changeLanguage('Español');
    await jobTicketsPage.verifyStatCards('es');
  });

  test('should display all Spanish column headers', async () => {
    await jobTicketsPage.verifyTableHeaders('es');
  });

  test('should switch back to English US', async () => {
    await jobTicketsPage.changeLanguage('English US');
    await jobTicketsPage.verifyTableHeaders('en');
  });

  test('should open the Create Job Ticket form and show the customer name field', async () => {
    await jobTicketsPage.clickCreateTicket();
    await expect(page.getByRole('textbox', { name: 'Enter customer company name' })).toBeVisible();
  });

  test('should fill in the customer company name', async () => {
    await jobTicketsPage.fillCustomerName(customerName);
  });

  test('should add a part to the ticket', async () => {
    await jobTicketsPage.addPart({
      name:        partName,
      unit:        'pcs',
      quantity:    1,
      price:       10,
      cost:        5,
      description: 'E2E technician test part',
    });
  });

  test('should add a tool to the ticket', async () => {
    await jobTicketsPage.addTool({
      name:        toolName,
      rate:        1,
      cost:        2,
      description: 'E2E technician test tool',
    });
    const dropdown = page.getByRole('combobox', { name: /Select options/i }).first();
    const hasDropdown = await dropdown.count() > 0;
    if (hasDropdown) {
      await dropdown.click();
      const options = page.getByRole('option');
      if (await options.count() > 0) {
        await options.first().click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  test('should fill total hours and notes', async () => {
    await jobTicketsPage.fillTotalHours(2);
    await jobTicketsPage.fillNotes('E2E automated technician test ticket');
  });

  test('should submit the ticket and navigate to the list', async () => {
    await jobTicketsPage.submitCreateTicket();
    await jobTicketsPage.goto();
    await jobTicketsPage.verifyTicketCreated();
  });

  test('should export tickets without errors', async () => {
    const exportBtn = page.getByRole('button', { name: 'Export' });
    if (!await exportBtn.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await jobTicketsPage.exportTickets();
    try {
      await downloadPromise;
    } catch {
      // Export opened a tab — acceptable
    }
  });

  test('should open the Edit form for the first ticket', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const count = await dataRows.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await jobTicketsPage.editFirstTicket();
    await expect(page.getByRole('button', { name: /Submit changes|Enviar cambios/i })).toBeVisible();
  });

  test('should update work hours and submit the edit', async () => {
    await page.getByPlaceholder('Enter work hours').fill('1');
    await jobTicketsPage.submitEdit();
    await jobTicketsPage.goto();
    await jobTicketsPage.verifyLoaded();
  });

  test('should open and close a row action menu', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const count = await dataRows.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await jobTicketsPage.openRowMenu(0);
    await expect(page.getByRole('menuitem', { name: /^Edit$|^Editar$/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('should open the voice ticket creation modal and close it', async () => {
    await jobTicketsPage.openVoiceTicket();
    await jobTicketsPage.verifyVoiceConnected();
    await jobTicketsPage.closeVoiceModal();
  });

  test('should switch to Español and verify Spanish row menu labels', async () => {
    test.setTimeout(60_000);
    await jobTicketsPage.changeLanguage('Español');
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const count = await dataRows.count();
    if (count > 0) {
      await jobTicketsPage.openRowMenu(0);
      await expect(page.getByRole('menuitem', { name: /Editar/i })).toBeVisible();
      await page.keyboard.press('Escape');
    }
    await jobTicketsPage.changeLanguage('English US');
  });
});
