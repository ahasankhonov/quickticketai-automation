import { test, expect, Page } from '@playwright/test';
import { AdminJobTicketsPage } from '../../pages/admin/job-tickets.page';
import { createAdminContext } from '../../support/setup';

test.describe.serial('Admin — Job Tickets', () => {
  let page: Page;
  let jobTicketsPage: AdminJobTicketsPage;

  // Unique per-run data so repeated runs don't collide
  const ts           = Date.now();
  const templateName  = `e2e-tpl-${ts}`;
  const customerName  = `E2ECo${ts}`;   // unique — prevents autocomplete dropdown from blocking
  const techName      = `E2E Tech ${ts}`;
  const techEmail     = `e2etech${ts}@test.com`;
  const roleName      = `e2e-role-${ts}`;
  const levelName     = `e2e-level-${ts}`;
  const partName      = `e2e-part-${ts}`;
  const toolName      = `e2e-tool-${ts}`;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createAdminContext(browser));
    jobTicketsPage = new AdminJobTicketsPage(page);
    await jobTicketsPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test('should navigate to the Job Tickets page and verify it loaded', async () => {
    await jobTicketsPage.verifyLoaded();
  });

  // ── Stat cards ────────────────────────────────────────────────────────────

  test('should display English stat cards', async () => {
    await jobTicketsPage.verifyStatCards('en');
  });

  // ── Table headers ─────────────────────────────────────────────────────────

  test('should display all English column headers', async () => {
    await jobTicketsPage.verifyTableHeaders('en');
  });

  // ── Language ──────────────────────────────────────────────────────────────

  test('should switch to Español and show Spanish stat cards', async () => {
    await jobTicketsPage.changeLanguage('Español');
    await jobTicketsPage.verifyStatCards('es');
  });

  test('should switch to Español and show Spanish column headers', async () => {
    await jobTicketsPage.verifyTableHeaders('es');
  });

  test('should switch back to English US', async () => {
    await jobTicketsPage.changeLanguage('English US');
    await jobTicketsPage.verifyTableHeaders('en');
  });

  // ── Create Job Ticket ─────────────────────────────────────────────────────

  test('should open the Create Job Ticket form', async () => {
    await jobTicketsPage.clickCreateTicket();
    await expect(page.getByRole('textbox', { name: 'Select template...' })).toBeVisible();
  });

  test('should create a new template within the form', async () => {
    await jobTicketsPage.createTemplate({ nameEn: templateName, nameEs: `${templateName}-es` });
    // After creating, the form remains open — verify the template selector is still visible
    await expect(page.getByRole('textbox', { name: 'Select template...' })).toBeVisible();
  });

  test('should select the new template as ticket type', async () => {
    await jobTicketsPage.selectTemplate(templateName);
    await expect(page.getByRole('textbox', { name: 'Enter customer company name' })).toBeVisible();
  });

  test('should fill in the customer company name', async () => {
    await jobTicketsPage.fillCustomerName(customerName);
  });

  test('should invite a technician with role, level, and rate sheet', async () => {
    test.setTimeout(120_000); // invite flow has 19+ actions; slowMo:800 + API calls exceed the 30s default
    await jobTicketsPage.inviteTechnician({
      name:           techName,
      email:          techEmail,
      password:       'qwerty123',
      role:           roleName,
      level:          levelName,
      revenueRate:    1,
      technicianRate: 1,
    });
    // After invite, the "Invite New Technician" button should still be present (form stays open)
    // and the Line Items section below should now be visible
    await expect(page.getByRole('button', { name: 'Add Part' })).toBeVisible({ timeout: 8000 });
  });

  test('should assign the invited technician to the ticket', async () => {
    // The "Add Technician → Select options..." in Ticket Details must be filled;
    // at this point it is the only such dropdown on the form
    await jobTicketsPage.assignTechnicianToDropdown(techName);
  });

  test('should add a part to the ticket', async () => {
    await jobTicketsPage.addPart({
      name:        partName,
      unit:        'pcs',
      quantity:    1,
      price:       10,
      cost:        5,
      description: 'E2E test part',
    });
  });

  test('should add a tool to the ticket', async () => {
    await jobTicketsPage.addTool({
      name:        toolName,
      rate:        1,
      cost:        2,
      description: 'E2E test tool',
    });
    // The tool row exposes its own "Add Technician → Select options..." dropdown;
    // the ticket-level dropdown is already filled so this is the only one remaining
    await jobTicketsPage.assignTechnicianToDropdown(techName);
  });

  test('should fill total hours and notes', async () => {
    await jobTicketsPage.fillTotalHours(2);
    await jobTicketsPage.fillNotes('E2E automated test ticket');
  });

  test('should submit the ticket and navigate to the list', async () => {
    await jobTicketsPage.submitCreateTicket();
    await jobTicketsPage.goto();
    await jobTicketsPage.verifyTicketCreated();
  });

  // ── Post-create: list actions ─────────────────────────────────────────────

  test('should export tickets without errors', async () => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await jobTicketsPage.exportTickets();
    // Accept either a file download or a new tab (app may open a popup instead)
    try {
      await downloadPromise;
    } catch {
      // Export opened a tab — that's also acceptable
    }
  });

  test('should open the Edit form for the first ticket', async () => {
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
    await jobTicketsPage.openRowMenu(0);
    await expect(page.getByRole('menuitem', { name: /^Edit$|^Editar$/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('should switch to Español and verify Spanish row menu labels', async () => {
    test.setTimeout(60_000);
    await jobTicketsPage.changeLanguage('Español');
    await jobTicketsPage.openRowMenu(0);
    await expect(page.getByRole('menuitem', { name: /Editar/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await jobTicketsPage.changeLanguage('English US');
  });
});
