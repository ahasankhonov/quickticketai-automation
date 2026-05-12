import { expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

type View = 'Card' | 'Table';

export class AdminProjectsPage extends BasePage {

  async gotoViaSidebar() {
    await this.page.getByRole('button', { name: /^Projects$|^Proyectos$/ }).click();
    await expect(this.page).toHaveURL(/\/dashboard\/projects/);
    await expect(this.getAddProjectButton()).toBeVisible();
  }

  async goto() {
    await this.page.goto('/dashboard/projects');
    await expect(this.getAddProjectButton()).toBeVisible();
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/projects/);
    await expect(this.getAddProjectButton()).toBeVisible();
  }

  async verifyStatCards(lang: 'en' | 'es') {
    if (lang === 'en') {
      await expect(this.page.getByText('Total Projects')).toBeVisible();
      await expect(this.page.getByText('Draft Projects')).toBeVisible();
      await expect(this.page.getByText('Submitted Projects')).toBeVisible();
    } else {
      await expect(this.page.getByText('Proyectos Totales')).toBeVisible();
      await expect(this.page.getByText('Proyectos Borrador')).toBeVisible();
      await expect(this.page.getByText('Proyectos Enviados')).toBeVisible();
    }
  }

  async verifyTableHeaders() {
    await expect(this.page.getByRole('columnheader', { name: /Project code|Código del proyecto/i })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: /Project name|Nombre del proyecto/i })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: /Created On|Creado el/i })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: /Created By|Creado por/i })).toBeVisible();
  }

  async switchView(view: View) {
    const pattern = view === 'Card' ? /card|vista de tarjetas/i : /table|vista de tabla/i;
    await this.page.getByRole('radio', { name: pattern }).click();
    await expect(this.page.getByRole('radio', { name: pattern })).toBeChecked();
  }

  async verifyProjectInList(name: string) {
    await expect(
      this.page.getByRole('row').filter({ hasText: name }).first()
    ).toBeVisible({ timeout: 10_000 });
  }

  async addProject(name: string, code: string) {
    await this.getAddProjectButton().click();
    await this.getProjectNameInput().fill(name);
    await this.getProjectCodeInput().fill(code);
    // The dialog's submit button shares the same name as the page-level add button;
    // the dialog always renders last in the DOM — dispatchEvent bypasses any overlay.
    const submitBtn = this.page.getByRole('button', { name: /add project|agregar proyecto/i }).last();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.dispatchEvent('click');
  }

  async editProject(rowIndex: number, newName: string) {
    const rows = this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
    await rows.nth(rowIndex).getByRole('button').last().click();
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).click();
    await this.getProjectNameInput().clear();
    await this.getProjectNameInput().fill(newName);
    await this.getSaveButton().click();
  }

  async deleteProject(rowIndex: number, confirm: boolean) {
    const rows = this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
    await rows.nth(rowIndex).getByRole('button').last().click();
    await this.page.getByRole('menuitem', { name: /delete|eliminar/i }).click();
    if (confirm) {
      await this.page.getByRole('button', { name: /confirm|yes|delete|eliminar|sí/i }).last().click();
    } else {
      await this.page.getByRole('button', { name: /cancel|no|cancelar/i }).click();
    }
  }

  async verifyAddSuccess(lang: 'en' | 'es') {
    const msg = lang === 'es' ? 'Proyecto agregado exitosamente' : 'Project added successfully';
    await expect(this.page.getByText(msg).first()).toBeVisible();
  }

  async verifyUpdateSuccess() {
    await this.verifyToast(/Project updated successfully/);
  }

  async verifyDeleteSuccess() {
    await this.verifyToast(/Project deleted successfully/);
  }

  // ── Locators ───────────────────────────────────────────────────────────────

  getAddProjectButton(): Locator {
    return this.page.getByRole('button', { name: /add project|agregar proyecto/i });
  }

  getProjectNameInput(): Locator {
    return this.page.getByRole('textbox', { name: /project name|nombre del proyecto/i });
  }

  getProjectCodeInput(): Locator {
    return this.page.getByRole('textbox', { name: /project code|código del proyecto/i });
  }

  getSaveButton(): Locator {
    return this.page.getByRole('button', { name: /save|submit|add|guardar|agregar/i });
  }
}
