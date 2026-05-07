import { Page, expect } from '@playwright/test';

type Lang = 'English US' | 'Español';

export class AdminQuickClerkPage {
  constructor(private page: Page) {}

  // Navigates to QuickClerk by clicking the sidebar button (from any dashboard page)
  async gotoViaSidebar() {
    await this.page.getByRole('button', { name: 'QuickClerk' }).click();
    await expect(this.page).toHaveURL(/\/dashboard\/clerkAI/);
    // QuickClerk has persistent SSE/streaming connections — wait for the input instead of networkidle
    await expect(this.page.getByPlaceholder('Ask a question...')).toBeVisible();
  }

  // Direct URL navigation — session ID is assigned by the app
  async goto() {
    await this.page.goto('/dashboard/clerkAI');
    await expect(this.page.getByPlaceholder('Ask a question...')).toBeVisible();
  }

  // Confirms the QuickClerk page loaded by URL and chat input presence
  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/clerkAI/);
    await expect(this.page.getByPlaceholder('Ask a question...')).toBeVisible();
  }

  // Starts a new chat session.
  // When history exists but the user is viewing one, New Chat is disabled — click a history
  // entry to re-enable it. When no history exists at all, send a minimal message first so
  // the app creates a session and enables New Chat.
  async startNewChat() {
    const btn = this.page.getByRole('button', { name: 'New Chat' });
    if (await btn.isDisabled()) {
      const historyItems = this.page.getByRole('button', { name: /^Chat - \d+/i });
      if (await historyItems.count() > 0) {
        // Load an existing chat to re-activate the New Chat button
        await historyItems.last().click();
      } else {
        // No history at all — send a message to create the first session
        await this.page.getByRole('textbox', { name: 'Ask a question...' }).click();
        await this.page.getByRole('button').filter({ hasText: /^$/ }).nth(3).click();
      }
      await expect(btn).toBeEnabled({ timeout: 15_000 });
    }
    await btn.click();
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
