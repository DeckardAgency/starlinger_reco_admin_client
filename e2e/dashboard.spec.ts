import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * Tests the admin dashboard page (landing page after login).
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('should display performance overview', async ({ page }) => {
    await expect(page.locator('app-performance-overview')).toBeVisible();
  });

  test('should display quick actions with 4 buttons', async ({ page }) => {
    await expect(page.getByText('Quick Actions')).toBeVisible();

    const quickActions = page.locator('.dashboard__quick-action');
    await expect(quickActions).toHaveCount(4);

    // Verify labels
    await expect(page.locator('.dashboard__quick-action-label', { hasText: 'Clients' })).toBeVisible();
    await expect(page.locator('.dashboard__quick-action-label', { hasText: 'Products' })).toBeVisible();
    await expect(page.locator('.dashboard__quick-action-label', { hasText: 'Orders' })).toBeVisible();
    await expect(page.locator('.dashboard__quick-action-label', { hasText: 'Users' })).toBeVisible();
  });

  test('should navigate via quick action', async ({ page }) => {
    // Click the "Clients" quick action
    await page.locator('.dashboard__quick-action', { hasText: 'Clients' }).click();

    await expect(page).toHaveURL(/\/admin\/clients\/list/);
  });

  test('should display recent orders section', async ({ page }) => {
    await expect(page.getByText('Recent Orders')).toBeVisible();

    // Either orders list or empty state should be present
    const list = page.locator('.dashboard__list');
    const empty = page.locator('.dashboard__empty').first();
    const hasContent = await list.isVisible().catch(() => false) || await empty.isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('should display order status distribution', async ({ page }) => {
    await expect(page.getByText('Order Status Distribution')).toBeVisible();

    // Either distribution chart or empty state should be present
    const distribution = page.locator('.dashboard__distribution');
    const empty = page.locator('.dashboard__empty').last();
    const hasContent = await distribution.isVisible().catch(() => false) || await empty.isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
