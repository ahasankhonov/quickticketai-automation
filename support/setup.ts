import { Browser, BrowserContext, Page } from '@playwright/test';

/** Path where the admin auth session is persisted between runs. */
export const ADMIN_AUTH = 'playwright/.auth/admin.json';

/** Path where the manager auth session is persisted between runs. */
export const MANAGER_AUTH = 'playwright/.auth/manager.json';

/** Path where the technician auth session is persisted between runs. */
export const TECHNICIAN_AUTH = 'playwright/.auth/technician.json';

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

export async function createManagerContext(
  browser: Browser
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState: MANAGER_AUTH });
  const page = await context.newPage();
  await page.goto('/dashboard');
  return { context, page };
}

export async function createTechnicianContext(
  browser: Browser
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState: TECHNICIAN_AUTH });
  const page = await context.newPage();
  await page.goto('/dashboard');
  return { context, page };
}
