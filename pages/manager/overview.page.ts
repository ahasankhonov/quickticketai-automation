import { expect } from '@playwright/test';
import { AdminOverviewPage } from '../admin/overview.page';

export class ManagerOverviewPage extends AdminOverviewPage {

  // Verifies the Executive tab is reachable but shows no restricted analytics.
  async verifyExecutiveTabRestrictedData() {
    await this.switchTab('Executive');
    // Tab is accessible — selected state confirms navigation succeeded
    await expect(this.page.getByRole('tab', { name: 'Executive' }))
      .toHaveAttribute('aria-selected', 'true');
    // Restricted admin-only metrics must NOT be visible to managers
    await expect(this.page.getByText('Total Revenue (Invoiced)').first()).not.toBeVisible();
    await expect(this.page.getByText('Gross Profit Margin').first()).not.toBeVisible();
    await expect(this.page.getByText('Outstanding Invoices (A/R)').first()).not.toBeVisible();
  }

  // Verifies the Operations tab is reachable and selected.
  async verifyOperationsTabRestrictedData() {
    await this.switchTab('Operations');
    await expect(this.page.getByRole('tab', { name: 'Operations' }))
      .toHaveAttribute('aria-selected', 'true');
  }
}
