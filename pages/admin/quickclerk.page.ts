import { Page, expect } from '@playwright/test';

type Lang = 'English US' | 'Español';

export class AdminQuickClerkPage {
  constructor(private page: Page) {}

  // Navigates to QuickClerk by clicking the sidebar button (from any dashboard page)
  async gotoViaSidebar() {
    await this.page.getByRole('button', { name: 'QuickClerk' }).click();
    await expect(this.page).toHaveURL(/\/dashboard\/clerkAI/);
    await this.page.waitForLoadState('networkidle');
  }

  // Direct URL navigation — session ID is assigned by the app
  async goto() {
    await this.page.goto('/dashboard/clerkAI');
    await this.page.waitForLoadState('networkidle');
  }

  // Confirms the QuickClerk page loaded by URL and chat input presence
  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/clerkAI/);
    await expect(this.page.getByPlaceholder('Ask a question...')).toBeVisible();
  }

  // Starts a new chat session.
  // New Chat is disabled when already viewing an empty session — opens an existing
  // history chat first to re-enable the button before clicking it.
  async startNewChat() {
    const btn = this.page.getByRole('button', { name: 'New Chat' });
    if (await btn.isDisabled()) {
      // Load any older existing chat so the New Chat button becomes active
      await this.page.getByRole('button', { name: /Chat - \d|Template|Ticket|Invoice/i })
        .last()
        .click();
      await expect(btn).toBeEnabled();
    }
    await btn.click();
    await expect(this.page).toHaveURL(/\/dashboard\/clerkAI/);
  }

  // Confirms the UI is in the empty new-chat state
  async verifyNewChatState() {
    await expect(this.page.getByText('Ask our AI anything')).toBeVisible();
  }

  // Opens the language dropdown and selects the target language.
  // Skips silently if already in the requested language.
  async changeLanguage(to: Lang) {
    const current: Lang = to === 'English US' ? 'Español' : 'English US';
    const currentButton = this.page.getByRole('button', { name: new RegExp(current) });
    if (!await currentButton.isVisible()) return;
    await currentButton.click();
    await this.page.getByRole('menuitem', { name: new RegExp(to) }).click();
  }

  // Verifies the Spanish chat input placeholder is visible after switching to Español
  async verifySpanishPlaceholder() {
    await expect(this.page.getByText('Pregunta lo que quieras a').first()).toBeVisible();
  }

  // Verifies the language button reflects the current active language
  async verifyActiveLanguage(lang: Lang) {
    await expect(this.page.getByRole('button', { name: new RegExp(lang) })).toBeVisible();
  }
}
