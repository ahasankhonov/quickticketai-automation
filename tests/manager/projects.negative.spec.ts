import { test, expect, Page } from '@playwright/test';
import { AdminProjectsPage } from '../../pages/admin/projects.page';
import { createManagerContext } from '../../support/setup';

test.describe.serial('Manager Projects — Negative & Edge Cases', () => {
  let page: Page;
  let projectsPage: AdminProjectsPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    projectsPage = new AdminProjectsPage(page);
    await projectsPage.gotoViaSidebar();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should disable Save when project name is empty', async () => {
    await projectsPage.getAddProjectButton().click();
    await projectsPage.getProjectCodeInput().fill('MGRVALIDCODE');
    await expect(projectsPage.getSaveButton()).toBeDisabled();
    await page.keyboard.press('Escape');
  });

  test('should disable Save when project code is empty', async () => {
    await projectsPage.getAddProjectButton().click();
    await projectsPage.getProjectNameInput().fill('Valid Manager Project Name');
    await expect(projectsPage.getSaveButton()).toBeDisabled();
    await page.keyboard.press('Escape');
  });

  test('should disable Save when both name and code are empty', async () => {
    await projectsPage.getAddProjectButton().click();
    await expect(projectsPage.getSaveButton()).toBeDisabled();
    await page.keyboard.press('Escape');
  });

  test('should disable Save when project name is whitespace only', async () => {
    await projectsPage.getAddProjectButton().click();
    await projectsPage.getProjectNameInput().fill('     ');
    await projectsPage.getProjectCodeInput().fill('MGRVALIDCODE');
    await expect(projectsPage.getSaveButton()).toBeDisabled();
    await page.keyboard.press('Escape');
  });

  test('should not execute script injected into the project name field', async () => {
    let dialogTriggered = false;
    page.once('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await projectsPage.getAddProjectButton().click();
    await projectsPage.getProjectNameInput().fill('<script>alert("xss")</script>');
    await projectsPage.getProjectCodeInput().fill('XSSMGR01');

    const saveBtn = projectsPage.getSaveButton();
    if (!await saveBtn.isDisabled()) {
      await saveBtn.click();
    }

    expect(dialogTriggered).toBe(false);
    await page.keyboard.press('Escape');
  });

  test('should handle an excessively long project name without crashing', async () => {
    const longName = 'A'.repeat(500);
    await projectsPage.getAddProjectButton().click();
    await projectsPage.getProjectNameInput().fill(longName);
    await projectsPage.getProjectCodeInput().fill('MGRLNG01');

    await expect(page).toHaveURL(/\/dashboard\/projects/);
    await page.keyboard.press('Escape');
    await projectsPage.verifyLoaded();
  });

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

  test('should disable Save when editing a project and clearing the name', async () => {
    const rows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const count = await rows.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await rows.nth(0).getByRole('button').last().click();
    await page.getByRole('menuitem', { name: /edit|editar/i }).click();
    await projectsPage.getProjectNameInput().clear();
    await expect(projectsPage.getSaveButton()).toBeDisabled();
    await page.keyboard.press('Escape');
  });

  test('rapid view switching should settle on the last selected view', async () => {
    await projectsPage.switchView('Card');
    await projectsPage.switchView('Table');
    await projectsPage.switchView('Card');
    await projectsPage.switchView('Table');

    await expect(page.getByRole('radio', { name: /table|vista de tabla/i })).toBeChecked();
    await projectsPage.verifyTableHeaders();
  });
});
