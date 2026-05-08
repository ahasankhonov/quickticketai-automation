import { Page, expect, Locator } from '@playwright/test';

type Lang = 'English US' | 'Español';

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
  price: number;      // selling price (first 0.00 field)
  cost?: number;      // internal cost (second 0.00 field) — defaults to 0
  lineItemQty?: number;
  description?: string;
}

export class AdminInvoicesPage {
  constructor(private page: Page) {}

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

  async changeLanguage(to: Lang) {
    const from: Lang = to === 'English US' ? 'Español' : 'English US';
    const fromButton = this.page.getByRole('button', { name: new RegExp(from) }).first();
    try {
      await fromButton.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      return;
    }
    await fromButton.click();
    await this.page.getByRole('menuitem', { name: new RegExp(to) }).click();
    await expect(this.page.getByRole('button', { name: new RegExp(to) }).first()).toBeVisible();
  }

  async openFilters() {
    await this.page.getByRole('button', { name: /Filters|Filtros/i }).click();
  }

  async applyFilters() {
    await this.page.getByRole('button', { name: /Apply Filter/i }).click();
  }

  async changePageSize(size: number) {
    await this.page.getByRole('combobox').click();
    await this.page.getByRole('option', { name: String(size) }).click();
  }

  // ── Invoice creation ───────────────────────────────────────────────────────

  async clickCreateInvoice() {
    await this.getCreateInvoiceButton().click();
  }

  async fillInvoiceDetails(details: InvoiceDetails) {
    await this.page.getByRole('textbox', { name: 'Enter project ID' }).fill(details.projectId);

    // Open the date picker and pick today
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

  // Opens Add Job Ticket dialog, selects first available ticket, and applies.
  // If no tickets exist the dialog closes with nothing selected.
  async addJobTickets() {
    await this.page.getByRole('button', { name: 'Add Items' }).click();
    await this.page.getByRole('button', { name: /Add Job/i }).click();
    const dataRows = this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
    const count = await dataRows.count();
    if (count > 0) {
      await dataRows.first().getByRole('checkbox').check();
    }
    await this.page.getByRole('button', { name: 'Apply' }).click();
  }

  // Opens Add Job Ticket dialog, searches for a term, then cancels.
  async searchAndCancelJobTickets(searchTerm: string) {
    await this.page.getByRole('button', { name: 'Add Items' }).click();
    await this.page.getByRole('button', { name: /Add Job/i }).click();
    await this.page.getByRole('textbox', { name: 'Search...' }).fill(searchTerm);
    await this.page.getByRole('button', { name: 'Cancel' }).last().click();
  }

  // Opens Add Part dialog, creates a new part if not found, fills details, and adds it.
  async addPart(part: PartDetails) {
    await this.page.getByRole('button', { name: 'Add Items' }).click();
    await this.page.getByRole('button', { name: /Parts.*Materials/i }).click();

    const searchInput = this.page.getByRole('textbox', { name: /Search Inventory/i }).last();
    await searchInput.fill(part.name);

    // Wait for search results — either a "Create new part" button or an existing-part button
    const createBtn  = this.page.getByRole('button', { name: new RegExp(`Create new part "${part.name}"`) });
    const existingBtn = this.page.getByRole('button', { name: new RegExp(`${part.name}`) }).first();
    try {
      await createBtn.waitFor({ state: 'visible', timeout: 5000 });
      await createBtn.click();
    } catch {
      // Part exists in inventory — click the search result to open its edit form
      await existingBtn.click();
    }

    // After selecting/creating a part the "Add Part" dialog shows the detail form
    const dialog = this.page.getByRole('dialog', { name: 'Add Part' });
    // Unit field matches by placeholder since it has no separate label
    await this.page.getByRole('textbox', { name: 'e.g. pcs, ft, box' }).fill(part.unit);
    await dialog.getByPlaceholder('0', { exact: true }).fill(String(part.quantity));
    await this.page.getByPlaceholder('0.00').first().fill(String(part.price));
    await this.page.getByPlaceholder('0.00').nth(1).fill(String(part.cost ?? 0));
    if (part.description) {
      await this.page.getByRole('textbox', { name: /Add a description/i }).fill(part.description);
    }
    await dialog.getByRole('button', { name: 'Add' }).click();

    // After the dialog closes, update this line item's quantity on the invoice form
    if (part.lineItemQty !== undefined) {
      await this.page.getByRole('textbox', { name: 'Enter', exact: true }).last()
        .fill(String(part.lineItemQty));
    }
  }

  // Opens the Submit Invoice modal, fills email + discount, and submits.
  async submitInvoice(email: string, discount: number) {
    await this.getSubmitInvoiceButton().click();
    await this.page.getByRole('textbox', { name: 'Type email here...' }).fill(email);
    await this.page.locator('form').getByPlaceholder('0').fill(String(discount));
    await this.page.getByRole('button', { name: 'Submit', exact: true }).click();
  }

  // Some submit flows (invoice missing required items) trigger a "Don't Save" prompt.
  // Clicking it cancels the submit and keeps the user on the create form to continue editing.
  async dismissSavePromptIfPresent() {
    const btn = this.page.getByRole('button', { name: "Don't Save" });
    try {
      await btn.waitFor({ state: 'visible', timeout: 2000 });
      await btn.click();
    } catch {
      // No prompt appeared — submission likely succeeded
    }
  }

  // Verifies a submitted invoice exists in the list — more reliable than a short-lived toast.
  async verifyInvoiceSubmitted() {
    await expect(
      this.page.getByRole('row').filter({ hasText: /Submitted/i }).first()
    ).toBeVisible({ timeout: 10000 });
  }

  async openRowMenu(rowIndex: number) {
    const rows = this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
    await rows.nth(rowIndex).getByRole('button').last().click();
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
