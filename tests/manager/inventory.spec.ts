import { test, expect, Page } from '@playwright/test';
import { AdminInventoryPage } from '../../pages/admin/inventory.page';
import { createManagerContext } from '../../support/setup';

const RUN_ID = Date.now().toString().slice(-6);

test.describe.serial('Manager — Inventory', () => {
  let page: Page;
  let inventoryPage: AdminInventoryPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createManagerContext(browser));
    inventoryPage = new AdminInventoryPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to Inventory via the sidebar button', async () => {
    await inventoryPage.gotoViaSidebar();
    await inventoryPage.verifyLoaded();
  });

  test('should display Equipment tab headers in English', async () => {
    await inventoryPage.switchTab('Equipment');
    await inventoryPage.verifyEquipmentTableHeaders('en');
  });

  test('should switch to Español and show Spanish column headers on Equipment tab', async () => {
    await inventoryPage.changeLanguage('Español');
    await inventoryPage.verifyEquipmentTableHeaders('es');
  });

  test('should switch back to English US on Equipment tab', async () => {
    await inventoryPage.changeLanguage('English US');
    await inventoryPage.verifyEquipmentTableHeaders('en');
  });

  test('should add a new equipment item and show success toast', async () => {
    const added = await inventoryPage.addEquipment({
      name:        `E2E Mgr Equipment ${RUN_ID}`,
      rate:        50,
      cost:        30,
      description: 'Automated E2E manager test equipment',
    });
    expect(added).toBe(true);
    await inventoryPage.verifyEquipmentAddSuccess();
  });

  test('should display newly added equipment in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should search for equipment and find a result', async () => {
    await inventoryPage.search('E2E');
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
    await inventoryPage.clearSearch();
  });

  test('should edit the first equipment item and show update success toast', async () => {
    await inventoryPage.editEquipment(0, `E2E Mgr Equipment Edited ${RUN_ID}`);
    await inventoryPage.verifyEquipmentUpdateSuccess();
  });

  test('should cancel equipment delete and keep the row', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await dataRows.first().waitFor();
    const rowsBefore = await page.getByRole('row').count();
    await inventoryPage.deleteEquipment(0, false);
    await expect(page.getByRole('row')).toHaveCount(rowsBefore);
  });

  test('should confirm equipment delete and show success toast', async () => {
    await inventoryPage.deleteEquipment(0, true);
    await inventoryPage.verifyEquipmentDeleteSuccess();
  });

  test('should switch to the Parts tab and display headers in English', async () => {
    await inventoryPage.switchTab('Parts');
    await inventoryPage.verifyPartsTableHeaders('en');
  });

  test('should switch to Español and show Spanish Parts tab column headers', async () => {
    await inventoryPage.changeLanguage('Español');
    await inventoryPage.verifyPartsTableHeaders('es');
  });

  test('should switch back to English US on Parts tab', async () => {
    await inventoryPage.changeLanguage('English US');
    await inventoryPage.verifyPartsTableHeaders('en');
  });

  test('should add a new part and show success toast', async () => {
    const added = await inventoryPage.addPart({
      name:        `E2E Mgr Part ${RUN_ID}`,
      unit:        'pcs',
      quantity:    10,
      price:       25,
      cost:        15,
      description: 'Automated E2E manager test part',
    });
    expect(added).toBe(true);
    await inventoryPage.verifyPartAddSuccess();
  });

  test('should display newly added part in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should edit the first part and show update success toast', async () => {
    await inventoryPage.editPart(0, `E2E Mgr Part Edited ${RUN_ID}`);
    await inventoryPage.verifyPartUpdateSuccess();
  });
});
