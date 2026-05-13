import { test, expect, Page } from '@playwright/test';
import { AdminProjectsPage } from '../../pages/admin/projects.page';
import { createManagerContext } from '../../support/setup';

const RUN_ID = Date.now().toString().slice(-6);

test.describe.serial('Manager — Projects', () => {
  let page: Page;
  let projectsPage: AdminProjectsPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    projectsPage = new AdminProjectsPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to Projects via the sidebar button', async () => {
    await projectsPage.gotoViaSidebar();
    await projectsPage.verifyLoaded();
  });

  test('should display English stat cards on the Projects page', async () => {
    await projectsPage.verifyStatCards('en');
  });

  test('should display all table column headers', async () => {
    await projectsPage.verifyTableHeaders();
  });

  test('should switch to Card view', async () => {
    await projectsPage.switchView('Card');
  });

  test('should switch back to Table view', async () => {
    await projectsPage.switchView('Table');
  });

  test('should switch to Español and show Spanish stat card labels', async () => {
    await projectsPage.changeLanguage('Español');
    await projectsPage.verifyStatCards('es');
  });

  test('should switch back to English US', async () => {
    await projectsPage.changeLanguage('English US');
    await projectsPage.verifyStatCards('en');
  });

  test('should change page size to 50', async () => {
    await projectsPage.changePageSize(50);
  });

  test('should add a project in Español and show the Spanish success toast', async () => {
    await projectsPage.changeLanguage('Español');
    await projectsPage.addProject(`mgrtestaa-${RUN_ID}`, `mgt${RUN_ID}`);
    await projectsPage.verifyAddSuccess('es');
  });

  test('should switch back to English and add a project', async () => {
    await projectsPage.changeLanguage('English US');
    await projectsPage.addProject(`mgr-eng-${RUN_ID}`, `me${RUN_ID}`);
    await projectsPage.verifyAddSuccess('en');
  });

  test('should display newly created project in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should edit the most recent project and show the update success toast', async () => {
    await projectsPage.editProject(0, '123mgrww');
    await projectsPage.verifyUpdateSuccess();
  });

  test('should cancel a delete and keep the project in the list', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await dataRows.first().waitFor();
    const rowsBefore = await page.getByRole('row').count();
    await projectsPage.deleteProject(0, false);
    await expect(page.getByRole('row')).toHaveCount(rowsBefore);
  });

  test('should confirm a delete and show the delete success toast', async () => {
    await projectsPage.deleteProject(0, true);
    await projectsPage.verifyDeleteSuccess();
  });
});
