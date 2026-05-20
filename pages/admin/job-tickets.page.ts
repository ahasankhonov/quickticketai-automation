import { expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface TemplateDetails {
  nameEn: string;
  nameEs?: string;
}

export interface TechInviteDetails {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
  level: string;
  revenueRate?: number;
  technicianRate?: number;
}

export interface PartDetails {
  name: string;
  unit: string;
  quantity: number;
  price: number;
  cost?: number;
  description?: string;
}

export interface ToolDetails {
  name: string;
  rate?: number;
  cost?: number;
  description?: string;
}

export class AdminJobTicketsPage extends BasePage {

  async gotoViaSidebar() {
    await this.page.getByRole('button', { name: 'Job Tickets' }).click();
    await expect(this.page).toHaveURL(/\/dashboard\/job-tickets/);
    await expect(this.getCreateTicketButton()).toBeVisible();
  }

  async goto() {
    await this.page.goto('/dashboard/job-tickets');
    await expect(this.getCreateTicketButton()).toBeVisible();
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/job-tickets/);
    await expect(this.getCreateTicketButton()).toBeVisible();
  }

  async verifyStatCards(lang: 'en' | 'es') {
    if (lang === 'en') {
      await expect(this.page.getByText('Total Tickets')).toBeVisible();
      await expect(this.page.getByText('Assigned to Invoice')).toBeVisible();
      await expect(this.page.getByText('Not Assigned')).toBeVisible();
    } else {
      await expect(this.page.getByText('Total de Tickets')).toBeVisible();
      await expect(this.page.getByText('Asignados a Factura')).toBeVisible();
      await expect(this.page.getByText('Sin Asignar')).toBeVisible();
    }
  }

  async verifyTableHeaders(lang: 'en' | 'es') {
    if (lang === 'en') {
      await expect(this.page.getByRole('columnheader', { name: 'Ticket ID' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Job Ticket Date' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Company' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Technician' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Time Logged' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
    } else {
      await expect(this.page.getByRole('columnheader', { name: 'ID del Ticket' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /Fecha del Ticket/i }).first()).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Empresa' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Técnico' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Estado' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Tiempo Registrado' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Acciones' })).toBeVisible();
    }
  }

  // ── Template creation (within Create Job Ticket form) ─────────────────────

  async createTemplate(details: TemplateDetails) {
    const templateInput = this.page.getByPlaceholder('Select template...');
    await templateInput.fill(details.nameEn);
    await this.page.getByRole('button', { name: `Add new template "${details.nameEn}"` }).click();
    await this.page.getByRole('textbox', { name: 'Enter template name' }).first().fill(details.nameEn);
    if (details.nameEs) {
      await this.page.getByRole('textbox', { name: 'Enter template name' }).nth(1).fill(details.nameEs);
    }
    await this.page.getByRole('button', { name: 'Add Field' }).click();
    await this.page.getByRole('button', { name: 'Text' }).click();
    await this.page.getByRole('menuitem', { name: 'Checkbox' }).click();
    await this.page.getByRole('textbox', { name: 'Enter field label' }).first().fill('Completed');
    await this.page.getByRole('button', { name: 'Create' }).click();
  }

  async selectTemplate(name: string) {
    const templateInput = this.page.getByPlaceholder('Select template...');
    await templateInput.fill(name);
    await this.page.getByRole('option', { name }).click();
  }

  // ── Ticket creation ────────────────────────────────────────────────────────

  async clickCreateTicket() {
    await this.getCreateTicketButton().click();
  }

  async fillCustomerName(name: string) {
    const input = this.page.getByRole('textbox', { name: 'Enter customer company name' });
    // Wait for the create-ticket form to be fully loaded before any other interaction.
    // clickCreateTicket() only clicks the button; navigation to the form page may still be in flight.
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await this.ensureTemplateSelected();

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchOpt = this.page.getByRole('option', { name: new RegExp(escapedName, 'i') });
    // The STATIC form header has a "+ Add New Company" button (always visible).
    // The dropdown-specific item has a quoted name: 'Add new company "FlowCo ..."' — match that.
    const addNewInDropdown = this.page.getByRole('button', {
      name: new RegExp(`add new company.*"${escapedName}"`, 'i'),
    }).or(this.page.getByRole('option', {
      name: new RegExp(`add new company.*"${escapedName}"`, 'i'),
    })).first();

    await this.typeIntoAutocomplete(input, name);
    // The customer search API takes ~3s to settle. Wait before checking dropdown results.
    await this.page.waitForTimeout(3000);

    // Race between: existing customer option vs "Add new company" dropdown item (quoted name).
    // Use waitFor() (not isVisible()) to properly wait for the async search to resolve.
    const dropdownResult = await Promise.any([
      matchOpt.waitFor({ state: 'visible', timeout: 12000 }).then(() => 'match' as const),
      addNewInDropdown.waitFor({ state: 'visible', timeout: 12000 }).then(() => 'add-new' as const),
    ]).catch(() => null);

    if (dropdownResult === 'match') {
      await matchOpt.click();
    } else if (dropdownResult === 'add-new') {
      // Attempt inline customer creation. If the customer was pre-created (from a prior test step),
      // the dialog returns "already exists" — dismiss it. Either way, after the dialog interaction
      // the second search returns the customer as a role="option" element.
      await addNewInDropdown.click();
      await this.page.waitForTimeout(500);

      const addCustDialog = this.page.getByRole('dialog');
      const dialogInput = addCustDialog.getByRole('textbox').first();
      if (await dialogInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dialogInput.clear();
        await dialogInput.pressSequentially(name, { delay: 40 });
        await this.page.waitForTimeout(300);
      }

      const addCustBtn = addCustDialog.getByRole('button', { name: /Add Customer/i }).last();
      await addCustBtn.scrollIntoViewIfNeeded();
      await addCustBtn.click();

      const closedOnSuccess = await addCustDialog
        .waitFor({ state: 'hidden', timeout: 5000 })
        .then(() => true)
        .catch(() => false);

      if (!closedOnSuccess) {
        const cancelBtn = addCustDialog.getByRole('button', { name: /^Cancel$|^Cancelar$/i });
        await cancelBtn.click({ timeout: 8000 }).catch(async () => {
          await this.page.keyboard.press('Escape');
        });
        await addCustDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      }

      // After the dialog interaction, re-type and wait for the customer to appear in search.
      await this.typeIntoAutocomplete(input, name);
      await this.page.waitForTimeout(3000);
      const found = await matchOpt.waitFor({ state: 'visible', timeout: 12000 })
        .then(() => true).catch(() => false);
      if (found) await matchOpt.click();
    } else {
      // Neither appeared — retry once more
      await this.typeIntoAutocomplete(input, name);
      await this.page.waitForTimeout(3000);
      const found = await matchOpt.waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true).catch(() => false);
      if (found) await matchOpt.click();
    }

    // Auto-select the first available technician — the form requires one.
    await this.autoSelectFirstTechnician();
  }

  private async autoSelectFirstTechnician(): Promise<void> {
    const techDropdown = this.page.locator('div').filter({ hasText: /^Select options\.\.\.$/ }).first();
    const found = await techDropdown.waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true).catch(() => false);
    if (!found) return;

    await techDropdown.click();
    await this.page.waitForTimeout(300);

    // The technician panel is a Radix Popover (data-radix-popper-content-wrapper) containing
    // plain <button> elements — NOT role="option" — one per technician.
    const panel = this.page.locator('[data-radix-popper-content-wrapper]').last();
    const firstTech = panel.locator('button').first();
    const clicked = await firstTech.waitFor({ state: 'visible', timeout: 5000 })
      .then(async () => { await firstTech.click(); return true; })
      .catch(() => false);

    if (!clicked) await this.page.keyboard.press('Escape');
    else await this.page.keyboard.press('Escape');
  }

  private async ensureTemplateSelected(): Promise<void> {
    // The template input has accessible name "Select template..." in modal forms but
    // "Template" (from the <label>) in full-page forms — match by placeholder to cover both.
    const templateInput = this.page.getByPlaceholder('Select template...');
    const tplVisible = await templateInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!tplVisible) return;

    // Already has a value — treat as selected
    const current = await templateInput.inputValue().catch(() => '');
    if (current) return;

    // Phase 1: find and select any existing template by trying short search terms.
    // Wait for "Searching..." to resolve before checking for options.
    for (const term of ['a', 'e', 't']) {
      await templateInput.fill(term);
      const opt = this.page.getByRole('option')
        .filter({ hasNot: this.page.getByText(/add new template/i) })
        .first();
      const found = await opt.waitFor({ state: 'visible', timeout: 4000 })
        .then(() => true).catch(() => false);
      if (!found) continue;

      const tName = (await opt.innerText().catch(() => '')).trim();
      if (!tName) continue;

      await templateInput.fill(tName);
      await this.page.getByRole('option', { name: tName })
        .click({ timeout: 4000 })
        .catch(async () => {
          const byText = this.page.getByRole('option').filter({ hasText: tName }).first();
          await byText.click({ timeout: 2000 }).catch(() => {});
        });
      await this.page.waitForTimeout(800);
      return;
    }

    // Phase 2: no existing template found — create one
    const tplName = `E2E${Date.now() % 9999}`;
    await this.createTemplate({ nameEn: tplName });
    await this.page.waitForTimeout(800);
    await this.selectTemplate(tplName);
    await this.page.waitForTimeout(1200);
  }

  private async typeIntoAutocomplete(input: import('@playwright/test').Locator, text: string) {
    await input.click();
    // Ctrl+A then Delete clears the field while keeping React synthetic events flowing
    // (fill('') bypasses React's onChange, causing autocomplete to miss keystrokes)
    await input.press('Control+a');
    await input.press('Delete');
    await this.page.waitForTimeout(100);
    await input.pressSequentially(text, { delay: 50 });
    await this.page.waitForTimeout(500);
  }

  async inviteTechnician(tech: TechInviteDetails) {
    await this.page.getByRole('button', { name: 'Invite New Technician' }).click();
    await this.page.getByRole('button', { name: 'Create profile' }).click();
    await this.page.getByRole('textbox', { name: 'Type name here...' }).fill(tech.name);
    await this.page.getByRole('textbox', { name: 'Type email here...' }).fill(tech.email);
    const phoneField = this.page.getByRole('textbox', { name: /\(234\)|phone/i });
    await phoneField.click();
    await phoneField.pressSequentially(tech.phone ?? this.validPhone());
    await this.page.getByRole('textbox', { name: 'Type password here...' }).fill(tech.password);

    await this.page.getByRole('button', { name: 'New role' }).click();
    await this.page.getByRole('textbox', { name: 'Type name here...' }).last().fill(tech.role);
    await this.page.getByRole('button', { name: 'Add Technician Role' }).click();
    await this.page.getByRole('button', { name: 'Choose technician role' }).click();
    await this.page.getByRole('menuitem', { name: tech.role }).click();

    await this.page.getByRole('button', { name: 'New level' }).click();
    await this.page.getByRole('textbox', { name: 'Type name here...' }).last().fill(tech.level);
    await this.page.getByRole('button', { name: 'Add Technician Level' }).click();
    await this.page.getByRole('button', { name: 'Choose technician level' }).click();
    await this.page.getByRole('menuitem', { name: tech.level }).click();

    await this.page.getByRole('button', { name: 'New rate sheet' }).click();
    await this.page.getByPlaceholder('Type rate sheet here...').fill(String(tech.revenueRate ?? 1));
    await this.page.getByPlaceholder('Type technician rate here...').fill(String(tech.technicianRate ?? 1));
    await this.page.getByRole('button', { name: 'Add Item' }).click();

    await this.page.getByRole('button', { name: 'Invite Technician' }).click();
  }

  async assignTechnicianToDropdown(techName: string) {
    const selectDiv = this.page.locator('div').filter({ hasText: /^Select options\.\.\.$/ }).first();
    if (!await selectDiv.isVisible()) return;
    await selectDiv.click();
    await this.page.getByRole('button', { name: techName }).first().click();
    await this.page.keyboard.press('Escape');
  }

  async addPart(part: PartDetails) {
    await this.page.getByRole('button', { name: 'Add Part' }).click();
    await this.page.getByRole('textbox', { name: 'Search parts by name' }).fill(part.name);

    const createBtn = this.page.getByRole('button', { name: new RegExp(`Create new part "${part.name}"`) });
    const existingBtn = this.page.getByRole('button', { name: new RegExp(part.name) }).first();
    try {
      await createBtn.waitFor({ state: 'visible', timeout: 5000 });
      await createBtn.click();
    } catch {
      await existingBtn.click();
    }

    // A dialog opens regardless of whether the part is new or existing.
    // The dialog's accessible name is the part name, not "Add Part", so detect by checking
    // for the "Add" confirmation button rather than relying on the dialog's name attribute.
    const anyDialog = this.page.getByRole('dialog');
    const addConfirmBtn = anyDialog.getByRole('button', { name: /^Add$/ });
    const dialogVisible = await addConfirmBtn.isVisible({ timeout: 3000 }).catch(() => false);

    await this.page.getByRole('textbox', { name: 'e.g. pcs, ft, box' }).fill(part.unit);
    // Quantity: scoped to dialog when one is present, otherwise page-level
    const qtyInput = dialogVisible
      ? anyDialog.getByPlaceholder('0', { exact: true })
      : this.page.getByPlaceholder('0', { exact: true });
    await qtyInput.fill(String(part.quantity));
    // Dialog case: price/cost are at nth(2)/nth(3) among all page-level '0.00' placeholders.
    // Inline case (no dialog): only 2 '0.00' inputs exist → nth(0)/nth(1).
    const priceNth = dialogVisible ? 2 : 0;
    const costNth  = dialogVisible ? 3 : 1;
    await this.page.getByPlaceholder('0.00').nth(priceNth).fill(String(part.price));
    if (part.cost !== undefined) {
      await this.page.getByPlaceholder('0.00').nth(costNth).fill(String(part.cost));
    }
    if (part.description) {
      await this.page.getByRole('textbox', { name: 'Add a description (optional)' }).fill(part.description);
    }
    if (dialogVisible) {
      await addConfirmBtn.click();
      await anyDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  }

  async addTool(tool: ToolDetails) {
    await this.page.getByRole('button', { name: 'Add Tool & Equipment' }).click();
    await this.page.getByRole('textbox', { name: 'Search tools and equipment by' }).fill(tool.name);

    const createBtn = this.page.getByRole('button', { name: new RegExp(`Create new equipment "${tool.name}"`) });
    const existingBtn = this.page.getByRole('button', { name: new RegExp(tool.name) }).first();
    try {
      await createBtn.waitFor({ state: 'visible', timeout: 5000 });
      await createBtn.click();
    } catch {
      await existingBtn.click();
    }

    if (tool.rate !== undefined) {
      await this.page.getByPlaceholder('Optional').nth(2).fill(String(tool.rate));
    }
    if (tool.cost !== undefined) {
      await this.page.getByPlaceholder('Optional').nth(3).fill(String(tool.cost));
    }
    if (tool.description) {
      await this.page.getByRole('textbox', { name: 'Add a description (optional)' }).fill(tool.description);
    }
    await this.page.getByRole('button', { name: 'Add' }).click();
  }

  async fillTotalHours(hours: number) {
    const field = this.page.getByPlaceholder('Total Hours');
    if (await field.isVisible({ timeout: 5000 }).catch(() => false)) {
      await field.fill(String(hours));
    }
  }

  async fillPerTechHours(workHours: number, travelHours: number) {
    await this.page.getByRole('button', { name: 'Per technician' }).click();
    await this.page.getByPlaceholder('Enter work hours').fill(String(workHours));
    await this.page.getByPlaceholder('Enter travel hours').fill(String(travelHours));
  }

  async fillNotes(notes: string) {
    const field = this.page.getByRole('textbox', { name: 'Add a description or notes' }).first();
    if (await field.isVisible({ timeout: 5000 }).catch(() => false)) {
      await field.fill(notes);
    }
  }

  async submitCreateTicket() {
    await this.page.getByRole('button', { name: 'Create Ticket' }).click();
    await this.page.waitForTimeout(2000);
  }

  async verifyTicketCreated() {
    await expect(
      this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') }).first()
    ).toBeVisible({ timeout: 15000 });
  }

  // ── List actions ───────────────────────────────────────────────────────────

  // Override: job-tickets uses a named "Open menu" button, not just the last button in the row
  override async openRowMenu(rowIndex: number) {
    const rows = this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
    await rows.nth(rowIndex).getByRole('button', { name: /Open menu|Abrir menú/i }).click();
  }

  async editFirstTicket() {
    await this.openRowMenu(0);
    await this.page.getByRole('menuitem', { name: /^Edit$|^Editar$/i }).click();
  }

  async submitEdit() {
    await this.page.getByRole('button', { name: /Submit changes|Enviar cambios/i }).dispatchEvent('click');
  }

  async deleteFirstTicket() {
    await this.openRowMenu(0);
    await this.page.getByRole('menuitem', { name: /^Delete$|^Eliminar$/i }).click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  async cancelDeleteFirstTicket() {
    await this.openRowMenu(0);
    await this.page.getByRole('menuitem', { name: /^Delete$|^Eliminar$/i }).click();
    await this.page.keyboard.press('Escape');
  }

  async exportTickets() {
    await this.page.getByRole('button', { name: 'Export' }).click();
  }

  async searchTickets(term: string) {
    await this.page.getByRole('textbox', { name: /Search tickets|Buscar tickets/i }).fill(term);
  }

  async clearSearch() {
    await this.page.getByRole('textbox', { name: /Search tickets|Buscar tickets/i }).clear();
  }

  // ── Locators ───────────────────────────────────────────────────────────────

  getCreateTicketButton(): Locator {
    return this.page.getByRole('button', { name: /^Create Job Ticket$|^Crear Ticket de Trabajo$/i });
  }
}
