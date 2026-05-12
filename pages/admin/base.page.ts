import { Page, expect } from '@playwright/test';

export type Lang = 'English US' | 'Español';

/**
 * BasePage — shared behaviour inherited by every admin page object.
 *
 * Centralises the three patterns that were copy-pasted across the suite:
 *   • changeLanguage  (language switcher is global and works the same everywhere)
 *   • openRowMenu     (kebab-menu on any data table row)
 *   • changePageSize  (page-size combobox on any paginated table)
 *   • verifyToast     (success/error toast assertion)
 *   • validPhone      (generate a always-valid US phone for invite forms)
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  // ── Language switcher ──────────────────────────────────────────────────────

  async changeLanguage(to: Lang): Promise<void> {
    const current: Lang = to === 'English US' ? 'Español' : 'English US';
    const trigger = this.page.getByRole('button', { name: new RegExp(current) }).first();
    try {
      await trigger.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      return; // already in target language — no-op
    }
    await trigger.click();
    const item = this.page.getByRole('menuitem', { name: new RegExp(to) });
    await item.waitFor({ state: 'visible', timeout: 5000 });
    await item.dispatchEvent('click');
    await expect(
      this.page.getByRole('button', { name: new RegExp(to) }).first()
    ).toBeVisible({ timeout: 5000 });
  }

  // ── Table row action menu ─────────────────────────────────────────────────

  async openRowMenu(rowIndex: number): Promise<void> {
    const dataRows = this.page
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    await dataRows.nth(rowIndex).getByRole('button').last().click();
  }

  // ── Page size selector ────────────────────────────────────────────────────

  async changePageSize(size: number): Promise<void> {
    const combobox = this.page.getByRole('combobox').first();
    if (!await combobox.isVisible()) return;
    await combobox.click();
    await this.page.getByRole('option', { name: String(size) }).click();
  }

  // ── Toast assertions ──────────────────────────────────────────────────────

  protected async verifyToast(pattern: RegExp, timeout = 8000): Promise<void> {
    await expect(
      this.page.getByText(pattern).first()
    ).toBeVisible({ timeout });
  }

  // ── Test data helpers ─────────────────────────────────────────────────────

  /**
   * Returns a 10-digit phone string that always passes US NXX-NXX-XXXX validation:
   * area code 408, exchange 555, line = last 4 ms digits.
   */
  protected validPhone(extra?: string): string {
    return `408555${(extra ?? String(Date.now())).slice(-4)}`;
  }
}
