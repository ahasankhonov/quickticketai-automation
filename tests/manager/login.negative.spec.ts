import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/admin/login.page';

const VALID_EMAIL = 'e2emgr445036@example.com';
const VALID_PASSWORD = 'qwerty123';

test.describe.serial('Manager Login — Negative & Edge Cases', () => {
  let loginPage: AdminLoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new AdminLoginPage(page);
    await loginPage.gotoLogin();
  });

  test('should show Invalid Credentials with correct email but wrong password', async ({ page }) => {
    await loginPage.attemptLogin(VALID_EMAIL, 'WrongPassword!99');
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.getErrorMessage()).toBeVisible();
  });

  test('should show Invalid Credentials with an unregistered email address', async ({ page }) => {
    await loginPage.attemptLogin('ghost.user.99@notexist.com', VALID_PASSWORD);
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.getErrorMessage()).toBeVisible();
  });

  test('should disable Sign In button when email field is empty', async () => {
    await loginPage.getPasswordInput().fill(VALID_PASSWORD);
    await expect(loginPage.getSignInButton()).toBeDisabled();
  });

  test('should disable Sign In button when password field is empty', async () => {
    await loginPage.getEmailInput().fill(VALID_EMAIL);
    await expect(loginPage.getSignInButton()).toBeDisabled();
  });

  test('should disable Sign In button when both fields are empty', async () => {
    await expect(loginPage.getSignInButton()).toBeDisabled();
  });

  test('should show format validation error for email missing the @ symbol', async ({ page }) => {
    await loginPage.attemptLogin('notavalidemail.com', VALID_PASSWORD);
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.getEmailValidationMessage()).toBeVisible();
  });

  test('should disable Sign In button with whitespace-only password', async ({ page }) => {
    await loginPage.getEmailInput().fill(VALID_EMAIL);
    await loginPage.getPasswordInput().fill('          ');
    await expect(loginPage.getSignInButton()).toBeDisabled();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle an excessively long email without crashing', async ({ page }) => {
    const longEmail = `${'a'.repeat(245)}@${'b'.repeat(245)}.com`;
    await loginPage.getEmailInput().fill(longEmail);
    await loginPage.getPasswordInput().fill(VALID_PASSWORD);
    const btn = loginPage.getSignInButton();
    if (!await btn.isDisabled()) {
      await btn.click();
    }
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.getSignInButton()).toBeVisible();
  });

  test('should not execute script injected into the email field', async ({ page }) => {
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await loginPage.getEmailInput().fill('<script>alert("xss")</script>');
    await loginPage.getPasswordInput().fill(VALID_PASSWORD);

    const btn = loginPage.getSignInButton();
    if (!await btn.isDisabled()) {
      await btn.click();
    }

    expect(dialogTriggered).toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });
});
