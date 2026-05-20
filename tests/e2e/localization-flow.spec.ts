import { test, expect, Page, BrowserContext } from '@playwright/test';
import { AdminOverviewPage }   from '../../pages/admin/overview.page';
import { AdminCustomersPage }  from '../../pages/admin/customers.page';
import { AdminJobTicketsPage } from '../../pages/admin/job-tickets.page';
import { AdminInvoicesPage }   from '../../pages/admin/invoices.page';
import { createAdminContext }  from '../../support/setup';

test.describe.serial('Flow: Localization — Language Persistence (Admin)', () => {
  let context:    BrowserContext;
  let page:       Page;

  let overview:   AdminOverviewPage;
  let customers:  AdminCustomersPage;
  let jobTickets: AdminJobTicketsPage;
  let invoices:   AdminInvoicesPage;

  test.beforeAll(async ({ browser }) => {
    ({ context, page } = await createAdminContext(browser));
    overview   = new AdminOverviewPage(page);
    customers  = new AdminCustomersPage(page);
    jobTickets = new AdminJobTicketsPage(page);
    invoices   = new AdminInvoicesPage(page);
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  // ── 1 ─────────────────────────────────────────────────────────────────────
  test('1 · customers page shows English headers by default', async () => {
    await customers.goto();
    await customers.verifyLoaded();
    await customers.verifyTableHeaders('en');
    await customers.verifyStatCards('en');
  });

  // ── 2 ─────────────────────────────────────────────────────────────────────
  test('2 · switch to Español — customers page updates to Spanish', async () => {
    await customers.changeLanguage('Español');
    await customers.verifyTableHeaders('es');
    await customers.verifyStatCards('es');
  });

  // ── 3 ─────────────────────────────────────────────────────────────────────
  test('3 · navigate to job tickets — Spanish persists without re-switching', async () => {
    // Use sidebar click (SPA navigation) rather than page.goto() so React language state is preserved
    await page.getByRole('button', { name: /^Job Tickets$|^Tickets de Trabajo$/i }).click();
    await page.waitForURL(/\/dashboard\/job-tickets/, { timeout: 10000 });
    await jobTickets.verifyStatCards('es');
    await jobTickets.verifyTableHeaders('es');
  });

  // ── 4 ─────────────────────────────────────────────────────────────────────
  test('4 · navigate to invoices — Spanish persists', async () => {
    // Use sidebar click (SPA navigation) to preserve React language state
    await invoices.gotoViaSidebar();
    await invoices.verifyStatCards('es');
    await invoices.verifyTableHeaders('es');
  });

  // ── 5 ─────────────────────────────────────────────────────────────────────
  test('5 · navigate to overview — Spanish metrics render', async () => {
    // Use sidebar click (SPA navigation) to preserve React language state
    await page.getByRole('button', { name: /^Overview$|^Resumen$/i }).click();
    await page.waitForURL(/\/dashboard\/overview/, { timeout: 10000 });
    await overview.verifyOverviewLoaded();
    await overview.verifyOverviewMetrics('es');
  });

  // ── 6 ─────────────────────────────────────────────────────────────────────
  test('6 · switch back to English US', async () => {
    // Use the overview page object (already on overview) to switch back
    await overview.changeLanguage('English US');
    await expect(
      page.getByRole('button', { name: /English US/i }).first()
    ).toBeVisible();
  });

  // ── 7 ─────────────────────────────────────────────────────────────────────
  test('7 · customers page shows English after language restored', async () => {
    await customers.goto();
    await customers.verifyTableHeaders('en');
    await customers.verifyStatCards('en');
  });

  // ── 8 ─────────────────────────────────────────────────────────────────────
  test('8 · job tickets page shows English after language restored', async () => {
    await jobTickets.goto();
    await jobTickets.verifyStatCards('en');
    await jobTickets.verifyTableHeaders('en');
  });

  // ── 9 ─────────────────────────────────────────────────────────────────────
  test('9 · invoices page shows English after language restored', async () => {
    await invoices.goto();
    await invoices.verifyStatCards('en');
    await invoices.verifyTableHeaders('en');
  });
});
