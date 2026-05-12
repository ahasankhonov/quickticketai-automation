import { expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

type InventoryTab = 'Equipment' | 'Parts';

export interface EquipmentDetails {
  name: string;
  rate?: number;
  cost?: number;
  description?: string;
}

export interface PartDetails {
  name: string;
  unit: string;
  quantity: number;
  price: number;
  cost?: number;
  description?: string;
}

export class AdminInventoryPage extends BasePage {

  async gotoViaSidebar() {
    await this.page.getByRole('button', { name: /^Inventory$|^Inventario$/ }).click();
    await expect(this.page).toHaveURL(/\/dashboard\/inventory/);
    await expect(this.page.getByText(/Inventory|Inventario/i).first()).toBeVisible();
  }

  async goto() {
    await this.page.goto('/dashboard/inventory');
    await expect(this.page.getByText(/Inventory|Inventario/i).first()).toBeVisible();
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/inventory/);
    await expect(this.page.getByText(/Inventory|Inventario/i).first()).toBeVisible();
  }

  async switchTab(tab: InventoryTab) {
    const pattern = tab === 'Equipment' ? /^Equipment$|^Equipos?$/ : /^Parts$|^Partes?$/;
    await this.page.getByRole('tab', { name: pattern }).click();
  }

  async verifyEquipmentTableHeaders(lang: 'en' | 'es') {
    if (lang === 'en') {
      await expect(this.page.getByRole('columnheader', { name: /^Name$/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /hourly rate|rate/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /hourly cost|cost/i })).toBeVisible();
    } else {
      await expect(this.page.getByRole('columnheader', { name: /Nombre/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /Tarifa por hora/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /Costo por hora/i })).toBeVisible();
    }
  }

  async verifyPartsTableHeaders(lang: 'en' | 'es') {
    if (lang === 'en') {
      await expect(this.page.getByRole('columnheader', { name: /^Name$/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /unit/i })).toBeVisible();
    } else {
      await expect(this.page.getByRole('columnheader', { name: /Nombre/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /Unidad/i })).toBeVisible();
    }
  }

  // ── Equipment ──────────────────────────────────────────────────────────────

  async addEquipment(equipment: EquipmentDetails): Promise<boolean> {
    await this.getAddEquipmentButton().click();
    await this.page.getByPlaceholder(/Type a name|Escriba un nombre/i).fill(equipment.name);
    if (equipment.rate !== undefined) {
      await this.page.getByPlaceholder(/^Optional$|^Opcional$/i).first().fill(String(equipment.rate));
    }
    if (equipment.cost !== undefined) {
      await this.page.getByPlaceholder(/^Optional$|^Opcional$/i).nth(1).fill(String(equipment.cost));
    }
    if (equipment.description) {
      await this.page.getByPlaceholder(/Add a description/i).fill(equipment.description);
    }
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    await dialog.getByRole('button', { name: /^Add$|^Agregar$/i }).dispatchEvent('click');
    try {
      await expect(
        this.page.getByText(/equipment added|equipo.*agre|already exists|ya existe/i).first()
      ).toBeVisible({ timeout: 5000 });
    } catch { /* no toast in time */ }
    return !await this.page.getByText(/already exists|ya existe/i).isVisible();
  }

  async editEquipment(rowIndex: number, newName: string) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).click();
    const nameInput = this.page.getByRole('textbox', { name: /name/i }).first();
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.page.getByRole('button', { name: /save|guardar/i }).last().click();
  }

  async deleteEquipment(rowIndex: number, confirm: boolean) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /delete|eliminar/i }).click();
    if (confirm) {
      await this.page.getByRole('button', { name: /confirm|yes|delete|eliminar|sí/i }).last().click();
    } else {
      await this.page.getByRole('button', { name: /cancel|no|cancelar/i }).click();
    }
  }

  async verifyEquipmentAddSuccess() {
    await this.verifyToast(/equipment added|equipo.*agre/i);
  }

  async verifyEquipmentUpdateSuccess() {
    await this.verifyToast(/equipment updated|equipo.*actualiz/i);
  }

  async verifyEquipmentDeleteSuccess() {
    await this.verifyToast(/equipment deleted|equipo.*elimin/i);
  }

  // ── Parts ──────────────────────────────────────────────────────────────────

  async addPart(part: PartDetails): Promise<boolean> {
    await this.getAddPartButton().click();
    await this.page.getByPlaceholder(/Type a name|Escriba un nombre/i).fill(part.name);
    await this.page.getByPlaceholder(/e\.g\. pcs, ft, box/i).fill(part.unit);
    await this.page.getByPlaceholder('0', { exact: true }).fill(String(part.quantity));
    await this.page.getByPlaceholder('0.00').first().fill(String(part.price));
    if (part.cost !== undefined) {
      await this.page.getByPlaceholder('0.00').nth(1).fill(String(part.cost));
    }
    if (part.description) {
      await this.page.getByPlaceholder(/Add a description/i).fill(part.description);
    }
    await this.page.getByRole('button', { name: /^Add$/i }).click();
    try {
      await expect(
        this.page.getByText(/part added|parte.*agre|already exists|ya existe/i).first()
      ).toBeVisible({ timeout: 5000 });
    } catch { /* no toast */ }
    return !await this.page.getByText(/already exists|ya existe/i).isVisible();
  }

  async editPart(rowIndex: number, newName: string) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).click();
    const nameInput = this.page.getByRole('textbox', { name: /name/i }).first();
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.page.getByRole('button', { name: /save|guardar/i }).last().click();
  }

  async verifyPartAddSuccess() {
    await this.verifyToast(/part added|parte.*agre/i);
  }

  async verifyPartUpdateSuccess() {
    await this.verifyToast(/part updated|parte.*actualiz/i);
  }

  async search(term: string) {
    await this.page.getByRole('textbox', { name: /search|buscar/i }).fill(term);
  }

  async clearSearch() {
    await this.page.getByRole('textbox', { name: /search|buscar/i }).clear();
  }

  // ── Locators ───────────────────────────────────────────────────────────────

  getAddEquipmentButton(): Locator {
    return this.page.getByRole('button', { name: /add equipment|agregar equipo/i });
  }

  getAddPartButton(): Locator {
    return this.page.getByRole('button', { name: /add part|agregar parte/i });
  }
}
