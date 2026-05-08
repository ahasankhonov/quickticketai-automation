import { Page, expect, Locator } from '@playwright/test';

type Lang = 'English US' | 'Español';
type View = 'Card' | 'Table';

export class AdminProjectsPage {
  constructor(private page: Page) {}

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

  // View radio names translate with the language (Card → Vista de tarjetas, Table → Vista de tabla)
  async switchView(view: View) {
    const namePattern = view === 'Card'
      ? /card|vista de tarjetas/i
      : /table|vista de tabla/i;
    await this.page.getByRole('radio', { name: namePattern }).click();
    await expect(this.page.getByRole('radio', { name: namePattern })).toBeChecked();
  }

  async changeLanguage(to: Lang) {
    const from: Lang = to === 'English US' ? 'Español' : 'English US';
    const fromButton = this.page.getByRole('button', { name: new RegExp(from) }).first();
    // Already in target language — nothing to do
    try {
      await fromButton.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      return;
    }
    await fromButton.click();
    await this.page.getByRole('menuitem', { name: new RegExp(to) }).click();
    // Confirm the switch took effect before continuing
    await expect(this.page.getByRole('button', { name: new RegExp(to) }).first()).toBeVisible();
  }

  async changePageSize(size: number) {
    const combobox = this.page.getByRole('combobox').first();
    const isVisible = await combobox.isVisible();
    if (!isVisible) {
      return; // pagination control absent when there are no rows
    }
    await combobox.click();
    await this.page.getByRole('option', { name: String(size) }).click();
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
    // The submit button text collides with the page-level "+ Add/Agregar project" button.
    // Click the LAST matching button in the DOM — portals render dialogs at the end of body.
    await this.page.evaluate(() => {
      const all = [...document.querySelectorAll('button')];
      const submit = all.reverse().find(b => /agregar proyecto|add project/i.test(b.textContent ?? ''));
      (submit as HTMLElement | undefined)?.click();
    });
  }

  // Each row has a kebab/action-menu button — click it, then choose Edit from the dropdown
  async editProject(rowIndex: number, newName: string) {
    const rows = this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
    await rows.nth(rowIndex).getByRole('button').last().click();
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).click();
    const nameInput = this.getProjectNameInput();
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.getSaveButton().click();
  }

  // Each row has a kebab/action-menu button — click it, then choose Delete from the dropdown
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
    await expect(this.page.getByText('Project updated successfully').first()).toBeVisible();
  }

  async verifyDeleteSuccess() {
    await expect(this.page.getByText('Project deleted successfully').first()).toBeVisible();
  }

  // Locators — language-agnostic where the UI translates

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
