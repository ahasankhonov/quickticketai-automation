import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/admin/login.page';

const VALID_EMAIL = 'coxav22257@inreur.com';
const VALID_PASSWORD = 'qwerty123';

test.describe.serial('Admin Login — Negative & Edge Cases', () => {
  let loginPage: AdminLoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new AdminLoginPage(page);
    await loginPage.gotoLogin();
  });

  // ── Wrong credentials ─────────────────────────────────────────────────────
  // These inputs are structurally valid so the button is enabled and the form
  // is submitted — the server rejects them and shows "Invalid Credentials".

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

  // ── Client-side disabled button ───────────────────────────────────────────
  // The app disables Sign In when required inputs are missing or invalid,
  // preventing any server round-trip for these cases.

  test('should disable Sign In button when email field is empty', async () => {
    await loginPage.getPasswordInput().fill(VALID_PASSWORD);
    // Email is empty — button must be disabled before the user can submit
    await expect(loginPage.getSignInButton()).toBeDisabled();
  });

  test('should disable Sign In button when password field is empty', async () => {
    await loginPage.getEmailInput().fill(VALID_EMAIL);
    // Password is empty — button must be disabled
    await expect(loginPage.getSignInButton()).toBeDisabled();
  });

  test('should disable Sign In button when both fields are empty', async () => {
    // Page just loaded — both fields are blank, button must be disabled immediately
    await expect(loginPage.getSignInButton()).toBeDisabled();
  });

  test('should show format validation error for email missing the @ symbol', async ({ page }) => {
    // Button stays enabled — app validates format on submit, not on input
    await loginPage.attemptLogin('notavalidemail.com', VALID_PASSWORD);
    await expect(page).toHaveURL(/\/login/);
    // Client-side format check fires before the server is called
    await expect(loginPage.getEmailValidationMessage()).toBeVisible();
  });

  test('should disable Sign In button with whitespace-only password', async ({ page }) => {
    await loginPage.getEmailInput().fill(VALID_EMAIL);
    await loginPage.getPasswordInput().fill('          ');
    // Spaces are not a valid password — button must remain disabled
    await expect(loginPage.getSignInButton()).toBeDisabled();
    // Page must not have navigated away
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Boundary & robustness ─────────────────────────────────────────────────

  test('should handle an excessively long email without crashing', async ({ page }) => {
    // 500-char email — tests input length limits and server-side handling
    const longEmail = `${'a'.repeat(245)}@${'b'.repeat(245)}.com`;
    await loginPage.getEmailInput().fill(longEmail);
    await loginPage.getPasswordInput().fill(VALID_PASSWORD);
    // If the button is enabled, attempt the submit; either way the app must remain stable
    const btn = loginPage.getSignInButton();
    if (!await btn.isDisabled()) {
      await btn.click();
    }
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.getSignInButton()).toBeVisible();
  });

  // ── Security ──────────────────────────────────────────────────────────────

  test('should not execute script injected into the email field', async ({ page }) => {
    let dialogTriggered = false;
    // Register listener before the action so no alert can slip through
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

    // No JS dialog must fire — confirms input is treated as data, not executable code
    expect(dialogTriggered).toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });
});
