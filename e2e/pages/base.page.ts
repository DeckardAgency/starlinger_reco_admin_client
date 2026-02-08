import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForApiResponse(urlPattern: string | RegExp) {
    return this.page.waitForResponse(
      (response) =>
        (typeof urlPattern === 'string'
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url())) && response.status() < 400
    );
  }

  async clickAndWaitForNavigation(selector: string) {
    await Promise.all([
      this.page.waitForURL(/.*/),
      this.page.click(selector),
    ]);
  }

  async getToastMessage(): Promise<string | null> {
    const toast = this.page.locator('.toast, .alert, [role="alert"]').first();
    if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
      return toast.textContent();
    }
    return null;
  }

  async waitForTableData() {
    // Wait for table to have data rows
    await this.page.waitForSelector('table tbody tr, ui-data-table tbody tr', { timeout: 10000 });
  }
}
