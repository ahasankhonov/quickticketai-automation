import { expect } from '@playwright/test';
import { BasePage } from './base.page';

type Tab = 'Overview' | 'Executive' | 'Operations' | 'Customer Metrics';

export class AdminOverviewPage extends BasePage {

  async goto() {
    await this.page.goto('/dashboard/overview');
    await expect(this.page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  }

  async verifyOverviewLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/overview/);
    await expect(this.page.getByRole('tab', { name: /^Overview$|^Resumen$/i })).toBeVisible();
  }

  async switchTab(tabName: Tab) {
    await this.page.getByRole('tab', { name: tabName }).click();
    await expect(this.page.getByRole('tab', { name: tabName }))
      .toHaveAttribute('aria-selected', 'true');
  }

  async openFilters() {
    await this.page.getByRole('button', { name: /Filtros|Filters/ }).click();
  }

  async verifyFiltersOpen() {
    await expect(this.page.getByRole('button', { name: /\d{4}/ }).first()).toBeVisible();
  }

  async verifyOverviewMetrics(lang: 'en' | 'es' = 'en') {
    await expect(this.page.getByText('Loading overview statistics')).toBeHidden({ timeout: 15000 });
    const metrics =
      lang === 'en'
        ? ['Job Tickets', 'Billable', 'Working Hours', 'Invoices', 'Job & Billing Trends', 'Income and Expenses']
        : ['Tickets de Trabajo', 'Facturable', 'Horas de Trabajo', 'Facturas', 'Tendencias de Trabajo y', 'Ingresos y Gastos'];
    for (const m of metrics) {
      await expect(this.page.getByText(m).first()).toBeVisible();
    }
  }

  async verifyExecutiveMetrics() {
    const metrics = [
      'Total Revenue (Invoiced)', 'Gross Profit Margin', 'Total Billable Hours',
      'Outstanding Invoices (A/R)', 'Revenue vs Labor Cost (Last',
      'Billable Utilization Rate', 'Top Revenue Generators',
    ];
    for (const m of metrics) {
      await expect(this.page.getByText(m).first()).toBeVisible();
    }
  }

  async verifyOperationsMetrics() {
    for (const s of ['Technician Leaderboard', 'Job Locations', 'Job Velocity Funnel']) {
      await expect(this.page.getByText(s).first()).toBeVisible();
    }
    for (const c of ['Rank', 'Hours', 'Avg Ticket', 'Efficiency']) {
      await expect(this.page.getByText(c).first()).toBeVisible();
    }
    await expect(this.page.getByText('Technician', { exact: true })).toBeVisible();
  }

  async verifyCustomerMetricsTab() {
    await expect(this.page.getByRole('tab', { name: 'Customer Metrics' }))
      .toHaveAttribute('aria-selected', 'true');
  }
}
