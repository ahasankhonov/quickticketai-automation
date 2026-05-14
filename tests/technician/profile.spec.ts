import { test, expect, Page } from '@playwright/test';
import { TechnicianProfilePage } from '../../pages/technician/profile.page';
import { createTechnicianContext } from '../../support/setup';

test.describe.serial('Technician — Profile', () => {
  let page: Page;
  let profilePage: TechnicianProfilePage;

  const ts = Date.now();
  const updatedName = `E2E Tech ${ts}`;

  test.beforeAll(async ({ browser }) => {
    ({ page } = await createTechnicianContext(browser));
    profilePage = new TechnicianProfilePage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to profile via sidebar and verify loaded', async () => {
    await profilePage.gotoViaSidebar();
    await profilePage.verifyLoaded();
  });

  test('should display profile info labels', async () => {
    await profilePage.verifyProfileInfo();
  });

  test('should click Edit and show form fields', async () => {
    await profilePage.openEdit();
    await expect(page.locator('input[name="fullname"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Save changes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
  });

  test('should fill a new name and save successfully', async () => {
    await profilePage.fillName(updatedName);
    await profilePage.saveChanges();
    await profilePage.verifyUpdateSuccess();
  });

  test('should show the updated name on the profile', async () => {
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 8000 });
  });

  test('should click Edit then Cancel and close the profile panel', async () => {
    // Profile panel closes after saving — re-open before testing Cancel
    await profilePage.gotoViaSidebar();
    await profilePage.openEdit();
    await profilePage.cancelEdit();
    // Cancel closes the profile panel entirely — verify we returned to job tickets page
    await expect(page.getByRole('button', { name: 'Create Job Ticket', exact: true })).toBeVisible();
  });

  test('should display the company label', async () => {
    await expect(page.getByText(/company/i).first()).toBeVisible();
  });

  test('should switch to Español and show Spanish save label in edit mode', async () => {
    await profilePage.changeLanguage('Español');
    await profilePage.gotoViaSidebar();
    await profilePage.openEdit();
    await expect(
      page.getByRole('button', { name: /Guardar cambios/i })
    ).toBeVisible();
  });

  test('should switch back to English US', async () => {
    await profilePage.cancelEdit();
    await profilePage.changeLanguage('English US');
    await profilePage.gotoViaSidebar();
    await profilePage.verifyLoaded();
  });
});
