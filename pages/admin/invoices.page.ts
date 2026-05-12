import { expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface InvoiceDetails {
  projectId: string;
  poNumber?: string;
  dueDays?: '30' | '45' | '60';
  customerName?: string;
  contactName?: string;
  location?: string;
  description?: string;
}

export interface PartDetails {
  name: string;
  unit: string;
  quantity: number;
  price: number;
  cost?: number;
  lineItemQty?: number;
  description?: string;
}

export class AdminInvoicesPage extends BasePage {

  async gotoViaSidebar() {
    await this.page.getByRole('button', { name: /^Invoices$|^Facturas$/ }).click();
    await expect(this.page).toHaveURL(/\/dashboard\/invoices/);
    await expect(this.getCreateInvoiceButton()).toBeVisible();
  }

  async goto() {
    await this.page.goto('/dashboard/invoices');
    await expect(this.getCreateInvoiceButton()).toBeVisible();
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/invoices/);
    await expect(this.getCreateInvoiceButton()).toBeVisible();
  }

  async verifyStatCards(lang: 'en' | 'es') {
    if (lang === 'en') {
      await expect(this.page.getByText('Total Invoices')).toBeVisible();
      await expect(this.page.getByText('Draft Invoices')).toBeVisible();
      await expect(this.page.getByText('Submitted Invoices')).toBeVisible();
    } else {
      await expect(this.page.getByText(/Facturas Totales|Total.*Factura/i).first()).toBeVisible();
      await expect(this.page.getByText(/Facturas.*Borrador|Borrador.*Factura/i).first()).toBeVisible();
      await expect(this.page.getByText(/Facturas Enviadas|Enviadas.*Factura/i).first()).toBeVisible();
    }
  }

  async verifyTableHeaders(lang: 'en' | 'es') {
    if (lang === 'en') {
      await expect(this.page.getByRole('columnheader', { name: 'Invoice Number' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Created On' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Created By' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Customer' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Total Amount' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    } else {
      await expect(this.page.getByRole('columnheader', { name: 'Número de factura' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Creado el' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Creado por' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Cliente' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Monto total' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Estado' })).toBeVisible();
    }
  }

  async openFilters() {
    await this.page.getByRole('button', { name: /Filters|Filtros/i }).click();
  }

  async applyFilters() {
    await this.page.getByRole('button', { name: /Apply Filter/i }).click();
  }

  // ── Invoice creation ───────────────────────────────────────────────────────

  async clickCreateInvoice() {
    await this.getCreateInvoiceButton().click();
  }

  async fillInvoiceDetails(details: InvoiceDetails) {
    await this.page.getByRole('textbox', { name: 'Enter project ID' }).fill(details.projectId);
    await this.page.locator('div').filter({ hasText: /^Select Date$/ }).click();
    await this.page.getByRole('button', { name: /Today/i }).first().click();
    if (details.poNumber !== undefined) {
      await this.page.getByRole('textbox', { name: 'Enter PO/AFE number' }).fill(details.poNumber);
    }
    if (details.dueDays) {
      await this.page.locator('#dueDate').selectOption(details.dueDays);
    }
    if (details.customerName !== undefined) {
      await this.page.getByRole('textbox', { name: 'Enter customer company name' }).fill(details.customerName);
    }
    if (details.contactName !== undefined) {
      await this.page.getByRole('textbox', { name: 'Enter Name...' }).fill(details.contactName);
    }
    if (details.location !== undefined) {
      await this.page.getByRole('textbox', { name: 'Enter location...' }).fill(details.location);
    }
    if (details.description !== undefined) {
      await this.page.getByRole('textbox', { name: /Type project description/i }).fill(details.description);
    }
  }

  async addJobTickets() {
    await this.page.getByRole('button', { name: 'Add Items' }).click();
    await this.page.getByRole('button', { name: /Add Job/i }).click();
    const dataRows = this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
    if (await dataRows.count() > 0) {
      await dataRows.first().getByRole('checkbox').check();
    }
    await this.page.getByRole('button', { name: 'Apply' }).click();
  }

  async searchAndCancelJobTickets(searchTerm: string) {
    await this.page.getByRole('button', { name: 'Add Items' }).click();
    await this.page.getByRole('button', { name: /Add Job/i }).click();
    await this.page.getByRole('textbox', { name: 'Search...' }).fill(searchTerm);
    await this.page.getByRole('button', { name: 'Cancel' }).last().click();
  }

  async addPart(part: PartDetails) {
    await this.page.getByRole('button', { name: 'Add Items' }).click();
    await this.page.getByRole('button', { name: /Parts.*Materials/i }).click();
    const searchInput = this.page.getByRole('textbox', { name: /Search Inventory/i }).last();
    await searchInput.fill(part.name);
    const createBtn = this.page.getByRole('button', { name: new RegExp(`Create new part "${part.name}"`) });
    const existingBtn = this.page.getByRole('button', { name: new RegExp(part.name) }).first();
    try {
      await createBtn.waitFor({ state: 'visible', timeout: 5000 });
      await createBtn.click();
    } catch {
      await existingBtn.click();
    }
    const dialog = this.page.getByRole('dialog', { name: 'Add Part' });
    await this.page.getByRole('textbox', { name: 'e.g. pcs, ft, box' }).fill(part.unit);
    await dialog.getByPlaceholder('0', { exact: true }).fill(String(part.quantity));
    await this.page.getByPlaceholder('0.00').first().fill(String(part.price));
    await this.page.getByPlaceholder('0.00').nth(1).fill(String(part.cost ?? 0));
    if (part.description) {
      await this.page.getByRole('textbox', { name: /Add a description/i }).fill(part.description);
    }
    await dialog.getByRole('button', { name: 'Add' }).click();
    if (part.lineItemQty !== undefined) {
      await this.page.getByRole('textbox', { name: 'Enter', exact: true }).last()
        .fill(String(part.lineItemQty));
    }
  }

  async submitInvoice(email: string, discount: number) {
    await this.getSubmitInvoiceButton().click();
    await this.page.getByRole('textbox', { name: 'Type email here...' }).fill(email);
    await this.page.locator('form').getByPlaceholder('0').fill(String(discount));
    await this.page.getByRole('button', { name: 'Submit', exact: true }).click();
  }

  async dismissSavePromptIfPresent() {
    const btn = this.page.getByRole('button', { name: "Don't Save" });
    try {
      await btn.waitFor({ state: 'visible', timeout: 2000 });
      await btn.click();
    } catch { /* no prompt */ }
  }

  async verifyInvoiceSubmitted() {
    await expect(
      this.page.getByRole('row').filter({ hasText: /Submitted/i }).first()
    ).toBeVisible({ timeout: 10000 });
  }

  // ── Locators ───────────────────────────────────────────────────────────────

  getCreateInvoiceButton(): Locator {
    return this.page.getByRole('button', { name: /Create Invoice|Crear Factura/i });
  }

  getSubmitInvoiceButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit Invoice' });
  }

  getFiltersButton(): Locator {
    return this.page.getByRole('button', { name: /Filters/i });
  }
}
