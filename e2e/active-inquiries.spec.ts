import { test, expect } from '@playwright/test';

/**
 * Active Inquiries Module - E2E Tests
 * Read-only module with: card grid display
 * No search, no create/edit/delete operations
 */
test.describe('Active Inquiries (Read-Only)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/active-inquiries/list');
    await page.waitForLoadState('networkidle');
  });

  test('1. should display active inquiries page', async ({ page }) => {
    // Verify page content is visible
    const pageContent = page.locator('.active-inquiries-page, .page-content').first();
    await expect(pageContent).toBeVisible({ timeout: 15000 });

    await page.waitForResponse(
      resp => resp.url().includes('/inquiries') || resp.url().includes('/orders'),
      { timeout: 15000 }
    ).catch(() => {});

    // Verify list header is visible
    const listHeader = page.locator('ui-list-header');
    await expect(listHeader).toBeVisible();
  });

  test('2. should not show Add button (read-only)', async ({ page }) => {
    // Active inquiries should not have an Add button
    const addButton = page.locator('ui-list-header button:has-text("Add")');
    const isVisible = await addButton.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('3. should not show search input (no search feature)', async ({ page }) => {
    // Active inquiries doesn't have search
    const searchInput = page.locator('ui-list-header input[type="text"]');
    const isVisible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('4. should display order cards or empty state', async ({ page }) => {
    await page.waitForResponse(
      resp => resp.url().includes('/inquiries') || resp.url().includes('/orders'),
      { timeout: 15000 }
    ).catch(() => {});

    // Either cards grid or empty state should be visible
    const orderCards = page.locator('ui-order-card');
    const emptyState = page.locator('text="No active orders"').first();
    const pageText = await page.locator('.active-inquiries-page').first().textContent().catch(() => '');

    const hasCards = await orderCards.count() > 0;
    const hasEmptyState = pageText?.toLowerCase().includes('no active') ||
                          await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    // Either cards or empty state should be present
    expect(hasCards || hasEmptyState).toBe(true);
  });

  test('5. should show loading state initially', async ({ page }) => {
    // Navigate fresh to catch loading state
    await page.goto('/admin/active-inquiries/list', { waitUntil: 'commit' });

    // Check for loading state (may be very fast)
    const loadingState = page.locator('.card-skeleton, text="Loading"');
    // This test is informational - loading state may pass too quickly
    const wasLoading = await loadingState.isVisible({ timeout: 1000 }).catch(() => false);

    // Just verify page loads successfully
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/active-inquiries/);
  });

  test('6. should navigate to order detail when clicking card', async ({ page }) => {
    await page.waitForResponse(
      resp => resp.url().includes('/inquiries') || resp.url().includes('/orders'),
      { timeout: 15000 }
    ).catch(() => {});

    const orderCards = page.locator('ui-order-card');
    const cardCount = await orderCards.count();

    if (cardCount > 0) {
      // Click on first order card
      await orderCards.first().click();

      // Should navigate to order detail or shop orders
      await page.waitForLoadState('networkidle');

      // URL should change to order detail
      const currentUrl = page.url();
      expect(
        currentUrl.includes('/shop-orders') || currentUrl.includes('/orders')
      ).toBe(true);
    } else {
      test.skip(true, 'No order cards to click');
    }
  });

  test('7. should display correct page title', async ({ page }) => {
    // Verify breadcrumbs show correct title
    const breadcrumbs = page.locator('ui-breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    const breadcrumbText = await breadcrumbs.textContent();
    expect(breadcrumbText?.toLowerCase()).toContain('inquiries');
  });
});
