import { test, expect, Page } from '@playwright/test';
import { AdminOverviewPage } from '../../pages/admin/overview.page';
import { AdminQuickClerkPage } from '../../pages/admin/quickclerk.page';
import { createAdminContext } from '../../support/setup';

// serial: tests share one browser session and run in order
test.describe.serial('Admin — Overview Dashboard', () => {
  let page: Page;
  let overviewPage: AdminOverviewPage;
  let quickClerkPage: AdminQuickClerkPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createAdminContext(browser));
    overviewPage = new AdminOverviewPage(page);
    quickClerkPage = new AdminQuickClerkPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Auth ─────────────────────────────────────────────────────────────────

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
    // Still on the Overview page in Spanish from the previous test — no navigation needed
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

  // ── Executive tab ─────────────────────────────────────────────────────────

  test('should display all Executive tab financial metrics', async () => {
    await overviewPage.switchTab('Executive');
    await overviewPage.verifyExecutiveMetrics();
  });

  // ── Operations tab ────────────────────────────────────────────────────────

  test('should display Operations tab leaderboard sections and column headers', async () => {
    await overviewPage.switchTab('Operations');
    await overviewPage.verifyOperationsMetrics();
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
    // After clicking New Chat the page must show the empty chat state
    await quickClerkPage.verifyNewChatState();
  });

  test('should switch language to Español and show Spanish placeholder', async () => {
    await quickClerkPage.changeLanguage('Español');
    await quickClerkPage.verifySpanishPlaceholder();
  });

  test('should switch back to English from Español', async () => {
    await quickClerkPage.changeLanguage('English US');
    // Language button must reflect English after switching back
    await quickClerkPage.verifyActiveLanguage('English US');
  });
});
