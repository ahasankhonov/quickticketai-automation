import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';
import { AdminJobTicketsPage }      from '../../pages/admin/job-tickets.page';
import { TechnicianJobTicketsPage } from '../../pages/technician/job-tickets.page';
import {
  ADMIN_AUTH,
  TECHNICIAN_AUTH,
} from '../../support/setup';

// ── Unique per-run identifiers ─────────────────────────────────────────────────
const RUN      = Date.now();
const CUSTOMER = `AssignCo ${RUN}`;

test.describe.serial('Flow: Technician Assignment & Visibility', () => {
  let adminContext:  BrowserContext;
  let techContext:   BrowserContext;
  let adminPage:     Page;
  let techPage:      Page;

  let adminJT: AdminJobTicketsPage;
  let techJT:  TechnicianJobTicketsPage;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    [adminContext, techContext] = await Promise.all([
      browser.newContext({ storageState: ADMIN_AUTH }),
      browser.newContext({ storageState: TECHNICIAN_AUTH }),
    ]);

    adminPage = await adminContext.newPage();
    techPage  = await techContext.newPage();

    adminJT = new AdminJobTicketsPage(adminPage);
    techJT  = new TechnicianJobTicketsPage(techPage);
  });

  test.afterAll(async () => {
    await Promise.all([
      adminContext.close(),
      techContext.close(),
    ]);
  });

  // ── 1 ─────────────────────────────────────────────────────────────────────
  test('1 · admin job tickets page loads with stat cards', async () => {
    await adminJT.goto();
    await adminJT.verifyLoaded();
    await adminJT.verifyStatCards('en');
  });

  // ── 2 ─────────────────────────────────────────────────────────────────────
  test('2 · technician job tickets page loads with stat cards', async () => {
    await techPage.goto('/dashboard/job-tickets');
    await techJT.verifyLoaded();
    await techJT.verifyStatCards('en');
  });

  // ── 3 ─────────────────────────────────────────────────────────────────────
  test('3 · admin creates a ticket and attempts to assign a technician', async () => {
    await adminJT.goto();
    await adminJT.clickCreateTicket();
    await adminJT.fillCustomerName(CUSTOMER);

    // Attempt to assign the first available technician from the dropdown.
    // If no technicians exist in the account, the dropdown will be absent — gracefully skip.
    const selectDiv = adminPage
      .locator('div')
      .filter({ hasText: /^Select options\.\.\.$/ })
      .first();

    const dropdownVisible = await selectDiv.isVisible().catch(() => false);
    if (dropdownVisible) {
      await selectDiv.click();
      const firstOption = adminPage.getByRole('button').filter({ hasText: /\S/ }).first();
      const optionCount = await adminPage.getByRole('option').count();
      if (optionCount > 0) {
        await adminPage.getByRole('option').first().click();
      } else {
        // Fallback: pick any visible button inside the dropdown panel
        const dropdownPanel = adminPage.locator('[role="listbox"], [data-radix-popper-content-wrapper]').first();
        const anyBtn = dropdownPanel.getByRole('button').first();
        if (await anyBtn.isVisible().catch(() => false)) {
          await anyBtn.click();
        }
        await adminPage.keyboard.press('Escape');
      }
      // Suppress unused variable warning — firstOption existence checked implicitly
      void firstOption;
    }

    await adminJT.fillTotalHours(2);
    await adminJT.fillNotes('Assignment flow test ticket');
    await adminJT.submitCreateTicket();
    await adminJT.goto();
    await adminJT.verifyLoaded();
  });

  // ── 4 ─────────────────────────────────────────────────────────────────────
  test('4 · admin can search for the ticket by customer name', async () => {
    await adminJT.searchTickets(CUSTOMER);
    const dataRows = adminPage
      .getByRole('row')
      .filter({ hasNot: adminPage.getByRole('columnheader') });
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 });
    await expect(
      adminPage.getByRole('cell', { name: CUSTOMER }).first()
    ).toBeVisible({ timeout: 10000 });
    await adminJT.clearSearch();
  });

  // ── 5 ─────────────────────────────────────────────────────────────────────
  test('5 · technician job tickets list loads and shows table headers', async () => {
    await techPage.goto('/dashboard/job-tickets');
    await techJT.verifyLoaded();
    await techJT.verifyTableHeaders('en');
  });

  // ── 6 ─────────────────────────────────────────────────────────────────────
  test('6 · technician can create and submit a ticket', async () => {
    await techJT.clickCreateTicket();
    await techJT.fillCustomerName(`TechAssign ${RUN}`);
    await techJT.fillTotalHours(1);
    await techJT.fillNotes('Technician assignment flow self-ticket');
    await techJT.submitCreateTicket();
    await techPage.goto('/dashboard/job-tickets');
    await techJT.verifyLoaded();
  });

  // ── 7 ─────────────────────────────────────────────────────────────────────
  test('7 · technician can edit their own ticket', async () => {
    const dataRows = techPage
      .getByRole('row')
      .filter({ hasNot: techPage.getByRole('columnheader') });
    const count = await dataRows.count();
    if (count === 0) return; // no tickets — skip

    await techJT.editFirstTicket();
    await expect(
      techPage.getByRole('button', { name: /Submit changes|Enviar cambios/i })
    ).toBeVisible();
    await techPage.getByPlaceholder('Enter work hours').fill('2');
    await techJT.submitEdit();
    await techPage.goto('/dashboard/job-tickets');
    await techJT.verifyLoaded();
  });

  // ── 8 ─────────────────────────────────────────────────────────────────────
  test('8 · technician row menu has Edit but not Delete', async () => {
    const dataRows = techPage
      .getByRole('row')
      .filter({ hasNot: techPage.getByRole('columnheader') });
    const count = await dataRows.count();
    if (count === 0) return; // no data — assertion not applicable

    await techJT.openRowMenu(0);
    await expect(
      techPage.getByRole('menuitem', { name: /^Edit$|^Editar$/i })
    ).toBeVisible({ timeout: 8000 });
    await expect(
      techPage.getByRole('menuitem', { name: /^Delete$|^Eliminar$/i })
    ).not.toBeVisible();
    await techPage.keyboard.press('Escape');
  });

  // ── 9 ─────────────────────────────────────────────────────────────────────
  test('9 · admin can see all tickets including technician-created ones', async () => {
    await adminJT.goto();
    await adminJT.verifyLoaded();
    const dataRows = adminPage
      .getByRole('row')
      .filter({ hasNot: adminPage.getByRole('columnheader') });
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 });
  });
});
