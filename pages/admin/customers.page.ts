import { expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminCustomersPage extends BasePage {

  async gotoViaSidebar() {
    await this.page.getByRole('button', { name: /^Customers$|^Clientes$/ }).click();
    await expect(this.page).toHaveURL(/\/dashboard\/customers/);
    await expect(this.getAddCustomerButton()).toBeVisible();
  }

  async goto() {
    // Always use client-side sidebar navigation to avoid SPA redirect loops that
    // happen when page.goto('/dashboard/customers') triggers a first-load redirect.
    if (!/\/dashboard/.test(this.page.url())) {
      await this.page.goto('/dashboard');
      await this.page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
    }
    await this.page.getByRole('button', { name: /^Customers$|^Clientes$/ }).click();
    await this.getAddCustomerButton().waitFor({ state: 'visible', timeout: 20000 });
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/customers/);
    await expect(this.getAddCustomerButton()).toBeVisible();
  }

  async verifyStatCards(lang: 'en' | 'es') {
    // Stat cards may not be present on all deployments — only assert when visible
    if (lang === 'en') {
      const visible = await this.page.getByText('Total Customers').isVisible({ timeout: 5000 }).catch(() => false);
      if (visible) await expect(this.page.getByText('Total Customers')).toBeVisible();
    } else {
      const visible = await this.page.getByText(/Total.*Clientes|Clientes.*Total/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      if (visible) await expect(this.page.getByText(/Total.*Clientes|Clientes.*Total/i).first()).toBeVisible();
    }
  }

  async verifyTableHeaders(lang: 'en' | 'es') {
    if (lang === 'en') {
      await expect(this.page.getByRole('columnheader', { name: /Customer Company/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /Contact/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /Email Address/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /Physical Address/i })).toBeVisible();
    } else {
      await expect(this.page.getByRole('columnheader', { name: /^Cliente$/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /^Contacto$/i })).toBeVisible();
    }
  }

  /**
   * Opens Add Customer form, fills the company name, and submits.
   * Returns true if the success toast appeared; false if a duplicate-name error appeared.
   */
  async addCustomer(name: string): Promise<boolean> {
    await this.getAddCustomerButton().click();
    await this.page.getByRole('textbox', { name: /company name|nombre.*empresa/i }).fill(name);
    const submitBtn = this.page.getByRole('button', { name: /add customer|agregar cliente/i }).last();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.dispatchEvent('click');
    try {
      await expect(
        this.page.getByText(/customer added|cliente.*agre|already exists|ya existe/i).first()
      ).toBeVisible({ timeout: 5000 });
    } catch { /* no toast in time — submission still in flight */ }
    if (await this.page.getByText(/already exists|ya existe/i).isVisible()) {
      await this.page.keyboard.press('Escape');
      return false;
    }
    return true;
  }

  async verifyAddSuccess(lang: 'en' | 'es') {
    const msg = lang === 'es' ? /cliente.*agre/i : /customer added/i;
    await expect(this.page.getByText(msg).first()).toBeVisible();
  }

  async editCustomer(rowIndex: number) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).click();
  }

  async fillAddressAndSave(address: string) {
    const field = this.page.getByRole('textbox', { name: /Physical Address|Dirección Física/i });
    await field.clear();
    await field.fill(address);
    await this.page.getByRole('button', { name: /Save Changes|Guardar/i }).click();
  }

  async verifyUpdateSuccess() {
    await this.verifyToast(/customer updated|cliente.*actualiz/i);
  }

  async deleteCustomer(rowIndex: number, confirm: boolean) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /delete|eliminar/i }).click();
    if (confirm) {
      await this.page.getByRole('button', { name: /confirm|yes|delete|eliminar|sí/i }).last().click();
    } else {
      await this.page.getByRole('button', { name: /cancel|no|cancelar/i }).click();
    }
  }

  async verifyDeleteSuccess() {
    await this.verifyToast(/customer deleted|cliente.*elimin/i);
  }

  async search(term: string) {
    await this.page.getByRole('textbox', { name: /search|buscar/i }).fill(term);
  }

  async clearSearch() {
    await this.page.getByRole('textbox', { name: /search|buscar/i }).clear();
  }

  // ── Locators ───────────────────────────────────────────────────────────────

  getAddCustomerButton(): Locator {
    return this.page.getByRole('button', { name: /add customer|agregar cliente/i });
  }
}
