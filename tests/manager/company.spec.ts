import { test, expect, Page } from '@playwright/test';
import { ManagerCompanyPage } from '../../pages/manager/company.page';
import { createManagerContext } from '../../support/setup';

const RUN_ID = Date.now().toString().slice(-6);

test.describe.serial('Manager — Company Info', () => {
  let page: Page;
  let companyPage: ManagerCompanyPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    companyPage = new ManagerCompanyPage(page);
    await companyPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test('should navigate to Company Info via the sidebar button', async () => {
    await companyPage.verifyLoaded();
  });

  test('should display company overview labels on the Company Info page', async () => {
    await companyPage.verifyCompanyLabels();
  });

  // ── Technician Roles tab ───────────────────────────────────────────────────

  test('should open the Technician Roles tab', async () => {
    await companyPage.openTab('Technician Roles');
    await expect(page.getByText(/Technician Roles|Roles.*Técnico/i).first()).toBeVisible();
  });

  test('should add a technician role and show success toast', async () => {
    await companyPage.addTechnicianRole(`Mgr Role ${RUN_ID}`);
    await companyPage.verifyRoleAddSuccess();
  });

  test('should display the newly added role in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should edit the first technician role and show update success toast', async () => {
    await companyPage.editTechnicianRole(0, `Mgr Role Edited ${RUN_ID}`);
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
    await companyPage.addTechnicianLevel(`Mgr Level ${RUN_ID}`);
    await companyPage.verifyLevelAddSuccess();
  });

  test('should display the newly added level in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should edit the first technician level and show update success toast', async () => {
    await companyPage.editTechnicianLevel(0, `Mgr Level Edited ${RUN_ID}`);
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
      role:           `Mgr RS Role ${RUN_ID}`,
      level:          `Mgr RS Level ${RUN_ID}`,
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

  test('Technician Roles tab should be accessible to the manager', async () => {
    await companyPage.verifyTechnicianRolesTabAccessible();
  });

  // ── Managers tab ───────────────────────────────────────────────────────────

  test('Managers tab should be accessible to the manager', async () => {
    await companyPage.verifyManagersTabAccessible();
  });

  // ── Restricted tabs — must not be accessible ───────────────────────────────

  test('Billing tab should not be accessible to the manager', async () => {
    await companyPage.verifyBillingTabRestricted();
  });

  test('Activity tab should not be accessible to the manager', async () => {
    await companyPage.verifyActivityTabRestricted();
  });
});
