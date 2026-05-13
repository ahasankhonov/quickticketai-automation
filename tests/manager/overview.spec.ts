import { test, expect, Page } from '@playwright/test';
import { ManagerOverviewPage } from '../../pages/manager/overview.page';
import { createManagerContext } from '../../support/setup';

test.describe.serial('Manager — Overview (tab access + data restrictions)', () => {
  let page: Page;
  let overviewPage: ManagerOverviewPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    overviewPage = new ManagerOverviewPage(page);
    await overviewPage.goto();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should load the Overview page and show the Overview tab', async () => {
    await overviewPage.verifyOverviewLoaded();
  });

  // ── Executive tab ──────────────────────────────────────────────────────────

  test('Executive tab should be accessible to the manager', async () => {
    const tab = page.getByRole('tab', { name: 'Executive' });
    await expect(tab).toBeVisible();
    await expect(tab).not.toBeDisabled();
  });

  test('Executive tab should not display restricted admin analytics', async () => {
    await overviewPage.verifyExecutiveTabRestrictedData();
  });

  // ── Operations tab ─────────────────────────────────────────────────────────

  test('Operations tab should be accessible to the manager', async () => {
    await overviewPage.switchTab('Overview');
    const tab = page.getByRole('tab', { name: 'Operations' });
    await expect(tab).toBeVisible();
    await expect(tab).not.toBeDisabled();
  });

  test('Operations tab should not display restricted admin analytics', async () => {
    await overviewPage.verifyOperationsTabRestrictedData();
  });
});
