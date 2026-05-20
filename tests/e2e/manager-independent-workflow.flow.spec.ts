import { test, expect, Page, BrowserContext } from '@playwright/test';
import { AdminCustomersPage }   from '../../pages/admin/customers.page';
import { AdminProjectsPage }    from '../../pages/admin/projects.page';
import { AdminJobTicketsPage }  from '../../pages/admin/job-tickets.page';
import { AdminInvoicesPage }    from '../../pages/admin/invoices.page';
import { AdminOverviewPage }    from '../../pages/admin/overview.page';
import { createManagerContext } from '../../support/setup';

// ── Unique per-run identifiers ─────────────────────────────────────────────────
const RUN      = Date.now();
const CUSTOMER = `MgrFlow ${RUN}`;
const PROJNAME = `MgrProject ${RUN}`;
const PROJCODE = `MF${String(RUN).slice(-6)}`;

test.describe.serial('Flow: Manager Independent Workflow', () => {
  let context: BrowserContext;
  let page: Page;

  let customers:  AdminCustomersPage;
  let projects:   AdminProjectsPage;
  let jobTickets: AdminJobTicketsPage;
  let invoices:   AdminInvoicesPage;
  let overview:   AdminOverviewPage;

  test.beforeAll(async ({ browser }) => {
    ({ context, page } = await createManagerContext(browser));
    customers  = new AdminCustomersPage(page);
    projects   = new AdminProjectsPage(page);
    jobTickets = new AdminJobTicketsPage(page);
    invoices   = new AdminInvoicesPage(page);
    overview   = new AdminOverviewPage(page);
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  // ── 1 ─────────────────────────────────────────────────────────────────────
  test('1 · manager dashboard overview loads with English metrics', async () => {
    await overview.goto();
    await overview.verifyOverviewLoaded();
    await overview.verifyOverviewMetrics('en');
  });

  // ── 2 ─────────────────────────────────────────────────────────────────────
  test('2 · manager creates a new customer', async () => {
    await customers.goto();
    const added = await customers.addCustomer(CUSTOMER);
    expect(added).toBe(true);
    await expect(page.getByText(CUSTOMER).first()).toBeVisible();
  });

  // ── 3 ─────────────────────────────────────────────────────────────────────
  test('3 · manager searches for the customer and finds it', async () => {
    await customers.search(CUSTOMER);
    const dataRows = page
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 });
    await customers.clearSearch();
  });

  // ── 4 ─────────────────────────────────────────────────────────────────────
  test('4 · manager creates a project', async () => {
    await projects.goto();
    await projects.addProject(PROJNAME, PROJCODE);
    await Promise.race([
      projects.verifyProjectInList(PROJNAME),
      projects.verifyAddSuccess('en'),
    ]);
  });

  // ── 5 ─────────────────────────────────────────────────────────────────────
  test('5 · manager creates a job ticket for the customer', async () => {
    await jobTickets.goto();
    await jobTickets.clickCreateTicket();
    await jobTickets.fillCustomerName(CUSTOMER);
    await jobTickets.fillTotalHours(3);
    await jobTickets.fillNotes('Manager independent flow test');
    await jobTickets.submitCreateTicket();
    await jobTickets.goto();
    await jobTickets.verifyLoaded();
  });

  // ── 6 ─────────────────────────────────────────────────────────────────────
  test('6 · ticket appears in list when searching by customer name', async () => {
    await jobTickets.searchTickets(CUSTOMER);
    const dataRows = page
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: CUSTOMER }).first()).toBeVisible({ timeout: 10000 });
    await jobTickets.clearSearch();
  });

  // ── 7 ─────────────────────────────────────────────────────────────────────
  test('7 · job tickets stat cards are visible in English', async () => {
    await jobTickets.verifyStatCards('en');
    await expect(page.getByText('Total Tickets')).toBeVisible();
    await expect(page.getByText('Not Assigned')).toBeVisible();
  });

  // ── 8 ─────────────────────────────────────────────────────────────────────
  test('8 · manager creates invoice and attaches the job ticket', async () => {
    await invoices.goto();
    await invoices.clickCreateInvoice();
    await invoices.fillInvoiceDetails({
      projectId:   PROJCODE,
      poNumber:    `MGRPO-${RUN}`,
      dueDays:     '30',
      customerName: CUSTOMER,
      description: `Manager flow invoice ${RUN}`,
    });
    await invoices.addJobTickets();
  });

  // ── 9 ─────────────────────────────────────────────────────────────────────
  test('9 · manager submits invoice and verifies Submitted status', async () => {
    await invoices.submitInvoice(`mgr-flow-${RUN}@example.com`, 0);
    await invoices.goto();
    await invoices.verifyLoaded();
    await invoices.verifyInvoiceSubmitted();
  });

  // ── 10 ────────────────────────────────────────────────────────────────────
  test('10 · invoice stat cards show Submitted Invoices after submission', async () => {
    await invoices.verifyStatCards('en');
    await expect(page.getByText('Submitted Invoices')).toBeVisible();
  });
});
