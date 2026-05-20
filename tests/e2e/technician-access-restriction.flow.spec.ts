import { test, expect, Page, BrowserContext } from '@playwright/test';
import { TechnicianJobTicketsPage } from '../../pages/technician/job-tickets.page';
import { TechnicianProfilePage }    from '../../pages/technician/profile.page';
import { createTechnicianContext }  from '../../support/setup';

test.describe.serial('Flow: Technician Access Restrictions', () => {
  let context: BrowserContext;
  let page: Page;
  let jobTickets: TechnicianJobTicketsPage;
  let profile:    TechnicianProfilePage;

  test.beforeAll(async ({ browser }) => {
    ({ context, page } = await createTechnicianContext(browser));
    jobTickets = new TechnicianJobTicketsPage(page);
    profile    = new TechnicianProfilePage(page);
  });

  test.afterAll(async () => {
    await page.close();
    await context.close();
  });

  // ── Positive access — what technicians CAN do ─────────────────────────────

  // ── 1 ─────────────────────────────────────────────────────────────────────
  test('1 · technician can access job tickets page and sees all stat cards', async () => {
    await page.goto('/dashboard/job-tickets');
    await jobTickets.verifyLoaded();
    await jobTickets.verifyStatCards('en');
    await jobTickets.verifyTableHeaders('en');
  });

  // ── 2 ─────────────────────────────────────────────────────────────────────
  test('2 · technician can open the Create Job Ticket form', async () => {
    await jobTickets.clickCreateTicket();
    await expect(
      page.getByRole('textbox', { name: 'Enter customer company name' })
    ).toBeVisible();
    await page.goto('/dashboard/job-tickets');
    await jobTickets.verifyLoaded();
  });

  // ── 3 ─────────────────────────────────────────────────────────────────────
  test('3 · technician can access profile panel via header badge', async () => {
    await profile.gotoViaSidebar();
    await profile.verifyLoaded();
    await profile.verifyProfileInfo();
    // Return to job tickets so subsequent navigation tests start from a clean state
    await page.goto('/dashboard/job-tickets');
  });

  // ── Negative access — privileged routes are blocked ───────────────────────

  // ── 4 ─────────────────────────────────────────────────────────────────────
  test('4 · technician cannot create invoices — Create Invoice button absent', async () => {
    await page.goto('/dashboard/invoices');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const currentUrl = page.url();

    if (/\/dashboard\/invoices/.test(currentUrl)) {
      // Page served — privileged action button must not be present
      await expect(
        page.getByRole('button', { name: /Create Invoice|Crear Factura/i })
      ).not.toBeVisible({ timeout: 5000 });
    } else {
      // Redirected away — server correctly denied access
      expect(/\/dashboard/.test(currentUrl)).toBe(true);
    }
  });

  // ── 5 ─────────────────────────────────────────────────────────────────────
  test('5 · technician cannot manage customers — Add Customer button absent', async () => {
    await page.goto('/dashboard/customers');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const currentUrl = page.url();

    if (/\/dashboard\/customers/.test(currentUrl)) {
      await expect(
        page.getByRole('button', { name: /Add Customer|Agregar Cliente/i })
      ).not.toBeVisible({ timeout: 5000 });
    } else {
      expect(/\/dashboard/.test(currentUrl)).toBe(true);
    }
  });

  // ── 6 ─────────────────────────────────────────────────────────────────────
  test('6 · technician cannot manage projects — Add Project button absent', async () => {
    await page.goto('/dashboard/projects');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const currentUrl = page.url();

    if (/\/dashboard\/projects/.test(currentUrl)) {
      await expect(
        page.getByRole('button', { name: /Add Project|Agregar Proyecto/i })
      ).not.toBeVisible({ timeout: 5000 });
    } else {
      expect(/\/dashboard/.test(currentUrl)).toBe(true);
    }
  });

  // ── 7 ─────────────────────────────────────────────────────────────────────
  test('7 · technician cannot manage inventory — add controls absent', async () => {
    await page.goto('/dashboard/inventory');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const currentUrl = page.url();

    if (/\/dashboard\/inventory/.test(currentUrl)) {
      await expect(
        page.getByRole('button', { name: /Add Equipment|Add Part|Agregar Equipo|Agregar Parte/i })
      ).not.toBeVisible({ timeout: 5000 });
    } else {
      expect(/\/dashboard/.test(currentUrl)).toBe(true);
    }
  });

  // ── 8 ─────────────────────────────────────────────────────────────────────
  test('8 · technician cannot access company settings — billing and activity tabs absent or disabled', async () => {
    await page.goto('/dashboard/company-info');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    const currentUrl = page.url();

    if (/\/dashboard\/company-info/.test(currentUrl)) {
      const billingTab  = page.getByRole('tab', { name: /^Billing$|^Facturación$/i });
      const activityTab = page.getByRole('tab', { name: /^Activity$|^Actividad$/i });
      const billingVisible  = await billingTab.isVisible().catch(() => false);
      const activityVisible = await activityTab.isVisible().catch(() => false);
      if (billingVisible)  await expect(billingTab).toBeDisabled();
      if (activityVisible) await expect(activityTab).toBeDisabled();
    } else {
      expect(/\/dashboard/.test(currentUrl)).toBe(true);
    }
  });

  // ── Row-level permission enforcement ──────────────────────────────────────

  // ── 9 ─────────────────────────────────────────────────────────────────────
  test('9 · technician row menu shows Edit but never Delete', async () => {
    await page.goto('/dashboard/job-tickets');
    await jobTickets.verifyLoaded();

    const dataRows = page
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
    const count = await dataRows.count();

    if (count === 0) return; // no data — assertion not applicable

    await jobTickets.openRowMenu(0);
    await expect(
      page.getByRole('menuitem', { name: /^Edit$|^Editar$/i })
    ).toBeVisible({ timeout: 8000 });
    await expect(
      page.getByRole('menuitem', { name: /^Delete$|^Eliminar$/i })
    ).not.toBeVisible();
    await page.keyboard.press('Escape');
  });
});
