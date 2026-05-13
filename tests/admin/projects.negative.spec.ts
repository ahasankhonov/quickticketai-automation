import { test, expect, Page } from '@playwright/test';
import { AdminProjectsPage } from '../../pages/admin/projects.page';
import { createAdminContext } from '../../support/setup';

test.describe.serial('Admin Projects — Negative & Edge Cases', () => {
  let page: Page;
  let projectsPage: AdminProjectsPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createAdminContext(browser));
    projectsPage = new AdminProjectsPage(page);
    await projectsPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Add project validation ─────────────────────────────────────────────────

  test('should disable Save when project name is empty', async () => {
    await projectsPage.getAddProjectButton().click();
    await projectsPage.getProjectCodeInput().fill('VALIDCODE');
    await expect(projectsPage.getSaveButton()).toBeDisabled();
    await page.getByRole('button', { name: /^cancel$|^cancelar$/i }).click();
  });

  test('should disable Save when project code is empty', async () => {
    await projectsPage.getAddProjectButton().click();
    await projectsPage.getProjectNameInput().fill('Valid Project Name');
    await expect(projectsPage.getSaveButton()).toBeDisabled();
    await page.getByRole('button', { name: /^cancel$|^cancelar$/i }).click();
  });

  test('should disable Save when both name and code are empty', async () => {
    await projectsPage.getAddProjectButton().click();
    await expect(projectsPage.getSaveButton()).toBeDisabled();
    await page.getByRole('button', { name: /^cancel$|^cancelar$/i }).click();
  });

  test('should disable Save when project name is whitespace only', async () => {
    await projectsPage.getAddProjectButton().click();
    await projectsPage.getProjectNameInput().fill('     ');
    await projectsPage.getProjectCodeInput().fill('VALIDCODE');
    await expect(projectsPage.getSaveButton()).toBeDisabled();
    await page.getByRole('button', { name: /^cancel$|^cancelar$/i }).click();
  });

  // ── XSS ───────────────────────────────────────────────────────────────────

  test('should not execute script injected into the project name field', async () => {
    let dialogTriggered = false;
    page.once('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await projectsPage.getAddProjectButton().click();
    await projectsPage.getProjectNameInput().fill('<script>alert("xss")</script>');
    await projectsPage.getProjectCodeInput().fill('XSS01');

    const saveBtn = projectsPage.getSaveButton();
    if (!await saveBtn.isDisabled()) {
      await saveBtn.click();
    }

    expect(dialogTriggered).toBe(false);
    if (await page.getByRole('dialog').isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /^cancel$|^cancelar$/i }).click();
    }
  });

  // ── Long input ────────────────────────────────────────────────────────────

  test('should handle an excessively long project name without crashing', async () => {
    const longName = 'A'.repeat(500);
    await projectsPage.getAddProjectButton().click();
    await projectsPage.getProjectNameInput().fill(longName);
    await projectsPage.getProjectCodeInput().fill('LONG01');

    await expect(page).toHaveURL(/\/dashboard\/projects/);
    await page.getByRole('button', { name: /^cancel$|^cancelar$/i }).click();
    await projectsPage.verifyLoaded();
  });

  // ── Cancel delete ─────────────────────────────────────────────────────────

  test('should keep the project row after cancelling a delete', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    if (await dataRows.count() === 0) {
      test.skip();
      return;
    }
    const rowsBefore = await page.getByRole('row').count();
    await projectsPage.deleteProject(0, false);
    await expect(page.getByRole('row')).toHaveCount(rowsBefore);
  });

  // ── Edit validation ───────────────────────────────────────────────────────

  test('should disable Save when editing a project and clearing the name', async () => {
    const rows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const count = await rows.count();
    if (count === 0) {
      test.skip();
      return;
    }
    // Open the action menu on the first row, then select Edit
    await rows.nth(0).getByRole('button').last().click();
    await page.getByRole('menuitem', { name: /edit|editar/i }).click();
    await projectsPage.getProjectNameInput().clear();
    await expect(projectsPage.getSaveButton()).toBeDisabled();
    await page.getByRole('button', { name: /^cancel$|^cancelar$/i }).click();
  });

  // ── Rapid view switching ──────────────────────────────────────────────────

  test('rapid view switching should settle on the last selected view', async () => {
    await projectsPage.switchView('Card');
    await projectsPage.switchView('Table');
    await projectsPage.switchView('Card');
    await projectsPage.switchView('Table');

    await expect(page.getByRole('radio', { name: /table|vista de tabla/i })).toBeChecked();
    await projectsPage.verifyTableHeaders();
  });
});
