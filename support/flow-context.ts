import { Browser, BrowserContext, Page } from '@playwright/test';
import {
  ADMIN_AUTH,
  MANAGER_AUTH,
  TECHNICIAN_AUTH,
} from './setup';

/** A single role's browser context paired with its active page. */
export interface RoleContext {
  context: BrowserContext;
  page: Page;
}

/** All three role contexts bundled together for cross-role flow specs. */
export interface MultiRoleContexts {
  admin: RoleContext;
  manager: RoleContext;
  technician: RoleContext;
}

/**
 * Opens three browser contexts — one per role — each pre-loaded with the
 * corresponding stored auth state.  A page is created in each context and
 * navigated to /dashboard so the sidebar and session cookies are ready.
 *
 * Use in `test.beforeAll` of cross-role flow specs:
 *
 *   test.beforeAll(async ({ browser }) => {
 *     contexts = await createMultiRoleContexts(browser);
 *   });
 */
export async function createMultiRoleContexts(
  browser: Browser
): Promise<MultiRoleContexts> {
  const [adminContext, managerContext, technicianContext] = await Promise.all([
    browser.newContext({ storageState: ADMIN_AUTH }),
    browser.newContext({ storageState: MANAGER_AUTH }),
    browser.newContext({ storageState: TECHNICIAN_AUTH }),
  ]);

  const [adminPage, managerPage, technicianPage] = await Promise.all([
    adminContext.newPage(),
    managerContext.newPage(),
    technicianContext.newPage(),
  ]);

  await Promise.all([
    adminPage.goto('/dashboard'),
    managerPage.goto('/dashboard'),
    technicianPage.goto('/dashboard'),
  ]);

  return {
    admin:      { context: adminContext,      page: adminPage },
    manager:    { context: managerContext,    page: managerPage },
    technician: { context: technicianContext, page: technicianPage },
  };
}

/**
 * Closes all three role contexts.  Call in `test.afterAll`:
 *
 *   test.afterAll(async () => {
 *     await closeRoleContexts(contexts);
 *   });
 */
export async function closeRoleContexts(
  contexts: MultiRoleContexts
): Promise<void> {
  await Promise.all([
    contexts.admin.context.close(),
    contexts.manager.context.close(),
    contexts.technician.context.close(),
  ]);
}
