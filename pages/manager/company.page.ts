import { expect } from '@playwright/test';
import { AdminCompanyPage } from '../admin/company.page';

export class ManagerCompanyPage extends AdminCompanyPage {

  // Asserts a company tab is inaccessible to the manager (absent, hidden, or disabled).
  private async verifyTabRestricted(name: RegExp) {
    const tab = this.page.getByRole('tab', { name });
    const count = await tab.count();
    if (count === 0) return;               // not in DOM — restricted by server
    if (!await tab.isVisible()) return;    // hidden — restricted by client
    await expect(tab).toBeDisabled();      // visible but non-interactive
  }

  async verifyBillingTabRestricted() {
    await this.verifyTabRestricted(/^Billing$|^Facturación$/);
  }

  async verifyActivityTabRestricted() {
    await this.verifyTabRestricted(/^Activity$|^Actividad$/);
  }

  // Confirms the tabs that ARE accessible to managers can be navigated.
  async verifyTechnicianRolesTabAccessible() {
    await this.openTab('Technician Roles');
    await expect(this.page.getByRole('tab', { name: /Technician Roles/i }))
      .toHaveAttribute('aria-selected', 'true');
  }

  async verifyManagersTabAccessible() {
    await this.openTab('Managers');
    await expect(this.page.getByRole('tab', { name: /^Managers$|^Gerentes$/ }))
      .toHaveAttribute('aria-selected', 'true');
  }
}
