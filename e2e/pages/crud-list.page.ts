import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface CrudConfig {
  name: string;
  listUrl: string;
  apiEndpoint: string;
}

export class CrudListPage extends BasePage {
  constructor(page: Page, private config: CrudConfig) {
    super(page);
  }

  // Selectors
  private get addButton(): Locator {
    return this.page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), a:has-text("Add"), a:has-text("New")').first();
  }

  private get table(): Locator {
    return this.page.locator('table, ui-data-table').first();
  }

  private get tableRows(): Locator {
    return this.page.locator('table tbody tr, ui-data-table tbody tr');
  }

  private get searchInput(): Locator {
    return this.page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').first();
  }

  private get pagination(): Locator {
    return this.page.locator('ui-pagination, .pagination, [class*="pagination"]').first();
  }

  async goto() {
    await this.page.goto(this.config.listUrl);
    await this.waitForPageLoad();
  }

  async waitForListLoad() {
    // Wait for API call to complete
    await this.page.waitForResponse(
      resp => resp.url().includes(this.config.apiEndpoint) && resp.status() === 200,
      { timeout: 10000 }
    ).catch(() => {
      // API might have already loaded
    });
    // Give Angular time to render
    await this.page.waitForTimeout(500);
  }

  async getRowCount(): Promise<number> {
    await this.waitForListLoad();
    return this.tableRows.count();
  }

  async clickAddButton() {
    await this.addButton.click();
    await this.page.waitForURL(/\/(new|create|add)/);
  }

  async clickEditOnRow(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);
    // Look for edit button/link in the row
    const editButton = row.locator('button:has-text("Edit"), a:has-text("Edit"), button[title*="Edit"], a[title*="Edit"], [class*="edit"]').first();

    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
    } else {
      // Try clicking the row itself or an actions menu
      const actionsButton = row.locator('button[class*="action"], button:has(svg), .actions-trigger').first();
      if (await actionsButton.isVisible().catch(() => false)) {
        await actionsButton.click();
        await this.page.locator('button:has-text("Edit"), a:has-text("Edit")').first().click();
      } else {
        // Click the row to navigate to edit
        await row.click();
      }
    }
    await this.page.waitForURL(/\/edit|\/\w{8}-/);
  }

  async clickDeleteOnRow(rowIndex: number) {
    const row = this.tableRows.nth(rowIndex);

    // Look for delete button in the row
    const deleteButton = row.locator('button:has-text("Delete"), button[title*="Delete"], [class*="delete"]').first();

    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();
    } else {
      // Try actions menu
      const actionsButton = row.locator('button[class*="action"], button:has(svg), .actions-trigger').first();
      if (await actionsButton.isVisible().catch(() => false)) {
        await actionsButton.click();
        await this.page.locator('button:has-text("Delete")').first().click();
      }
    }
  }

  async confirmDelete() {
    // Handle confirmation dialog
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
    if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmButton.click();
    }
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
    await this.waitForListLoad();
  }

  async getFirstRowText(): Promise<string> {
    await this.waitForListLoad();
    const firstRow = this.tableRows.first();
    return (await firstRow.textContent()) || '';
  }

  async rowContainsText(text: string): Promise<boolean> {
    await this.waitForListLoad();
    const rows = await this.tableRows.all();
    for (const row of rows) {
      const content = await row.textContent();
      if (content?.includes(text)) {
        return true;
      }
    }
    return false;
  }

  async hasData(): Promise<boolean> {
    await this.waitForListLoad();
    const count = await this.tableRows.count();
    // Check for "no data" messages
    const noData = this.page.locator('text="No data", text="No results", text="No items"').first();
    const hasNoDataMessage = await noData.isVisible({ timeout: 1000 }).catch(() => false);
    return count > 0 && !hasNoDataMessage;
  }
}
