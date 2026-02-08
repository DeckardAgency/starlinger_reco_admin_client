import { Page, Response, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for an API response matching the URL pattern and assert it succeeded.
   * Unlike the old version, this does NOT swallow errors — if the API call
   * fails or never happens, the test fails.
   */
  async waitForApiSuccess(urlPattern: string, method?: string): Promise<Response> {
    const response = await this.page.waitForResponse(
      (resp) =>
        resp.url().includes(urlPattern) &&
        (!method || resp.request().method() === method),
      { timeout: 15000 }
    );
    expect(response.status(), `API ${method ?? 'GET'} ${urlPattern} returned ${response.status()}`).toBeLessThan(400);
    return response;
  }

  /**
   * Register a handler to accept the next native browser confirm() dialog.
   * Must be called BEFORE the action that triggers the dialog.
   */
  acceptNextDialog() {
    this.page.once('dialog', (dialog) => dialog.accept());
  }

  async waitForTableData() {
    await this.page.waitForSelector('table tbody tr, ui-data-table tbody tr', { timeout: 10000 });
  }
}
