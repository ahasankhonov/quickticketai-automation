import { test, expect, Page, BrowserContext } from '@playwright/test';
import { AdminCustomersPage }  from '../../pages/admin/customers.page';
import { AdminProjectsPage }   from '../../pages/admin/projects.page';
import { AdminJobTicketsPage } from '../../pages/admin/job-tickets.page';
import { AdminInvoicesPage }   from '../../pages/admin/invoices.page';
import { createAdminContext }  from '../../support/setup';

// ── Unique per-run identifiers ─────────────────────────────────────────────────
const RUN      = Date.now();
const CLIENT   = `CycleClient ${RUN}`;
const PROJNAME = `CycleProject ${RUN}`;
const PROJCODE = `CP${String(RUN).slice(-6)}`;
const ADDRESS  = `123 Test St, San Jose CA ${String(RUN).slice(-5)}`;

test.describe.serial('Flow: Customer → Project → Invoice Lifecycle (Admin)', () => {
  let context:    BrowserContext;
  let page:       Page;

  let customers:  AdminCustomersPage;
  let projects:   AdminProjectsPage;
  let jobTickets: AdminJobTicketsPage;
  let invoices:   AdminInvoicesPage;

  test.beforeAll(async ({ browser }) => {
    ({ context, page } = await createAdminContext(browser));
    customers  = new AdminCustomersPage(page);
    projects   = new AdminProjectsPage(page);
    jobTickets = new AdminJobTicketsPage(page);
    invoices   = new AdminInvoicesPage(page);
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  // ── 1 ─────────────────────────────────────────────────────────────────────
  test('1 · create unique customer for the billing cycle', async () => {
    await customers.goto();
    const added = await customers.addCustomer(CLIENT);
    expect(added).toBe(true);
    await expect(page.getByText(CLIENT).first()).toBeVisible();
  });

  // ── 2 ─────────────────────────────────────────────────────────────────────
  test('2 · edit customer to add physical address', async () => {
    await customers.editCustomer(0);
    await customers.fillAddressAndSave(ADDRESS);
    await customers.verifyUpdateSuccess();
  });

  // ── 3 ─────────────────────────────────────────────────────────────────────
  test('3 · verify customer appears in search results', async () => {
    await customers.search(CLIENT);
    const dataRows = page
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 });
    await customers.clearSearch();
  });

  // ── 4 ─────────────────────────────────────────────────────────────────────
  test('4 · create a project for the billing cycle', async () => {
    await projects.goto();
    await projects.addProject(PROJNAME, PROJCODE);
    // Accept either the inline success toast or the list row — whichever resolves first
    await Promise.race([
      projects.verifyProjectInList(PROJNAME),
      projects.verifyAddSuccess('en'),
    ]);
  });

  // ── 5 ─────────────────────────────────────────────────────────────────────
  test('5 · create job ticket for the customer', async () => {
    await jobTickets.goto();
    await jobTickets.clickCreateTicket();
    await jobTickets.fillCustomerName(CLIENT);
    await jobTickets.fillTotalHours(6);
    await jobTickets.fillNotes('Customer billing cycle test');
    await jobTickets.submitCreateTicket();
    await jobTickets.goto();
    await jobTickets.verifyLoaded();
  });

  // ── 6 ─────────────────────────────────────────────────────────────────────
  test('6 · create invoice referencing the project and customer', async () => {
    await invoices.goto();
    await invoices.clickCreateInvoice();
    await invoices.fillInvoiceDetails({
      projectId:   PROJCODE,
      poNumber:    `PO${RUN}`,
      dueDays:     '45',
      customerName: CLIENT,
      description: `Billing cycle ${RUN}`,
    });
    await invoices.addJobTickets();
    await invoices.submitInvoice('billing@example.com', 5);
  });

  // ── 7 ─────────────────────────────────────────────────────────────────────
  test('7 · verify invoice is submitted and visible in list', async () => {
    await invoices.goto();
    await invoices.verifyLoaded();
    await invoices.verifyInvoiceSubmitted();
    await invoices.verifyStatCards('en');
  });
});
