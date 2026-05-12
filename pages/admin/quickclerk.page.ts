import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminQuickClerkPage extends BasePage {

  async gotoViaSidebar() {
    await this.page.getByRole('button', { name: 'QuickClerk' }).click();
    await expect(this.page).toHaveURL(/\/dashboard\/clerkAI/);
    await expect(this.page.getByPlaceholder('Ask a question...')).toBeVisible();
  }

  async goto() {
    await this.page.goto('/dashboard/clerkAI');
    await expect(this.page.getByPlaceholder('Ask a question...')).toBeVisible();
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/clerkAI/);
    await expect(this.page.getByPlaceholder('Ask a question...')).toBeVisible();
  }

  async startNewChat() {
    const btn = this.page.getByRole('button', { name: 'New Chat' });
    if (await btn.isDisabled()) {
      try {
        await expect(this.page.getByText('Ask our AI anything')).toBeVisible({ timeout: 3_000 });
        return;
      } catch { /* fall through */ }
      const historyItems = this.page.getByRole('button', { name: /^Chat - /i });
      if (await historyItems.count() > 0) {
        await historyItems.last().click();
      } else {
        const textbox = this.page.getByRole('textbox', { name: 'Ask a question...' });
        await textbox.fill('Hello');
        await textbox.press('Enter');
      }
      await expect(btn).toBeEnabled({ timeout: 15_000 });
    }
    await btn.click();
  }

  async verifyNewChatState() {
    await expect(this.page.getByText('Ask our AI anything')).toBeVisible();
  }

  async verifySpanishPlaceholder() {
    await expect(this.page.getByText('Pregunta lo que quieras a').first()).toBeVisible();
  }

  async verifyActiveLanguage(lang: 'English US' | 'Español') {
    await expect(this.page.getByRole('button', { name: new RegExp(lang) })).toBeVisible();
  }
}
