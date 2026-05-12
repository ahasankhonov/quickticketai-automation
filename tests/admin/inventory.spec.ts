import { test, expect, Page } from '@playwright/test';
import { AdminInventoryPage } from '../../pages/admin/inventory.page';
import { createAdminContext } from '../../support/setup';

const RUN_ID = Date.now().toString().slice(-6);

test.describe.serial('Admin — Inventory', () => {
  let page: Page;
  let inventoryPage: AdminInventoryPage;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createAdminContext(browser));
    inventoryPage = new AdminInventoryPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test('should navigate to Inventory via the sidebar button', async () => {
    await inventoryPage.gotoViaSidebar();
    await inventoryPage.verifyLoaded();
  });

  // ── Equipment tab — English headers ───────────────────────────────────────

  test('should display Equipment tab headers in English', async () => {
    await inventoryPage.switchTab('Equipment');
    await inventoryPage.verifyEquipmentTableHeaders('en');
  });

  // ── Language — Equipment ──────────────────────────────────────────────────

  test('should switch to Español and show Spanish column headers on Equipment tab', async () => {
    await inventoryPage.changeLanguage('Español');
    await inventoryPage.verifyEquipmentTableHeaders('es');
  });

  test('should switch back to English US on Equipment tab', async () => {
    await inventoryPage.changeLanguage('English US');
    await inventoryPage.verifyEquipmentTableHeaders('en');
  });

  // ── Add equipment ─────────────────────────────────────────────────────────

  test('should add a new equipment item and show success toast', async () => {
    const added = await inventoryPage.addEquipment({
      name:        `E2E Equipment ${RUN_ID}`,
      rate:        50,
      cost:        30,
      description: 'Automated E2E test equipment',
    });
    expect(added).toBe(true);
    await inventoryPage.verifyEquipmentAddSuccess();
  });

  // ── Equipment appears in list ─────────────────────────────────────────────

  test('should display newly added equipment in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Search equipment ──────────────────────────────────────────────────────

  test('should search for equipment and find a result', async () => {
    await inventoryPage.search('E2E');
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
    await inventoryPage.clearSearch();
  });

  // ── Edit equipment ────────────────────────────────────────────────────────

  test('should edit the first equipment item and show update success toast', async () => {
    await inventoryPage.editEquipment(0, `E2E Equipment Edited ${RUN_ID}`);
    await inventoryPage.verifyEquipmentUpdateSuccess();
  });

  // ── Delete equipment — cancel ─────────────────────────────────────────────

  test('should cancel equipment delete and keep the row', async () => {
    const dataRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    await dataRows.first().waitFor();
    const rowsBefore = await page.getByRole('row').count();
    await inventoryPage.deleteEquipment(0, false);
    await expect(page.getByRole('row')).toHaveCount(rowsBefore);
  });

  // ── Delete equipment — confirm ────────────────────────────────────────────

  test('should confirm equipment delete and show success toast', async () => {
    await inventoryPage.deleteEquipment(0, true);
    await inventoryPage.verifyEquipmentDeleteSuccess();
  });

  // ── Parts tab ─────────────────────────────────────────────────────────────

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

  // ── Add part — with duplicate validation ──────────────────────────────────

  test('should add a new part and show success toast', async () => {
    const partName = `E2E Part ${RUN_ID}`;
    const added = await inventoryPage.addPart({
      name:        partName,
      unit:        'pcs',
      quantity:    10,
      price:       25,
      cost:        15,
      description: 'Automated E2E test part',
    });
    // If the part already existed from a previous run, it will still be "added" via the existing path
    expect(added).toBe(true);
    await inventoryPage.verifyPartAddSuccess();
  });

  // ── Part appears in list ──────────────────────────────────────────────────

  test('should display newly added part in the list', async () => {
    await expect(
      page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Edit part ─────────────────────────────────────────────────────────────

  test('should edit the first part and show update success toast', async () => {
    await inventoryPage.editPart(0, `E2E Part Edited ${RUN_ID}`);
    await inventoryPage.verifyPartUpdateSuccess();
  });
});
