import { expect } from '@playwright/test';
import { BasePage } from '../admin/base.page';

export class TechnicianProfilePage extends BasePage {

  async gotoViaSidebar(): Promise<void> {
    // Technician has no sidebar — profile is the user section in the top-right nav bar
    // App does not use <header> tag — search page-wide for the role badge
    const enBadge = this.page.getByText('TECHNICIAN', { exact: true });
    if (await enBadge.isVisible().catch(() => false)) {
      await enBadge.click();
    } else {
      // Language may be switched — try Spanish equivalent
      await this.page.getByText(/TÉCNICO/i).first().click();
    }
    await expect(this.page.getByRole('button', { name: /^Edit$|^Editar$/i })).toBeVisible({ timeout: 10000 });
  }

  async verifyLoaded(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /^Edit$|^Editar$/i })).toBeVisible();
  }

  async verifyProfileInfo(): Promise<void> {
    await expect(this.page.getByText(/email/i).first()).toBeVisible();
    await expect(this.page.getByText(/phone/i).first()).toBeVisible();
  }

  async openEdit(): Promise<void> {
    await this.page.getByRole('button', { name: /^Edit$|^Editar$/i }).click();
  }

  async fillName(name: string): Promise<void> {
    await this.page.locator('input[name="fullname"]').fill(name);
  }

  async saveChanges(): Promise<void> {
    await this.page.getByRole('button', { name: /Save changes/i }).click();
  }

  async cancelEdit(): Promise<void> {
    await this.page.getByRole('button', { name: /Cancel|Cancelar/i }).click();
  }

  async verifyUpdateSuccess(): Promise<void> {
    await this.verifyToast(/Profile updated successfully/i);
  }
}
