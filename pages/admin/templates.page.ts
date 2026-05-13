import { expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface TemplateDetails {
  nameEn: string;
  nameEs?: string;
  status?: 'Active' | 'Inactive';
  role?: string;
}

export interface TemplateField {
  type?: 'Text' | 'Checkbox' | 'Number' | 'Date';
  labelEn: string;
  labelEs?: string;
  placeholderEn?: string;
  placeholderEs?: string;
  required?: boolean;
}

export class AdminTemplatesPage extends BasePage {

  async gotoViaSidebar() {
    await this.page.getByRole('button', { name: /^Templates$|^Plantillas$/ }).click();
    await expect(this.page).toHaveURL(/\/dashboard\/job-ticket-templates/);
    await expect(this.getAddTemplateButton()).toBeVisible();
  }

  async goto() {
    await this.page.goto('/dashboard/job-ticket-templates');
    await expect(this.getAddTemplateButton()).toBeVisible();
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/job-ticket-templates/);
    await expect(this.getAddTemplateButton()).toBeVisible();
  }

  async verifyTableHeaders(lang: 'en' | 'es') {
    if (lang === 'en') {
      await expect(this.page.getByRole('columnheader', { name: /template name/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /technician role/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /status/i })).toBeVisible();
    } else {
      await expect(this.page.getByRole('columnheader', { name: /nombre.*plantilla|plantilla/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /rol.*técnic/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /estado/i })).toBeVisible();
    }
  }

  async addTemplate(details: TemplateDetails, field?: TemplateField) {
    await this.getAddTemplateButton().click();

    const nameInputs = this.page.getByRole('textbox', { name: /template name|nombre.*plantilla|enter template name/i });
    await nameInputs.first().fill(details.nameEn);
    if (details.nameEs) {
      await nameInputs.nth(1).fill(details.nameEs);
    }

    if (details.status) {
      const trigger = this.page.getByRole('button', { name: /^Active$|^Inactive$|^Activo$|^Inactivo$/i }).first();
      const currentText = await trigger.textContent();
      if (!new RegExp(details.status, 'i').test(currentText ?? '')) {
        await trigger.click();
        await this.page.locator('[role="listbox"] >> text=' + details.status).first().click()
          .catch(() => this.page.getByText(new RegExp(`^${details.status}$`)).last().click());
      }
    }

    if (details.role) {
      const newRoleBtn = this.page.getByRole('button', { name: /new role|nuevo rol/i });
      if (await newRoleBtn.isVisible()) {
        await newRoleBtn.click();
        const roleModal = this.page.getByRole('dialog').filter({ hasText: /Add Technician Role/i });
        await roleModal.waitFor({ state: 'visible', timeout: 8000 });
        await roleModal.getByRole('textbox').first().fill(details.role);
        await roleModal.getByRole('button', { name: /Add Technician Role/i }).click();
        await roleModal.waitFor({ state: 'hidden', timeout: 10000 });
      } else {
        await this.page.getByRole('button', { name: /choose.*role|seleccionar.*rol/i }).first().click();
        await this.page.getByRole('menuitem', { name: new RegExp(details.role, 'i') }).click();
      }
    }

    if (field) {
      await this.addField(field);
    }

    const createBtn = this.page.getByRole('button', { name: /^create$|^crear$/i });
    await createBtn.dispatchEvent('click');
    // Some sessions (e.g. manager) create the template but leave the dialog open.
    // Click the X button to force-close it; the save already completed on the server.
    try {
      await this.page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 2000 });
    } catch {
      const dialog = this.page.getByRole('dialog');
      await dialog.getByRole('button').first().dispatchEvent('click');
    }
  }

  async addField(field: TemplateField) {
    await this.page.getByRole('button', { name: /add field|agregar campo/i }).click();

    if (field.type && field.type !== 'Text') {
      await this.page.getByRole('button', { name: /^text$|^texto$/i }).click();
      await this.page.getByRole('menuitem', { name: new RegExp(field.type, 'i') }).click();
    }

    const labelInputs = this.page.getByRole('textbox', { name: /field label|etiqueta/i });
    await labelInputs.first().fill(field.labelEn);
    if (field.labelEs) {
      await labelInputs.nth(1).fill(field.labelEs);
    }

    if (field.placeholderEn) {
      const placeholderInputs = this.page.getByRole('textbox', { name: /placeholder/i });
      await placeholderInputs.first().fill(field.placeholderEn);
      if (field.placeholderEs) {
        await placeholderInputs.nth(1).fill(field.placeholderEs);
      }
    }

    if (field.required) {
      const requiredCheckbox = this.page.getByRole('checkbox', { name: /required|requerido/i });
      if (!await requiredCheckbox.isChecked()) {
        await requiredCheckbox.check();
      }
    }
  }

  async verifyAddSuccess() {
    await this.verifyToast(/template.*created|template.*added|plantilla.*creada|plantilla.*agre/i);
  }

  async assignRoleToTemplate(rowIndex: number, roleName: string) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /assign.*role|roles/i }).click();
    const roleOption = this.page.getByRole('checkbox', { name: new RegExp(roleName, 'i') });
    if (await roleOption.isVisible()) {
      await roleOption.check();
    } else {
      await this.page.getByRole('option', { name: new RegExp(roleName, 'i') }).click();
    }
    await this.page.getByRole('button', { name: /save|guardar/i }).last().click();
  }

  async editTemplate(rowIndex: number, newName: string) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).click();
    const nameInput = this.page.getByRole('textbox', { name: /template name|enter template name/i }).first();
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.page.getByRole('button', { name: /save|update|guardar/i }).last().click();
  }

  async deleteTemplate(rowIndex: number, confirm: boolean) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /delete|eliminar/i }).click();
    if (confirm) {
      await this.page.getByRole('button', { name: /confirm|yes|delete|eliminar|sí/i }).last().click();
    } else {
      await this.page.getByRole('button', { name: /cancel|no|cancelar/i }).click();
    }
  }

  async verifyDeleteSuccess() {
    await this.verifyToast(/template.*deleted|template.*elimin|plantilla.*elimin/i);
  }

  async search(term: string) {
    await this.page.getByRole('textbox', { name: /search|buscar/i }).fill(term);
  }

  // ── Locators ───────────────────────────────────────────────────────────────

  getAddTemplateButton(): Locator {
    return this.page.getByRole('button', { name: /add template|agregar plantilla/i });
  }
}
