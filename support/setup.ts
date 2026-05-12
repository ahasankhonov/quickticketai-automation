import { Browser, BrowserContext, Page } from '@playwright/test';

/** Path where the admin auth session is persisted between runs. */
export const ADMIN_AUTH = 'playwright/.auth/admin.json';

/**
 * Creates a fresh browser context pre-loaded with the admin auth state and
 * navigates to /dashboard so the sidebar is always available.
 *
 * Use in `test.beforeAll` for every admin spec:
 *
 *   test.beforeAll(async ({ browser }) => {
 *     ({ page } = await createAdminContext(browser));
 *     myPage = new AdminXxxPage(page);
 *   });
 */
export async function createAdminContext(
  browser: Browser
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState: ADMIN_AUTH });
  const page = await context.newPage();
  await page.goto('/dashboard');
  return { context, page };
}
