import { expect } from '@playwright/test';
import { BasePage } from './base.page';

type CompanyTab =
  | 'Technician Roles'
  | 'Technician Levels'
  | 'Rate Sheet'
  | 'Technicians'
  | 'Managers'
  | 'Billing'
  | 'Integrations'
  | 'Activity';

const TAB_ES: Record<CompanyTab, RegExp> = {
  'Technician Roles':  /roles?.*técnic|Technician Roles/i,
  'Technician Levels': /niveles?.*técnic|Technician Levels/i,
  'Rate Sheet':        /hoja.*tarifa|Rate Sheet/i,
  'Technicians':       /^Technicians$|^Técnicos$/,
  'Managers':          /^Managers$|^Gerentes$/,
  'Billing':           /^Billing$|^Facturación$/,
  'Integrations':      /^Integrations$|^Integraciones$/,
  'Activity':          /^Activity$|^Actividad$/,
};

export interface TechnicianInvite {
  name: string;
  email: string;
  password: string;
  phone?: string;
  revenueRate?: number;
  technicianRate?: number;
}

export interface ManagerInvite {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
}

export class AdminCompanyPage extends BasePage {

  async gotoViaSidebar() {
    await this.page.getByRole('button', { name: /company info|información.*empresa/i }).click();
    await expect(this.page).toHaveURL(/\/dashboard\/company/);
  }

