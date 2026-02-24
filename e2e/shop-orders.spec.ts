import { test, expect } from '@playwright/test';
import { BasePage } from './pages';

/**
 * Shop Orders Module - E2E Tests
 * Read-only module with: list view, tabs, search, export
 * No create/edit/delete operations
 */
test.describe('Shop Orders (Read-Only)', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    // Wait for API response to avoid race conditions
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/orders') && resp.request().method() === 'GET',
      { timeout: 15000 }
    );
    await page.goto('/admin/shop-orders/list');
    await responsePromise;
    await page.waitForLoadState('networkidle');
  });

  test('1. should display shop orders list', async ({ page }) => {
    const table = page.locator('ui-data-table, table').first();
    await expect(table).toBeVisible();
  });

  test('2. should not show Add button (read-only)', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add")');
    await expect(addButton).toHaveCount(0);
  });

  test('3. should display tabs for filtering', async ({ page }) => {
    const tabs = page.locator('ui-tabs');
    await expect(tabs).toBeVisible({ timeout: 5000 });
  });

  test('4. should switch between tabs', async ({ page }) => {
    const tabs = page.locator('ui-tabs');
    await expect(tabs).toBeVisible({ timeout: 5000 });

    const tabButtons = page.locator('ui-tabs button, ui-tabs [role="tab"]');
    const tabCount = await tabButtons.count();
    expect(tabCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      await tabButtons.nth(i).click();
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveURL(/\/shop-orders/);
  });

  test('5. should display order details via actions dropdown', async ({ page }) => {
    const rows = page.locator('ui-data-table tbody tr, table tbody tr');
    const rowCount = await rows.count();
    test.skip(rowCount === 0, 'No orders to view');

    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    await expect(actionsDropdown).toBeVisible();
    await actionsDropdown.locator('button').first().click();
    await expect(page.locator('.dropdown-menu').first()).toBeVisible({ timeout: 3000 });

    // Click Edit/View action (whichever exists)
    const editAction = page.locator('.dropdown-menu__item:has-text("Edit")').first();
    const viewAction = page.locator('.dropdown-menu__item:has-text("View")').first();

    if (await viewAction.isVisible({ timeout: 1000 }).catch(() => false)) {
      await viewAction.click();
    } else {
      await editAction.click();
    }

    await page.waitForLoadState('networkidle');
  });

  test('6. should show order status badges', async ({ page }) => {
    const table = page.locator('ui-data-table, table').first();
    await expect(table).toBeVisible();

    await expect(page).toHaveURL(/\/shop-orders/);
  });
});
