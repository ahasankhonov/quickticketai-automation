import { test, expect, Page } from '@playwright/test';
import { ManagerOverviewPage } from '../../pages/manager/overview.page';
import { AdminQuickClerkPage } from '../../pages/admin/quickclerk.page';
import { createManagerContext } from '../../support/setup';

test.describe.serial('Manager — Overview Dashboard', () => {
  let page: Page;
  let overviewPage: ManagerOverviewPage;
  let quickClerkPage: AdminQuickClerkPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    overviewPage = new ManagerOverviewPage(page);
    quickClerkPage = new AdminQuickClerkPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  test('should log in successfully and land on the dashboard', async () => {
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ── Overview tab ──────────────────────────────────────────────────────────

  test('should load the Overview tab', async () => {
    await overviewPage.goto();
    await overviewPage.verifyOverviewLoaded();
  });

  test('should display English metric cards on the Overview tab', async () => {
    await overviewPage.switchTab('Overview');
    await overviewPage.verifyOverviewMetrics('en');
  });

  test('should display Spanish metric labels after switching to Español', async () => {
    await overviewPage.changeLanguage('Español');
    await overviewPage.verifyOverviewMetrics('es');
  });

  test('should open the Filters panel while in Español', async () => {
    await overviewPage.openFilters();
    await overviewPage.verifyFiltersOpen();
  });

  test('should restore English metric labels after switching back from Español', async () => {
    await overviewPage.changeLanguage('English US');
    await overviewPage.verifyOverviewMetrics('en');
  });

  // ── Tab navigation ────────────────────────────────────────────────────────

  test('should cycle through all four dashboard tabs', async () => {
    await overviewPage.switchTab('Executive');
    await overviewPage.switchTab('Operations');
    await overviewPage.switchTab('Customer Metrics');
    await overviewPage.switchTab('Overview');
  });

  // ── Executive tab — accessible, restricted data ───────────────────────────

  test('Executive tab should be accessible to the manager', async () => {
    const tab = page.getByRole('tab', { name: 'Executive' });
    await expect(tab).toBeVisible();
    await expect(tab).not.toBeDisabled();
  });

  test('Executive tab should not display restricted admin analytics', async () => {
    await overviewPage.verifyExecutiveTabRestrictedData();
  });

  // ── Operations tab — accessible, restricted data ──────────────────────────

  test('Operations tab should be accessible to the manager', async () => {
    await overviewPage.switchTab('Overview');
    const tab = page.getByRole('tab', { name: 'Operations' });
    await expect(tab).toBeVisible();
    await expect(tab).not.toBeDisabled();
  });

  test('Operations tab should not display restricted admin analytics', async () => {
    await overviewPage.verifyOperationsTabRestrictedData();
  });

  // ── Customer Metrics tab ──────────────────────────────────────────────────

  test('should navigate to the Customer Metrics tab', async () => {
    await overviewPage.switchTab('Customer Metrics');
    await overviewPage.verifyCustomerMetricsTab();
  });

  // ── QuickClerk ────────────────────────────────────────────────────────────

  test('should navigate to QuickClerk via the sidebar button', async () => {
    await quickClerkPage.gotoViaSidebar();
    await quickClerkPage.verifyLoaded();
  });

  test('should start a new chat session', async () => {
    await quickClerkPage.startNewChat();
    await quickClerkPage.verifyNewChatState();
  });

  test('should switch language to Español and show Spanish placeholder', async () => {
    await quickClerkPage.changeLanguage('Español');
    await quickClerkPage.verifySpanishPlaceholder();
  });

  test('should switch back to English from Español', async () => {
    await quickClerkPage.changeLanguage('English US');
    await quickClerkPage.verifyActiveLanguage('English US');
  });
});
