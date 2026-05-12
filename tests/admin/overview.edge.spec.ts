import { test, expect, Page } from '@playwright/test';
import { AdminOverviewPage } from '../../pages/admin/overview.page';
import { createAdminContext } from '../../support/setup';

// Spanish tab labels — the entire tab strip translates when language is Español
const ES_TABS = {
  overview:        'Resumen',
  executive:       'Ejecutivo',
  operations:      'Operaciones',
  customerMetrics: 'Métricas de Cliente',
} as const;

test.describe.serial('Admin Overview — Edge Cases', () => {
  let page: Page;
  let overviewPage: AdminOverviewPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createAdminContext(browser));
    overviewPage = new AdminOverviewPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // Reset to a clean Overview state in English before every edge case
  test.beforeEach(async () => {
    await overviewPage.goto();
    await overviewPage.switchTab('Overview');
    await overviewPage.changeLanguage('English US'); // idempotent — safe if already English
  });

  // ── Tab behaviour ─────────────────────────────────────────────────────────

  test('clicking an already-active tab should not change state or throw errors', async () => {
    // Overview is already active from beforeEach — clicking it again must be a no-op
    await overviewPage.switchTab('Overview');
    await overviewPage.verifyOverviewLoaded();
    await overviewPage.verifyOverviewMetrics('en');
  });

  test('rapid tab switching should settle on the last clicked tab', async () => {
    // Fire all four clicks without waiting for aria-selected between them
    await page.getByRole('tab', { name: 'Executive' }).click();
    await page.getByRole('tab', { name: 'Operations' }).click();
    await page.getByRole('tab', { name: 'Customer Metrics' }).click();
    await page.getByRole('tab', { name: 'Overview' }).click();

    // After the dust settles, Overview must be the active tab
    await expect(page.getByRole('tab', { name: 'Overview' }))
      .toHaveAttribute('aria-selected', 'true');
    await overviewPage.verifyOverviewMetrics('en');
  });

  // ── Language persistence ──────────────────────────────────────────────────

  test('Español language should translate the entire tab strip and persist across tabs', async () => {
    await overviewPage.changeLanguage('Español');

    // The whole tab strip must render in Spanish — not just the metric cards
    await expect(page.getByRole('tab', { name: ES_TABS.overview })).toBeVisible();
    await expect(page.getByRole('tab', { name: ES_TABS.executive })).toBeVisible();
    await expect(page.getByRole('tab', { name: ES_TABS.operations })).toBeVisible();
    await expect(page.getByRole('tab', { name: ES_TABS.customerMetrics })).toBeVisible();

    // Navigate between Spanish-named tabs — language switcher must still show Español
    await page.getByRole('tab', { name: ES_TABS.executive }).click();
    await expect(page.getByRole('button', { name: /Español/ })).toBeVisible();

    await page.getByRole('tab', { name: ES_TABS.operations }).click();
    await expect(page.getByRole('button', { name: /Español/ })).toBeVisible();

    // Return to Overview — Spanish metric cards must still be rendered
    await page.getByRole('tab', { name: ES_TABS.overview }).click();
    await overviewPage.verifyOverviewMetrics('es');
  });

  test('language change made on the Executive tab should apply to the whole dashboard', async () => {
    await overviewPage.switchTab('Executive'); // English: 'Executive'
    await overviewPage.changeLanguage('Español');

    // After the switch, navigate using the now-Spanish tab name
    await page.getByRole('tab', { name: ES_TABS.overview }).click();
    // Overview metric cards must be in Spanish
    await overviewPage.verifyOverviewMetrics('es');
  });

  test('switching language three times should reflect the final language state', async () => {
    // EN → ES → EN → ES  (final: Spanish)
    await overviewPage.changeLanguage('Español');
    await overviewPage.changeLanguage('English US');
    await overviewPage.changeLanguage('Español');

    // Only the last switch counts
    await overviewPage.verifyOverviewMetrics('es');
  });

  // ── Filters panel ─────────────────────────────────────────────────────────

  test('Filters panel should open correctly after being closed and reopened', async () => {
    await overviewPage.openFilters();
    await overviewPage.verifyFiltersOpen();

    // Dismiss the panel by clicking a tab (click outside triggers close)
    await page.getByRole('tab', { name: 'Overview' }).click();

    // Reopen — must behave identically on the second interaction
    await overviewPage.openFilters();
    await overviewPage.verifyFiltersOpen();
  });

  // ── Direct URL navigation ─────────────────────────────────────────────────

  test('directly navigating to /dashboard/overview should load the page correctly', async () => {
    // Simulate a user pasting the URL directly while already authenticated
    await page.goto('/dashboard');
    await overviewPage.goto();

    await overviewPage.verifyOverviewLoaded();
    await overviewPage.verifyOverviewMetrics('en');
  });
});
