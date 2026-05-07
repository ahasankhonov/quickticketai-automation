import { Page, expect } from '@playwright/test';

type Tab = 'Overview' | 'Executive' | 'Operations' | 'Customer Metrics';
type Lang = 'English US' | 'Español';

export class AdminOverviewPage {
  constructor(private page: Page) {}

  // Navigates directly to the Overview dashboard
  async goto() {
    await this.page.goto('/dashboard/overview');
    await this.page.waitForLoadState('networkidle');
  }

  // Confirms the page loaded by URL and presence of the tab strip
  async verifyOverviewLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/overview/);
    await expect(this.page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  }

  // Clicks a tab and waits for it to become aria-selected
  async switchTab(tabName: Tab) {
    await this.page.getByRole('tab', { name: tabName }).click();
    await expect(this.page.getByRole('tab', { name: tabName }))
      .toHaveAttribute('aria-selected', 'true');
  }

  // Opens the language dropdown and selects the target language.
  // Skips silently if the page is already in the requested language.
  async changeLanguage(to: Lang) {
    const current: Lang = to === 'English US' ? 'Español' : 'English US';
    const currentButton = this.page.getByRole('button', { name: new RegExp(current) });
    if (!await currentButton.isVisible()) return; // already in target language
    await currentButton.click();
    await this.page.getByRole('menuitem', { name: new RegExp(to) }).click();
  }

  // Opens the date/filters panel — button label is 'Filtros' in Spanish, 'Filters' in English
  async openFilters() {
    await this.page.getByRole('button', { name: /Filtros|Filters/ }).click();
  }

  // Confirms the filters panel opened by checking the year button is visible
  async verifyFiltersOpen() {
    // Multiple year buttons may be present — any one visible confirms the panel opened
    await expect(this.page.getByRole('button', { name: /\d{4}/ }).first()).toBeVisible();
  }

  // Verifies Overview tab metric card labels.
  // Call with lang:'es' after changeLanguage('Español').
  async verifyOverviewMetrics(lang: 'en' | 'es' = 'en') {
    // Wait for loading spinner to disappear before asserting metric labels
    await expect(this.page.getByText('Loading overview statistics')).toBeHidden({ timeout: 15000 });

    const metrics =
      lang === 'en'
        ? [
            'Job Tickets',
            'Billable',
            'Working Hours',
            'Invoices',
            'Job & Billing Trends',
            'Income and Expenses',
          ]
        : [
            'Tickets de Trabajo',
            'Facturable',
            'Horas de Trabajo',
            'Facturas',
            'Tendencias de Trabajo y',
            'Ingresos y Gastos',
          ];

    for (const metric of metrics) {
      await expect(this.page.getByText(metric).first()).toBeVisible();
    }
  }

  // Verifies all Executive tab financial metric labels
  async verifyExecutiveMetrics() {
    const metrics = [
      'Total Revenue (Invoiced)',
      'Gross Profit Margin',
      'Total Billable Hours',
      'Outstanding Invoices (A/R)',
      'Revenue vs Labor Cost (Last',   // partial match — full label is truncated in the UI
      'Billable Utilization Rate',
      'Top Revenue Generators',
    ];
    for (const metric of metrics) {
      await expect(this.page.getByText(metric).first()).toBeVisible();
    }
  }

  // Verifies Operations tab section headings and Leaderboard table column headers
  async verifyOperationsMetrics() {
    const sections = ['Technician Leaderboard', 'Job Locations', 'Job Velocity Funnel'];
    for (const section of sections) {
      await expect(this.page.getByText(section).first()).toBeVisible();
    }

    // Leaderboard table column headers
    const columns = ['Rank', 'Hours', 'Avg Ticket', 'Efficiency'];
    for (const col of columns) {
      await expect(this.page.getByText(col).first()).toBeVisible();
    }
    // 'Technician' appears in both the heading and the column — exact match targets the column
    await expect(this.page.getByText('Technician', { exact: true })).toBeVisible();
  }

  // Verifies the Customer Metrics tab is active (content varies — extend as needed)
  async verifyCustomerMetricsTab() {
    await expect(this.page.getByRole('tab', { name: 'Customer Metrics' }))
      .toHaveAttribute('aria-selected', 'true');
  }
}
