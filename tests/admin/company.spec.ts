import { test, expect, Page } from '@playwright/test';
import { AdminCompanyPage } from '../../pages/admin/company.page';
import { createAdminContext } from '../../support/setup';

const RUN_ID = Date.now().toString().slice(-6);

test.describe.serial('Admin — Company Info', () => {
  let page: Page;
  let companyPage: AdminCompanyPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createAdminContext(browser));
    companyPage = new AdminCompanyPage(page);
    await companyPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test('should navigate to Company Info via the sidebar button', async () => {
    await companyPage.verifyLoaded();
  });

  // ── Company overview panel (always visible — no tab click needed) ────────────

  test('should display company overview labels on the Company Info page', async () => {
    await companyPage.verifyCompanyLabels();
  });

  // ── Technician Roles tab ───────────────────────────────────────────────────

  test('should open the Technician Roles tab', async () => {
    await companyPage.openTab('Technician Roles');
    await expect(page.getByText(/Technician Roles|Roles.*Técnico/i).first()).toBeVisible();
  });

  test('should add a technician role and show success toast', async () => {
    await companyPage.addTechnicianRole(`E2E Role ${RUN_ID}`);
    await companyPage.verifyRoleAddSuccess();
  });

  test('should display the newly added role in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should edit the first technician role and show update success toast', async () => {
    await companyPage.editTechnicianRole(0, `E2E Role Edited ${RUN_ID}`);
    await companyPage.verifyRoleUpdateSuccess();
  });

  test('should cancel technician role delete and keep the row', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await dataRows.first().waitFor();
    const rowsBefore = await page.getByRole('row').count();
    await companyPage.deleteTechnicianRole(0, false);
    await expect(page.getByRole('row')).toHaveCount(rowsBefore);
  });

  test('should confirm technician role delete and show success toast', async () => {
    await companyPage.deleteTechnicianRole(0, true);
    await companyPage.verifyRoleDeleteSuccess();
  });

  // ── Technician Levels tab ──────────────────────────────────────────────────

  test('should open the Technician Levels tab', async () => {
    await companyPage.openTab('Technician Levels');
    await expect(page.getByText(/Technician Levels|Niveles.*Técnico/i).first()).toBeVisible();
  });

  test('should add a technician level and show success toast', async () => {
    await companyPage.addTechnicianLevel(`E2E Level ${RUN_ID}`);
    await companyPage.verifyLevelAddSuccess();
  });

  test('should display the newly added level in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should edit the first technician level and show update success toast', async () => {
    await companyPage.editTechnicianLevel(0, `E2E Level Edited ${RUN_ID}`);
    await companyPage.verifyLevelUpdateSuccess();
  });

  test('should cancel technician level delete and keep the row', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await dataRows.first().waitFor();
    const rowsBefore = await page.getByRole('row').count();
    await companyPage.deleteTechnicianLevel(0, false);
    await expect(page.getByRole('row')).toHaveCount(rowsBefore);
  });

  test('should confirm technician level delete and show success toast', async () => {
    await companyPage.deleteTechnicianLevel(0, true);
    await companyPage.verifyLevelDeleteSuccess();
  });

  // ── Rate Sheet tab ─────────────────────────────────────────────────────────

  test('should open the Rate Sheet tab', async () => {
    await companyPage.openTab('Rate Sheet');
    await expect(page.getByText(/Rate Sheet|Hoja.*Tarifa/i).first()).toBeVisible();
  });

  test('should add a rate sheet entry and show success toast', async () => {
    await companyPage.addRateSheet({
      role:           `E2E RS Role ${RUN_ID}`,
      level:          `E2E RS Level ${RUN_ID}`,
      revenueRate:    120,
      technicianRate: 80,
    });
    await companyPage.verifyRateSheetAddSuccess();
  });

  test('should edit the first rate sheet entry and show update success toast', async () => {
    await companyPage.openTab('Rate Sheet');
    await companyPage.editRateSheet(0, 130);
    await companyPage.verifyRateSheetUpdateSuccess();
  });

  // ── Technicians tab ────────────────────────────────────────────────────────

  test('should open the Technicians tab', async () => {
    await companyPage.openTab('Technicians');
    await expect(page.getByText(/Technicians|Técnicos/i).first()).toBeVisible();
  });

  test('should invite a technician and handle duplicate validation', async () => {
    const result = await companyPage.inviteTechnician({
      name:     `E2E Tech ${RUN_ID}`,
      email:    `e2etech${RUN_ID}@example.com`,
      password: 'qwerty123',
    });
    if (result === 'success') {
      await companyPage.verifyTechnicianInviteSuccess();
    } else {
      // Duplicate email or phone — retry with a different email derived from timestamp
      const retry = await companyPage.inviteTechnician({
        name:     `E2E Tech Retry ${RUN_ID}`,
        email:    `e2etechretry${Date.now()}@example.com`,
        password: 'qwerty123',
      });
      expect(retry).toBe('success');
      await companyPage.verifyTechnicianInviteSuccess();
    }
  });

  // ── Managers tab ───────────────────────────────────────────────────────────

  test('should open the Managers tab', async () => {
    await companyPage.openTab('Managers');
    await expect(page.getByText(/Managers|Gerentes/i).first()).toBeVisible();
  });

  test('should invite a manager with confirm password and show success toast', async () => {
    const password = 'qwerty123';
    const result = await companyPage.inviteManager({
      name:            `E2E Manager ${RUN_ID}`,
      email:           `e2emgr${RUN_ID}@example.com`,
      password,
      confirmPassword: password,
    });
    if (result === 'success') {
      await companyPage.verifyManagerInviteSuccess();
    } else {
      // Duplicate — retry with a different email
      const retry = await companyPage.inviteManager({
        name:            `E2E Manager Retry ${RUN_ID}`,
        email:           `e2emgrretry${Date.now()}@example.com`,
        password,
        confirmPassword: password,
      });
      expect(retry).toBe('success');
      await companyPage.verifyManagerInviteSuccess();
    }
  });

  // ── Billing tab ────────────────────────────────────────────────────────────

  test('should open the Billing tab and verify table headers', async () => {
    await companyPage.openTab('Billing');
    await companyPage.verifyBillingTableHeaders('en');
  });

  test('should open and close the Cancel Subscription modal', async () => {
    await companyPage.openCancelSubscriptionModal();
    await companyPage.closeCancelSubscriptionModal();
  });

  test('should apply a Subscription filter on the Billing tab', async () => {
    await companyPage.filterBySubscription();
    // After filtering, the table (possibly empty) should still be visible
    await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10_000 });
  });

  // ── Integrations tab ───────────────────────────────────────────────────────

  test('should open the Integrations tab and show the QuickBooks Connect button', async () => {
    await companyPage.openTab('Integrations');
    await companyPage.verifyQuickBooksButton();
  });

  // ── Activity tab ───────────────────────────────────────────────────────────

  test('should open the Activity tab and verify it loaded', async () => {
    await companyPage.openTab('Activity');
    await companyPage.verifyActivityLoaded();
  });
});
