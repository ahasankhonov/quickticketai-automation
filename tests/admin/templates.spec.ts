import { test, expect, Page } from '@playwright/test';
import { AdminTemplatesPage } from '../../pages/admin/templates.page';
import { createAdminContext } from '../../support/setup';

const RUN_ID = Date.now().toString().slice(-6);

test.describe.serial('Admin — Templates', () => {
  let page: Page;
  let templatesPage: AdminTemplatesPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createAdminContext(browser));
    templatesPage = new AdminTemplatesPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test('should navigate to Templates via the sidebar button', async () => {
    await templatesPage.gotoViaSidebar();
    await templatesPage.verifyLoaded();
  });

  // ── Table headers ─────────────────────────────────────────────────────────

  test('should display English table column headers', async () => {
    await templatesPage.verifyTableHeaders('en');
  });

  // ── Language ──────────────────────────────────────────────────────────────

  test('should switch to Español and show Spanish column headers', async () => {
    await templatesPage.changeLanguage('Español');
    await templatesPage.verifyTableHeaders('es');
  });

  test('should switch back to English US', async () => {
    await templatesPage.changeLanguage('English US');
    await templatesPage.verifyTableHeaders('en');
  });

  // ── Add template ──────────────────────────────────────────────────────────

  test('should add a template with a Text field and show success toast', async () => {
    await templatesPage.addTemplate(
      {
        nameEn: `E2E Template ${RUN_ID}`,
        nameEs: `Plantilla E2E ${RUN_ID}`,
        role:   `E2E Role ${RUN_ID}`,
      },
      {
        type:          'Text',
        labelEn:       'Completed',
        labelEs:       'Completado',
        placeholderEn: 'Enter value',
        placeholderEs: 'Ingresa el valor',
        required:      true,
      }
    );
    await templatesPage.verifyAddSuccess();
  });

  // ── Template appears in list ──────────────────────────────────────────────

  test('should display the newly created template in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Edit template ─────────────────────────────────────────────────────────

  test('should edit the first template name', async () => {
    await templatesPage.editTemplate(0, `E2E Template Edited ${RUN_ID}`);
  });

  // ── Delete — cancel ───────────────────────────────────────────────────────

  test('should cancel a delete and keep the template in the list', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await dataRows.first().waitFor();
    const rowsBefore = await page.getByRole('row').count();
    await templatesPage.deleteTemplate(0, false);
    await expect(page.getByRole('row')).toHaveCount(rowsBefore);
  });

  // ── Delete — confirm ──────────────────────────────────────────────────────

  test('should confirm a delete and show the delete success toast', async () => {
    await templatesPage.deleteTemplate(0, true);
    await templatesPage.verifyDeleteSuccess();
  });
});
