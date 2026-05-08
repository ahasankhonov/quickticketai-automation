import { Page, expect, Locator } from '@playwright/test';

export class AdminLoginPage {
  constructor(private page: Page) {}

  // Navigates to the login page (uses baseURL from playwright.config.ts)
  async gotoLogin() {
    await this.page.goto('/login');
  }

  // Happy-path login — fills credentials and asserts the URL leaves /login
  async login(email: string, password: string) {
    await this.page.getByRole('textbox', { name: 'Email *' }).fill(email);
    await this.page.getByRole('textbox', { name: 'Password *' }).fill(password);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
    await expect(this.page).not.toHaveURL(/\/login/);
  }

  // Fills and submits the form WITHOUT asserting the outcome — use for negative tests.
  // Only clicks if the button is enabled; some input states disable it client-side.
  async attemptLogin(email: string, password: string) {
    await this.page.getByRole('textbox', { name: 'Email *' }).fill(email);
    await this.page.getByRole('textbox', { name: 'Password *' }).fill(password);
    const btn = this.getSignInButton();
    if (!await btn.isDisabled()) {
      await btn.click();
    }
  }

  // Clicks Sign In with no fields filled — button may already be disabled
  async submitEmpty() {
    const btn = this.getSignInButton();
    if (!await btn.isDisabled()) {
      await btn.click();
    }
  }

  // Server-rejection message after a login attempt with wrong/unknown credentials.
  // NOTE: the app renders "Invalid Credintials" — this is a known typo in the product copy.
  getErrorMessage(): Locator {
    return this.page.getByText('Invalid Credintials');
  }

  // Client-side validation message shown when the email format is incorrect
  getEmailValidationMessage(): Locator {
    return this.page.getByText('Please enter a valid email address');
  }

  getEmailInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Email *' });
  }

  getPasswordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Password *' });
  }

  getSignInButton(): Locator {
    return this.page.getByRole('button', { name: 'Sign In' });
  }
}