  async goto() {
    await this.page.goto('/dashboard/company-info');
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/company/);
  }

  async openTab(tab: CompanyTab) {
    await this.page.getByRole('tab', { name: TAB_ES[tab] }).click();
  }

  // ── Company info (left panel) ──────────────────────────────────────────────

  async verifyCompanyLabels() {
    await expect(this.page.getByText(/^Admin:/i).first()).toBeVisible();
    await expect(this.page.getByText(/^Company:/i).first()).toBeVisible();
  }

  async editCompanyAddress(address: string) {
    await this.page.locator('button[aria-label*="edit" i], button svg').first().click();
    const addressField = this.page.getByRole('textbox', { name: /address|dirección/i }).first();
    await addressField.clear();
    await addressField.fill(address);
    await this.page.getByRole('button', { name: /save|guardar/i }).last().click();
  }

  async verifyCompanyUpdateSuccess() {
    await this.verifyToast(/company.*updated|empresa.*actualiz/i);
  }

  // ── Technician Roles tab ───────────────────────────────────────────────────

  async addTechnicianRole(name: string) {
    await this.page.getByRole('button', { name: /add.*role|agregar.*rol|new role|nuevo rol/i }).click();
    await this.page.getByRole('textbox', { name: /role name|nombre.*rol|type name/i }).last().fill(name);
    await this.page.getByRole('button', { name: /add.*role|agregar.*rol|save|guardar/i }).last().click();
  }

  async editTechnicianRole(rowIndex: number, newName: string) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).dispatchEvent('click');
    await this.page.getByText(/Edit Technician Role/i).waitFor({ state: 'visible' });
    const input = this.page.getByRole('textbox').first();
    await input.clear();
    await input.fill(newName);
    await this.page.getByRole('button', { name: /Update/i }).last().click();
  }

  async deleteTechnicianRole(rowIndex: number, confirm: boolean) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /delete|eliminar/i }).dispatchEvent('click');
    if (confirm) {
      await this.page.getByRole('button', { name: /confirm|yes|delete|eliminar|sí/i }).last().click();
    } else {
      await this.page.getByRole('button', { name: /cancel|no|cancelar/i }).click();
    }
  }

  async verifyRoleAddSuccess() {
    await this.verifyToast(/role.*added|role.*created|rol.*agre|rol.*crea/i);
  }

  async verifyRoleUpdateSuccess() {
    await this.verifyToast(/updated successfully|updated|actualiz/i);
  }

  async verifyRoleDeleteSuccess() {
    await this.verifyToast(/role.*deleted|rol.*elimin/i);
  }

  // ── Technician Levels tab ──────────────────────────────────────────────────

  async addTechnicianLevel(name: string) {
    await this.page.getByRole('button', { name: /add.*level|agregar.*nivel|new level|nuevo nivel/i }).click();
    await this.page.getByRole('textbox', { name: /level name|nombre.*nivel|type name/i }).last().fill(name);
    await this.page.getByRole('button', { name: /add.*level|agregar.*nivel|save|guardar/i }).last().click();
  }

  async editTechnicianLevel(rowIndex: number, newName: string) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).dispatchEvent('click');
    await this.page.getByText(/Edit Technician Level/i).waitFor({ state: 'visible' });
    const input = this.page.getByRole('textbox').first();
    await input.clear();
    await input.fill(newName);
    await this.page.getByRole('button', { name: /Update/i }).last().click();
  }

  async deleteTechnicianLevel(rowIndex: number, confirm: boolean) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /delete|eliminar/i }).dispatchEvent('click');
    if (confirm) {
      await this.page.getByRole('button', { name: /confirm|yes|delete|eliminar|sí/i }).last().click();
    } else {
      await this.page.getByRole('button', { name: /cancel|no|cancelar/i }).click();
    }
  }

  async verifyLevelAddSuccess() {
    await this.verifyToast(/level.*added|level.*created|nivel.*agre|nivel.*crea/i);
  }

  async verifyLevelUpdateSuccess() {
    await this.verifyToast(/updated successfully|updated|actualiz/i);
  }

  async verifyLevelDeleteSuccess() {
    await this.verifyToast(/level.*deleted|nivel.*elimin/i);
  }

  // ── Rate Sheet tab ─────────────────────────────────────────────────────────

  async addRateSheet(opts: {
    role?: string;
    level?: string;
    revenueRate: number;
    technicianRate: number;
  }) {
    await this.page.getByRole('button', { name: /add.*rate|agregar.*tarifa|new rate/i }).click();

    if (opts.role) {
      const newRoleBtn = this.page.getByRole('button', { name: /new role|nuevo rol/i });
      if (await newRoleBtn.isVisible()) {
        await newRoleBtn.click();
        const roleModal = this.page.getByRole('dialog').filter({
          has: this.page.getByRole('heading', { name: /Add Technician Role/i }),
        });
        await roleModal.waitFor({ state: 'visible', timeout: 8000 });
        await roleModal.getByRole('textbox').first().fill(opts.role);
        await roleModal.getByRole('button', { name: /Add Technician Role/i }).click();
        await roleModal.waitFor({ state: 'hidden', timeout: 10000 });
      } else {
        await this.page.getByRole('button', { name: /choose.*role|seleccionar.*rol/i }).first().click();
        await this.page.getByRole('menuitem', { name: new RegExp(opts.role, 'i') }).click();
      }
    }

    if (opts.level) {
      const newLevelBtn = this.page.getByRole('button', { name: /new level|nuevo nivel/i });
      if (await newLevelBtn.isVisible()) {
        await newLevelBtn.click();
        const levelModal = this.page.getByRole('dialog').filter({
          has: this.page.getByRole('heading', { name: /Add Technician Level/i }),
        });
        await levelModal.waitFor({ state: 'visible', timeout: 8000 });
        await levelModal.getByRole('textbox').first().fill(opts.level);
        await levelModal.getByRole('button', { name: /Add Technician Level/i }).click();
        await levelModal.waitFor({ state: 'hidden', timeout: 10000 });
      } else {
        await this.page.getByRole('button', { name: /choose.*level|seleccionar.*nivel/i }).first().click();
        await this.page.getByRole('menuitem', { name: new RegExp(opts.level, 'i') }).click();
      }
    }

    await this.page.getByPlaceholder(/type rate sheet here|revenue rate/i).fill(String(opts.revenueRate));
    await this.page.getByPlaceholder(/type technician rate here|technician rate/i).fill(String(opts.technicianRate));
    await this.page.getByRole('button', { name: /add item|add|agregar/i }).last().click();
  }

  async editRateSheet(rowIndex: number, newRate: number) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).dispatchEvent('click');
    const rateInput = this.page.getByPlaceholder(/type rate sheet here|revenue rate/i);
    await rateInput.waitFor({ state: 'visible', timeout: 10000 });
    await rateInput.clear();
    await rateInput.fill(String(newRate));
    await this.page.getByRole('button', { name: /save|update|guardar/i }).last().click();
  }

  async verifyRateSheetAddSuccess() {
    await this.verifyToast(/rate.*added|tarifa.*agre/i);
  }

  async verifyRateSheetUpdateSuccess() {
    await this.verifyToast(/rate.*updated|tarifa.*actualiz/i);
  }

  // ── Technicians tab ────────────────────────────────────────────────────────

  async inviteTechnician(tech: TechnicianInvite): Promise<'success' | 'email-duplicate' | 'phone-duplicate'> {
    await this.page.getByRole('button', { name: /invite.*technician|invitar.*técnico/i }).click();
    await this.page.getByRole('textbox', { name: /name|nombre/i }).first().fill(tech.name);
    await this.page.getByRole('textbox', { name: /email/i }).fill(tech.email);
    const techPhone = this.page.getByRole('textbox', { name: /phone|\(234\)/i });
    await techPhone.click();
    await techPhone.pressSequentially(tech.phone ?? this.validPhone());
    await this.page.getByRole('textbox', { name: /password/i }).fill(tech.password);

    const roleDropdown = this.page.locator('button').filter({ hasText: /Choose technician role|Elegir rol/i });
    if (await roleDropdown.isVisible()) {
      await roleDropdown.click();
      await this.page.getByRole('menuitem').first().waitFor({ state: 'visible', timeout: 5000 });
      await this.page.getByRole('menuitem').first().click();
    }

    const levelDropdown = this.page.locator('button').filter({ hasText: /Choose technician level|Elegir nivel/i });
    if (await levelDropdown.isVisible()) {
      await levelDropdown.click();
      await this.page.getByRole('menuitem').first().waitFor({ state: 'visible', timeout: 5000 });
      await this.page.getByRole('menuitem').first().click();
    }

    const newRateSheetLink = this.page.getByText(/\+\s*New rate sheet|\+\s*Nueva hoja/i).last();
    if (await newRateSheetLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newRateSheetLink.click();
      const revenueInput = this.page.getByPlaceholder(/type rate sheet here|revenue rate/i).last();
      await revenueInput.waitFor({ state: 'visible', timeout: 5000 });
      await revenueInput.fill(String(tech.revenueRate ?? 1));
      const techRateInput = this.page.getByPlaceholder(/type technician rate here|technician rate/i).last();
      if (await techRateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await techRateInput.fill(String(tech.technicianRate ?? 1));
      }
    }

    const submitBtn = this.page.getByRole('button', { name: /Invite Technician|Invitar Técnico/i }).last();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.dispatchEvent('click');

    try {
      await expect(
        this.page.getByText(/technician.*invited|técnico.*invitado|already.*email|email.*already|phone.*already|already.*phone/i).first()
      ).toBeVisible({ timeout: 8000 });
    } catch { /* no feedback in time */ }

    if (await this.page.getByText(/already.*email|email.*already/i).isVisible()) return 'email-duplicate';
    if (await this.page.getByText(/phone.*already|already.*phone/i).isVisible()) return 'phone-duplicate';
    return 'success';
  }

  async verifyTechnicianInviteSuccess() {
    await this.verifyToast(/technician.*invited|técnico.*invitado/i);
  }

  async editTechnician(rowIndex: number, newName: string) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).click();
    const nameInput = this.page.getByRole('textbox', { name: /name|nombre/i }).first();
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.page.getByRole('button', { name: /save|guardar/i }).last().click();
  }

  async verifyTechnicianUpdateSuccess() {
    await this.verifyToast(/technician.*updated|técnico.*actualiz/i);
  }

  // ── Managers tab ───────────────────────────────────────────────────────────

  async inviteManager(mgr: ManagerInvite): Promise<'success' | 'duplicate'> {
    await this.page.getByRole('button', { name: /invite.*manager|invitar.*gerente/i }).click();
    await this.page.getByRole('textbox', { name: /name|nombre/i }).first().fill(mgr.name);
    await this.page.getByRole('textbox', { name: /email/i }).fill(mgr.email);
    const mgrPhone = this.page.getByRole('textbox', { name: /phone|\(234\)/i });
    await mgrPhone.click();
    await mgrPhone.pressSequentially(mgr.phone ?? this.validPhone());
    await this.page.getByPlaceholder(/type password here/i).first().fill(mgr.password);
    if (mgr.confirmPassword) {
      await this.page.getByRole('textbox').nth(4).fill(mgr.confirmPassword);
    }
    const submitMgrBtn = this.page.getByRole('button', { name: /Invite Manager|Invitar Gerente/i }).last();
    await submitMgrBtn.scrollIntoViewIfNeeded();
    await submitMgrBtn.dispatchEvent('click');

    try {
      await expect(
        this.page.getByText(/manager.*invited|gerente.*invitado|already.*email|email.*already/i).first()
      ).toBeVisible({ timeout: 8000 });
    } catch { /* no feedback */ }

    const isDuplicate = await this.page.getByText(/already.*email|email.*already/i).isVisible();

    // Close the dialog immediately — it lingers after submission and will block tab navigation
    await this.page.keyboard.press('Escape');

    return isDuplicate ? 'duplicate' : 'success';
  }

  async verifyManagerInviteSuccess() {
    await this.verifyToast(/manager.*invited|gerente.*invitado/i);
  }

  async editManager(rowIndex: number, newName: string) {
    await this.openRowMenu(rowIndex);
    await this.page.getByRole('menuitem', { name: /edit|editar/i }).click();
    const nameInput = this.page.getByRole('textbox', { name: /name|nombre/i }).first();
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.page.getByRole('button', { name: /save|guardar/i }).last().click();
  }

  async verifyManagerUpdateSuccess() {
    await this.verifyToast(/manager.*updated|gerente.*actualiz/i);
  }

  // ── Billing tab ────────────────────────────────────────────────────────────

  async setMonthlyLimit(limit: number) {
    const input = this.page.getByRole('textbox', { name: /monthly limit|límite mensual/i });
    await input.clear();
    await input.fill(String(limit));
    await this.page.getByRole('button', { name: /save|set|guardar/i }).last().click();
  }

  async verifyMonthlyLimitSaved() {
    await this.verifyToast(/limit.*saved|limit.*updated|límite.*guardado|límite.*actualiz/i);
  }

  async openCancelSubscriptionModal() {
    await this.page.getByRole('button', { name: /cancel subscription|cancelar suscripción/i }).click();
    await expect(
      this.page.getByText(/Cancel Subscription\?|¿Cancelar suscripción/i).first()
    ).toBeVisible();
  }

  async closeCancelSubscriptionModal() {
    await this.page.getByRole('button', { name: /Keep Subscription|Mantener suscripción/i }).click();
  }

  async filterBySubscription() {
    await this.page.getByRole('button', { name: /filters|filtros/i }).click();
    await this.page.getByRole('radio', { name: /subscription|suscripción/i }).click();
    await this.page.getByRole('button', { name: /apply filter|aplicar filtro/i }).click();
  }

  async verifyBillingTableHeaders(lang: 'en' | 'es') {
    if (lang === 'en') {
      await expect(this.page.getByRole('columnheader', { name: /timestamp|date/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /type/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /invoice/i })).toBeVisible();
    } else {
      await expect(this.page.getByRole('columnheader', { name: /fecha|hora/i }).first()).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /tipo/i })).toBeVisible();
      await expect(this.page.getByRole('columnheader', { name: /factura/i })).toBeVisible();
    }
  }

  // ── Integrations tab ───────────────────────────────────────────────────────

  async verifyQuickBooksButton() {
    await expect(
      this.page.getByRole('button', { name: /quickbooks|connect/i }).first()
    ).toBeVisible();
  }

  // ── Activity tab ───────────────────────────────────────────────────────────

  async verifyActivityLoaded() {
    await expect(
      this.page.getByText(/activity|actividad/i).first()
    ).toBeVisible();
  }
}
