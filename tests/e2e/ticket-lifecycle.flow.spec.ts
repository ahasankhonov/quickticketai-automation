import { test, expect, Page, BrowserContext } from '@playwright/test';
import { AdminOverviewPage }    from '../../pages/admin/overview.page';
import { AdminCustomersPage }   from '../../pages/admin/customers.page';
import { AdminInventoryPage }   from '../../pages/admin/inventory.page';
import { AdminJobTicketsPage }  from '../../pages/admin/job-tickets.page';
import { AdminInvoicesPage }    from '../../pages/admin/invoices.page';
import { createAdminContext }   from '../../support/setup';

// ── Unique per-run identifiers ─────────────────────────────────────────────────
const RUN      = Date.now();
const CUSTOMER = `FlowCo ${RUN}`;
const PART     = `flow-part-${RUN}`;
const PROJECT  = `FLOW${String(RUN).slice(-6)}`;

test.describe.serial('Flow: Ticket Lifecycle (Admin)', () => {
  let context: BrowserContext;
  let page: Page;

  let overview:   AdminOverviewPage;
  let customers:  AdminCustomersPage;
  let inventory:  AdminInventoryPage;
  let jobTickets: AdminJobTicketsPage;
  let invoices:   AdminInvoicesPage;

  test.beforeAll(async ({ browser }) => {
    ({ context, page } = await createAdminContext(browser));
    overview   = new AdminOverviewPage(page);
    customers  = new AdminCustomersPage(page);
    inventory  = new AdminInventoryPage(page);
    jobTickets = new AdminJobTicketsPage(page);
    invoices   = new AdminInvoicesPage(page);
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  // ── 1 ─────────────────────────────────────────────────────────────────────
  test('1 · dashboard overview loads and shows metrics', async () => {
    await overview.goto();
    await overview.verifyOverviewLoaded();
    await overview.verifyOverviewMetrics('en');
  });

  // ── 2 ─────────────────────────────────────────────────────────────────────
  test('2 · create new customer for this flow', async () => {
    await customers.goto();
    const added = await customers.addCustomer(CUSTOMER);
    expect(added).toBe(true);
    await expect(page.getByText(CUSTOMER).first()).toBeVisible();
  });

  // ── 3 ─────────────────────────────────────────────────────────────────────
  test('3 · create inventory part to attach to the ticket', async () => {
    await inventory.goto();
    await inventory.switchTab('Parts');
    const added = await inventory.addPart({
      name:     PART,
      unit:     'pcs',
      quantity: 10,
      price:    100,
      cost:     50,
    });
    expect(added).toBe(true);
    await inventory.verifyPartAddSuccess();
  });

  // ── 4 ─────────────────────────────────────────────────────────────────────
  test('4 · create job ticket with customer and part', async () => {
    await jobTickets.goto();
    await jobTickets.clickCreateTicket();
    await jobTickets.fillCustomerName(CUSTOMER);
    await jobTickets.addPart({
      name:     PART,
      unit:     'pcs',
      quantity: 2,
      price:    100,
      cost:     50,
    });
    await jobTickets.fillTotalHours(4);
    await jobTickets.fillNotes('Lifecycle flow');
    await jobTickets.submitCreateTicket();
    await jobTickets.goto();
    await jobTickets.verifyLoaded();
  });

  // ── 5 ─────────────────────────────────────────────────────────────────────
  test('5 · ticket appears in list when searching by customer', async () => {
    await jobTickets.searchTickets(CUSTOMER);
    const dataRows = page
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: CUSTOMER }).first()).toBeVisible({ timeout: 10000 });
    await jobTickets.clearSearch();
  });

  // ── 6 ─────────────────────────────────────────────────────────────────────
  test('6 · job tickets stat cards reflect live data', async () => {
    await jobTickets.verifyStatCards('en');
    await expect(page.getByText('Total Tickets')).toBeVisible();
    await expect(page.getByText('Assigned to Invoice')).toBeVisible();
    await expect(page.getByText('Not Assigned')).toBeVisible();
  });

  // ── 7 ─────────────────────────────────────────────────────────────────────
  test('7 · create invoice and attach the job ticket as line item', async () => {
    await invoices.goto();
    await invoices.clickCreateInvoice();
    await invoices.fillInvoiceDetails({
      projectId:   PROJECT,
      poNumber:    `PO-${RUN}`,
      dueDays:     '30',
      customerName: CUSTOMER,
      description: `Flow invoice ${RUN}`,
    });
    await invoices.addJobTickets();
  });

  // ── 8 ─────────────────────────────────────────────────────────────────────
  test('8 · submit invoice and confirm Submitted status in list', async () => {
    await invoices.submitInvoice('flow@example.com', 0);
    await invoices.goto();
    await invoices.verifyLoaded();
    await invoices.verifyInvoiceSubmitted();
  });

  // ── 9 ─────────────────────────────────────────────────────────────────────
  test('9 · invoice stat cards confirm Submitted Invoices visible', async () => {
    await invoices.verifyStatCards('en');
    await expect(page.getByText('Submitted Invoices')).toBeVisible();
  });
});
