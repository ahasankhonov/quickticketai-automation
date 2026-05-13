import { test, expect, Page } from '@playwright/test';
import { ManagerOverviewPage } from '../../pages/manager/overview.page';
import { createManagerContext } from '../../support/setup';

const ES_TABS = {
  overview:        'Resumen',
  executive:       'Ejecutivo',
  operations:      'Operaciones',
  customerMetrics: 'Métricas de Cliente',
} as const;

test.describe.serial('Manager Overview — Edge Cases', () => {
  let page: Page;
  let overviewPage: ManagerOverviewPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    overviewPage = new ManagerOverviewPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    await overviewPage.goto();
    await overviewPage.switchTab('Overview');
    await overviewPage.changeLanguage('English US');
  });

  // ── Tab behaviour ─────────────────────────────────────────────────────────

  test('clicking an already-active tab should not change state or throw errors', async () => {
    await overviewPage.switchTab('Overview');
    await overviewPage.verifyOverviewLoaded();
    await overviewPage.verifyOverviewMetrics('en');
  });

  test('rapid tab switching should settle on the last clicked tab', async () => {
    await page.getByRole('tab', { name: 'Executive' }).click();
    await page.getByRole('tab', { name: 'Operations' }).click();
    await page.getByRole('tab', { name: 'Customer Metrics' }).click();
    await page.getByRole('tab', { name: 'Overview' }).click();

    await expect(page.getByRole('tab', { name: 'Overview' }))
      .toHaveAttribute('aria-selected', 'true');
    await overviewPage.verifyOverviewMetrics('en');
  });

  // ── Language persistence ──────────────────────────────────────────────────

  test('Español language should translate the entire tab strip and persist across tabs', async () => {
    await overviewPage.changeLanguage('Español');

    await expect(page.getByRole('tab', { name: ES_TABS.overview })).toBeVisible();
    await expect(page.getByRole('tab', { name: ES_TABS.executive })).toBeVisible();
    await expect(page.getByRole('tab', { name: ES_TABS.operations })).toBeVisible();
    await expect(page.getByRole('tab', { name: ES_TABS.customerMetrics })).toBeVisible();

    await page.getByRole('tab', { name: ES_TABS.executive }).click();
    await expect(page.getByRole('button', { name: /Español/ })).toBeVisible();

    await page.getByRole('tab', { name: ES_TABS.operations }).click();
    await expect(page.getByRole('button', { name: /Español/ })).toBeVisible();

    await page.getByRole('tab', { name: ES_TABS.overview }).click();
    await overviewPage.verifyOverviewMetrics('es');
  });

  test('language change made on the Executive tab should apply to the whole dashboard', async () => {
    await overviewPage.switchTab('Executive');
    await overviewPage.changeLanguage('Español');

    await page.getByRole('tab', { name: ES_TABS.overview }).click();
    await overviewPage.verifyOverviewMetrics('es');
  });

  test('switching language three times should reflect the final language state', async () => {
    await overviewPage.changeLanguage('Español');
    await overviewPage.changeLanguage('English US');
    await overviewPage.changeLanguage('Español');

    await overviewPage.verifyOverviewMetrics('es');
  });

  // ── Filters panel ─────────────────────────────────────────────────────────

  test('Filters panel should open correctly after being closed and reopened', async () => {
    await overviewPage.openFilters();
    await overviewPage.verifyFiltersOpen();

    await page.getByRole('tab', { name: 'Overview' }).click();

    await overviewPage.openFilters();
    await overviewPage.verifyFiltersOpen();
  });

  // ── Direct URL navigation ─────────────────────────────────────────────────

  test('directly navigating to /dashboard/overview should load the page correctly', async () => {
    await page.goto('/dashboard');
    await overviewPage.goto();

    await overviewPage.verifyOverviewLoaded();
    await overviewPage.verifyOverviewMetrics('en');
  });
});
