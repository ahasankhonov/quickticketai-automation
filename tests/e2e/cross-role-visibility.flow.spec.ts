import { test, expect, Browser } from '@playwright/test';
import { AdminJobTicketsPage } from '../../pages/admin/job-tickets.page';
import { AdminInvoicesPage }   from '../../pages/admin/invoices.page';
import {
  MultiRoleContexts,
  createMultiRoleContexts,
  closeRoleContexts,
} from '../../support/flow-context';

// ── Unique per-run identifiers ─────────────────────────────────────────────────
const RUN   = Date.now();
const XCUST = `XRoleCo ${RUN}`;
const XINV  = `XINV${String(RUN).slice(-6)}`;

test.describe.serial('Flow: Cross-Role Visibility', () => {
  let contexts: MultiRoleContexts;

  let adminJT:        AdminJobTicketsPage;
  let managerJT:      AdminJobTicketsPage;
  let adminInvoices:  AdminInvoicesPage;
  let managerInvoices: AdminInvoicesPage;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    contexts = await createMultiRoleContexts(browser);

    // Navigate both job-ticket pages to the right URL before instantiating POs
    await Promise.all([
      contexts.admin.page.goto('/dashboard/job-tickets'),
      contexts.manager.page.goto('/dashboard/job-tickets'),
    ]);

    adminJT         = new AdminJobTicketsPage(contexts.admin.page);
    managerJT       = new AdminJobTicketsPage(contexts.manager.page);
    adminInvoices   = new AdminInvoicesPage(contexts.admin.page);
    managerInvoices = new AdminInvoicesPage(contexts.manager.page);
  });

  test.afterAll(async () => {
    await closeRoleContexts(contexts);
  });

  // ── 1 ─────────────────────────────────────────────────────────────────────
  test('1 · admin creates a job ticket with unique customer', async () => {
    await adminJT.goto();
    await adminJT.clickCreateTicket();
    await adminJT.fillCustomerName(XCUST);
    await adminJT.fillTotalHours(2);
    await adminJT.fillNotes('Cross-role flow');
    await adminJT.submitCreateTicket();
    await adminJT.goto();
    await adminJT.verifyLoaded();
  });

  // ── 2 ─────────────────────────────────────────────────────────────────────
  test('2 · manager sees the admin-created ticket in their list', async () => {
    await managerJT.goto();
    await managerJT.searchTickets(XCUST);
    const dataRows = contexts.manager.page
      .getByRole('row')
      .filter({ hasNot: contexts.manager.page.getByRole('columnheader') });
    await expect(dataRows.first()).toBeVisible({ timeout: 12000 });
    await managerJT.clearSearch();
  });

  // ── 3 ─────────────────────────────────────────────────────────────────────
  test('3 · manager has full access to invoices', async () => {
    await adminInvoices.goto();
    await adminInvoices.verifyStatCards('en');

    await managerInvoices.goto();
    await managerInvoices.verifyLoaded();
    await managerInvoices.verifyStatCards('en');
  });

  // ── 4 ─────────────────────────────────────────────────────────────────────
  test('4 · admin creates an invoice and submits it', async () => {
    await adminInvoices.goto();
    await adminInvoices.clickCreateInvoice();
    await adminInvoices.fillInvoiceDetails({
      projectId:    XINV,
      dueDays:      '30',
      customerName: XCUST,
    });
    await adminInvoices.addJobTickets();
    await adminInvoices.submitInvoice('xrole@example.com', 0);
    await adminInvoices.goto();
    await adminInvoices.verifyInvoiceSubmitted();
  });

  // ── 5 ─────────────────────────────────────────────────────────────────────
  test('5 · manager can see the submitted invoice in their list', async () => {
    await managerInvoices.goto();
    await managerInvoices.verifyLoaded();
    await expect(
      contexts.manager.page
        .getByRole('row')
        .filter({ hasText: /Submitted/i })
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ── 6 ─────────────────────────────────────────────────────────────────────
  test('6 · both roles see same Total Invoices stat card label', async () => {
    await adminInvoices.goto();
    await adminInvoices.verifyStatCards('en');

    await managerInvoices.goto();
    await managerInvoices.verifyStatCards('en');
  });
});
