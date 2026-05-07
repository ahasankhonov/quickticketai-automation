import { test, expect, Page } from '@playwright/test';
import { AdminLoginPage } from '../../pages/admin/login.page';
import { AdminProjectsPage } from '../../pages/admin/projects.page';

const ADMIN_EMAIL = 'coxav22257@inreur.com';
const ADMIN_PASSWORD = 'qwerty123';

test.describe.serial('Admin — Projects', () => {
  let page: Page;
  let projectsPage: AdminProjectsPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const loginPage = new AdminLoginPage(page);
    projectsPage = new AdminProjectsPage(page);
    await loginPage.gotoLogin();
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test('should navigate to Projects via the sidebar button', async () => {
    await projectsPage.gotoViaSidebar();
    await projectsPage.verifyLoaded();
  });

  // ── Stat cards ────────────────────────────────────────────────────────────

  test('should display English stat cards on the Projects page', async () => {
    await projectsPage.verifyStatCards('en');
  });

  // ── Table headers ─────────────────────────────────────────────────────────

  test('should display all table column headers', async () => {
    await projectsPage.verifyTableHeaders();
  });

  // ── View toggle ───────────────────────────────────────────────────────────

  test('should switch to Card view', async () => {
    await projectsPage.switchView('Card');
  });

  test('should switch back to Table view', async () => {
    await projectsPage.switchView('Table');
  });

  // ── Language ──────────────────────────────────────────────────────────────

  test('should switch to Español and show Spanish stat card labels', async () => {
    await projectsPage.changeLanguage('Español');
    await projectsPage.verifyStatCards('es');
  });

  test('should switch back to English US', async () => {
    await projectsPage.changeLanguage('English US');
    await projectsPage.verifyStatCards('en');
  });

  // ── Page size ─────────────────────────────────────────────────────────────

  test('should change page size to 50', async () => {
    await projectsPage.changePageSize(50);
  });

  // ── Add project in Español ────────────────────────────────────────────────

  test('should add a project in Español and show the Spanish success toast', async () => {
    await projectsPage.changeLanguage('Español');
    await projectsPage.addProject('testaa', 'teatss');
    await projectsPage.verifyAddSuccess('es');
  });

  // ── Add project in English ────────────────────────────────────────────────

  test('should switch back to English and add a project', async () => {
    await projectsPage.changeLanguage('English US');
    await projectsPage.addProject('123', '123');
    await projectsPage.verifyAddSuccess('en');
  });

  test('should display newly created project in the list (not just show success toast)', async () => {
    // Regression: server returned success toast but project never appeared in the table
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Edit project ──────────────────────────────────────────────────────────

  test('should edit the most recent project and show the update success toast', async () => {
    await projectsPage.editProject(0, '123ww');
    await projectsPage.verifyUpdateSuccess();
  });

  // ── Delete — cancel ───────────────────────────────────────────────────────

  test('should cancel a delete and keep the project in the list', async () => {
    // Wait for at least one data row before capturing the count
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await dataRows.first().waitFor();
    const rowsBefore = await page.getByRole('row').count();
    await projectsPage.deleteProject(0, false);
    // Row count must be unchanged after cancelling
    await expect(page.getByRole('row')).toHaveCount(rowsBefore);
  });

  // ── Delete — confirm ──────────────────────────────────────────────────────

  test('should confirm a delete and show the delete success toast', async () => {
    await projectsPage.deleteProject(0, true);
    await projectsPage.verifyDeleteSuccess();
  });
});
