import { test, expect } from '@playwright/test';

/**
 * Support Tickets Module - E2E Tests
 * Read-only list with: tabs (status filters), search, pagination, view detail
 * Uses custom HTML table (not ui-data-table)
 */
test.describe('Support Tickets', () => {
  test.beforeEach(async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/support_tickets') && resp.request().method() === 'GET',
      { timeout: 15000 }
    );
    await page.goto('/admin/support-tickets/list');
    await responsePromise;
    await page.waitForLoadState('networkidle');
  });

  test('1. should display support tickets list', async ({ page }) => {
    // Page title
    await expect(page.locator('.tickets__title')).toBeVisible();

    // Table or empty state
    const table = page.locator('.tickets__table');
    const emptyState = page.locator('.tickets__empty');
    const isTableVisible = await table.isVisible().catch(() => false);
    const isEmptyVisible = await emptyState.isVisible().catch(() => false);

    expect(isTableVisible || isEmptyVisible).toBeTruthy();
  });

  test('2. should display status tabs', async ({ page }) => {
    const tabs = page.locator('.tickets__tabs');
    await expect(tabs).toBeVisible();

    // Verify all 5 tabs exist
    const tabButtons = page.locator('.tickets__tab');
    await expect(tabButtons).toHaveCount(5);
  });

  test('3. should switch between status tabs', async ({ page }) => {
    const tabs = ['all', 'open', 'in_progress', 'resolved', 'closed'];
    const tabButtons = page.locator('.tickets__tab');

    for (let i = 0; i < tabs.length; i++) {
      await tabButtons.nth(i).click();
      await page.waitForTimeout(500);
      // Active tab should have active class
      await expect(tabButtons.nth(i)).toHaveClass(/tickets__tab--active/);
    }

    await expect(page).toHaveURL(/\/support-tickets/);
  });

  test('4. should have search functionality', async ({ page }) => {
    const searchInput = page.locator('.tickets__search-input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('test');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/support-tickets/);
  });

  test('5. should navigate to ticket detail view', async ({ page }) => {
    const rows = page.locator('.tickets__table-row');
    const rowCount = await rows.count();
    test.skip(rowCount === 0, 'No tickets to view');

    await rows.first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/support-tickets\/\d+\/view/);
  });

  test('6. should show status update dropdown in actions column', async ({ page }) => {
    const rows = page.locator('.tickets__table-row');
    const rowCount = await rows.count();
    test.skip(rowCount === 0, 'No tickets to update');

    const statusSelect = page.locator('.tickets__status-select').first();
    await expect(statusSelect).toBeVisible();

    // Verify select has 4 options
    const options = statusSelect.locator('option');
    await expect(options).toHaveCount(4);
  });

  test('7. should display pagination when applicable', async ({ page }) => {
    const footer = page.locator('.tickets__footer');
    const table = page.locator('.tickets__table');

    if (await table.isVisible().catch(() => false)) {
      await expect(footer).toBeVisible();
      // Results count text should be present
      await expect(page.locator('.tickets__results')).toBeVisible();
    }
  });
});
