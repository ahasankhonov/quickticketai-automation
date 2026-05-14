import { expect } from '@playwright/test';
import { AdminJobTicketsPage, PartDetails, ToolDetails } from '../admin/job-tickets.page';

export class TechnicianJobTicketsPage extends AdminJobTicketsPage {

  // Technician form is a full page (not a modal) — parts and tools are inline, no dialog wrapper
  override async addPart(part: PartDetails): Promise<void> {
    await this.page.getByRole('button', { name: 'Add Part' }).click();
    await this.page.getByRole('textbox', { name: 'Search parts by name' }).fill(part.name);
    // Technician cannot create new parts — only select existing ones
    await this.page.getByRole('button', { name: new RegExp(part.name, 'i') }).first().click();
    // Fill inline fields (values may already be pre-populated from existing part data)
    const unitInput = this.page.getByRole('textbox', { name: 'e.g. pcs, ft, box' });
    if (await unitInput.isVisible().catch(() => false)) {
      await unitInput.fill(part.unit);
    }
    const qtyInput = this.page.getByPlaceholder('0', { exact: true }).first();
    if (await qtyInput.isVisible().catch(() => false)) {
      await qtyInput.fill(String(part.quantity));
    }
    if (part.description) {
      const desc = this.page.getByRole('textbox', { name: /Add a description or notes/i }).first();
      if (await desc.isVisible().catch(() => false)) {
        await desc.fill(part.description);
      }
    }
  }

  override async addTool(tool: ToolDetails): Promise<void> {
    await this.page.getByRole('button', { name: 'Add Tool & Equipment' }).click();
    await this.page.getByRole('textbox', { name: 'Search tools and equipment by' }).fill(tool.name);
    // Technician cannot create new equipment — only select existing ones
    await this.page.getByRole('button', { name: new RegExp(tool.name, 'i') }).first().click();
    if (tool.description) {
      const desc = this.page.getByRole('textbox', { name: /Add a description or notes/i }).last();
      if (await desc.isVisible().catch(() => false)) {
        await desc.fill(tool.description);
      }
    }
  }

  override async verifyTableHeaders(lang: 'en' | 'es'): Promise<void> {
    if (lang === 'en') {
      await expect(this.page.getByRole('columnheader', { name: 'Ticket ID' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Job Ticket Date' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Company' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Location' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Description' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Total Hours' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
    } else {
      await expect(this.page.getByRole('columnheader', { name: 'ID del Ticket' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /Fecha del Ticket/i }).first()).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Empresa' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Ubicación' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Estado' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Descripción' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Horas totales' })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: 'Acciones' })).toBeVisible();
    }
  }

  async openVoiceTicket(): Promise<void> {
    await this.page.getByRole('button', { name: /Create job ticket with voice/i }).click();
  }

  async verifyVoiceConnected(): Promise<void> {
    await expect(this.page.getByText(/Connected/i)).toBeVisible({ timeout: 10000 });
  }

  async closeVoiceModal(): Promise<void> {
    await this.page.getByRole('button', { name: /Close/i }).click();
  }
}
