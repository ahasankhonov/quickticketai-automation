import { test, expect, Page } from '@playwright/test';
import { AdminTemplatesPage } from '../../pages/admin/templates.page';
import { createManagerContext } from '../../support/setup';

const RUN_ID = Date.now().toString().slice(-6);

test.describe.serial('Manager — Templates', () => {
  let page: Page;
  let templatesPage: AdminTemplatesPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    templatesPage = new AdminTemplatesPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to Templates via the sidebar button', async () => {
    await templatesPage.gotoViaSidebar();
    await templatesPage.verifyLoaded();
  });

  test('should display English table column headers', async () => {
    await templatesPage.verifyTableHeaders('en');
  });

  test('should switch to Español and show Spanish column headers', async () => {
    await templatesPage.changeLanguage('Español');
    await templatesPage.verifyTableHeaders('es');
  });

  test('should switch back to English US', async () => {
    await templatesPage.changeLanguage('English US');
    await templatesPage.verifyTableHeaders('en');
  });

  test('should add a template with a Text field and show success toast', async () => {
    await templatesPage.addTemplate(
      {
        nameEn: `Mgr Template ${RUN_ID}`,
        nameEs: `Plantilla Mgr ${RUN_ID}`,
        role:   `Mgr Role ${RUN_ID}`,
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

  test('should display the newly created template in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should edit the first template name', async () => {
    await templatesPage.editTemplate(0, `Mgr Template Edited ${RUN_ID}`);
  });

  test('should cancel a delete and keep the template in the list', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await dataRows.first().waitFor();
    const rowsBefore = await page.getByRole('row').count();
    await templatesPage.deleteTemplate(0, false);
    await expect(page.getByRole('row')).toHaveCount(rowsBefore);
  });

  test('should confirm a delete and show the delete success toast', async () => {
    await templatesPage.deleteTemplate(0, true);
    await templatesPage.verifyDeleteSuccess();
  });
});
