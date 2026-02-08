import { test, expect } from '@playwright/test';
import { BasePage } from './pages';

/**
 * Active Inquiries Module - E2E Tests
 * Read-only module with: card grid display
 * No search, no create/edit/delete operations
 */
test.describe('Active Inquiries (Read-Only)', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await page.goto('/admin/active-inquiries/list');
    await basePage.waitForPageLoad();
  });

  test('1. should display active inquiries page', async ({ page }) => {
    // Wait for API — no .catch(() => {})
    await basePage.waitForApiSuccess('/orders', 'GET');

    const listHeader = page.locator('ui-list-header');
    await expect(listHeader).toBeVisible();
  });

  test('2. should not show Add button (read-only)', async ({ page }) => {
    const addButton = page.locator('ui-list-header button:has-text("Add")');
    await expect(addButton).toHaveCount(0);
  });

  test('3. should display order cards or empty state', async ({ page }) => {
    await basePage.waitForApiSuccess('/orders', 'GET');

    const orderCards = page.locator('ui-order-card');
    const cardCount = await orderCards.count();

    if (cardCount === 0) {
      // If no cards, verify empty state is shown
      const pageContent = page.locator('.active-inquiries-page, .page-content').first();
      await expect(pageContent).toBeVisible();
    } else {
      await expect(orderCards.first()).toBeVisible();
    }
  });

  test('4. should navigate to order detail when clicking card', async ({ page }) => {
    await basePage.waitForApiSuccess('/orders', 'GET');

    const orderCards = page.locator('ui-order-card');
    const cardCount = await orderCards.count();
    test.skip(cardCount === 0, 'No order cards to click');

    await orderCards.first().click();
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(
      currentUrl.includes('/shop-orders') || currentUrl.includes('/orders')
    ).toBe(true);
  });

  test('5. should display correct page title', async ({ page }) => {
    const breadcrumbs = page.locator('ui-breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    const breadcrumbText = await breadcrumbs.textContent();
    expect(breadcrumbText?.toLowerCase()).toContain('inquiries');
  });
});
