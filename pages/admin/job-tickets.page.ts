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
    const templateInput = this.page.getByRole('textbox', { name: 'Select template...' });
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
    const templateInput = this.page.getByRole('textbox', { name: 'Select template...' });
    await templateInput.fill(name);
    await this.page.getByRole('option', { name }).click();
  }

  // ── Ticket creation ────────────────────────────────────────────────────────

  async clickCreateTicket() {
    await this.getCreateTicketButton().click();
  }

  async fillCustomerName(name: string) {
    await this.page.getByRole('textbox', { name: 'Enter customer company name' }).fill(name);
    const addCompanyBtn = this.page.getByRole('button', { name: `Add new company "${name}"` });
    try {
      await addCompanyBtn.waitFor({ state: 'visible', timeout: 3000 });
      await addCompanyBtn.click();
      await this.page.getByRole('button', { name: 'Add Customer' }).click();
    } catch {
      await this.page.getByRole('option').first().click();
    }
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

    const dialog = this.page.getByRole('dialog', { name: 'Add Part' });
    await this.page.getByRole('textbox', { name: 'e.g. pcs, ft, box' }).fill(part.unit);
    await dialog.getByPlaceholder('0', { exact: true }).fill(String(part.quantity));
    await this.page.getByPlaceholder('0.00').nth(2).fill(String(part.price));
    if (part.cost !== undefined) {
      await this.page.getByPlaceholder('0.00').nth(3).fill(String(part.cost));
    }
    if (part.description) {
      await this.page.getByRole('textbox', { name: 'Add a description (optional)' }).fill(part.description);
    }
    await this.page.getByRole('button', { name: 'Add' }).click();
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
    await this.page.getByPlaceholder('Total Hours').fill(String(hours));
  }

  async fillPerTechHours(workHours: number, travelHours: number) {
    await this.page.getByRole('button', { name: 'Per technician' }).click();
    await this.page.getByPlaceholder('Enter work hours').fill(String(workHours));
    await this.page.getByPlaceholder('Enter travel hours').fill(String(travelHours));
  }

  async fillNotes(notes: string) {
    await this.page.getByRole('textbox', { name: 'Add a description or notes' }).first().fill(notes);
  }

  async submitCreateTicket() {
    await this.page.getByRole('button', { name: 'Create Ticket' }).click();
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
    await this.page.getByRole('button', { name: /Submit changes|Enviar cambios/i }).click();
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
