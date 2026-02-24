import { test, expect } from '@playwright/test';
import { AdminModulePage, MODULE_CONFIGS } from './pages';
import { cleanupE2ERecords } from './fixtures/api-cleanup';

/**
 * Products Module - CRUD E2E Tests
 * Complex module with product details, toggles, pricing, tabs, and related products
 */
test.describe('Products CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const testId = `E2E_${timestamp}`;
  const testData = {
    name: testId,
    code: `E2E-${timestamp % 10000}`,
  };

  let modulePage: AdminModulePage;

  test.beforeEach(async ({ page }) => {
    modulePage = new AdminModulePage(page, MODULE_CONFIGS['products']);
  });

  test.afterAll(async () => {
    await cleanupE2ERecords('/products', 'name');
  });

  test('1. should display products list with data', async ({ page }) => {
    await modulePage.gotoList();

    await expect(modulePage.table).toBeVisible();
    const rowCount = await modulePage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('2. should navigate to create form via Add button', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickAdd();

    await expect(page).toHaveURL(/\/products\/new/);
    // Product form has toggles and input fields
    await expect(page.locator('ui-toggle').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[placeholder="Enter product name"]')).toBeVisible();
  });

  test('3. should create a new product', async ({ page }) => {
    await modulePage.gotoCreate();

    // Fill product details
    await page.locator('input[placeholder="Enter product name"]').fill(testData.name);
    await page.locator('input[placeholder="Enter code"]').fill(testData.code);

    // Select first option for all visible ui-selects (product group, tax type, currency)
    await modulePage.selectAllUiSelects();

    await modulePage.saveAndExpectList();
    // POST response verified by saveAndExpectList — product created successfully
  });

  test('4. should navigate to edit page via actions dropdown', async ({ page }) => {
    await modulePage.gotoList();

    await modulePage.clickEdit(0);

    await expect(page).toHaveURL(/\/products\/[\w-]+\/edit/);
    // Verify form is loaded with toggles
    await expect(page.locator('ui-toggle').first()).toBeVisible({ timeout: 10000 });
  });

  test('5. should edit an existing product', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickEdit(0);

    // Modify the name field
    const nameInput = page.locator('input[placeholder="Enter product name"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(`Edited_${Date.now()}`);

    await modulePage.saveAndExpectList();
  });

  test('6. should delete a product via actions dropdown', async ({ page }) => {
    await modulePage.gotoList();

    const rowIndex = await modulePage.findRowWithText('E2E');
    test.skip(rowIndex === -1, 'No test product found to delete');

    await modulePage.clickDeleteAndConfirm(rowIndex);

    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/products\/list/);
  });

  test('7. should search/filter products', async ({ page }) => {
    await modulePage.gotoList();

    await modulePage.search('BCSM');

    // Should remain on list page (table or empty state may be shown)
    await expect(page).toHaveURL(/\/products\/list/);
  });

  test('8. should navigate through all product tabs', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickEdit(0);

    // Check for tabs component
    const tabs = page.locator('ui-tabs');
    await expect(tabs).toBeVisible({ timeout: 5000 });

    // Click through ALL tabs
    const tabItems = ['Short description', 'Gallery', 'Product documents', 'Applied discounts', 'Related products'];
    for (const tabName of tabItems) {
      const tab = tabs.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`).first();
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }

    // Verify we're still on the edit page
    await expect(page).toHaveURL(/\/products\/[\w-]+\/edit/);
  });

  test('9. should display related products tab with available products section', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickEdit(0);

    // Navigate to Related products tab
    const tabs = page.locator('ui-tabs');
    await expect(tabs).toBeVisible({ timeout: 5000 });
    const relatedTab = tabs.locator('button:has-text("Related products"), [role="tab"]:has-text("Related products")').first();
    await relatedTab.click();
    await page.waitForTimeout(300);

    // Verify the available products section exists (outside tabs)
    const availableSection = page.locator('.available-products-section');
    await expect(availableSection).toBeVisible({ timeout: 5000 });

    // Verify the search input exists in available products
    const searchInput = availableSection.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();

    // Verify pagination footer exists
    const footer = availableSection.locator('ui-table-footer');
    await expect(footer).toBeVisible();
  });

  test('10. should toggle product active state', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickEdit(0);

    // Find the "Active" toggle
    const activeToggle = page.locator('ui-toggle').filter({ hasText: /Active/ }).first();
    await expect(activeToggle).toBeVisible({ timeout: 3000 });

    // Toggle and toggle back
    await activeToggle.click();
    await page.waitForTimeout(300);
    await activeToggle.click();

    await expect(page).toHaveURL(/\/products\/[\w-]+\/edit/);
  });

  test('11. should cancel and go back to list', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickAdd();
    await modulePage.goBack();

    await expect(page).toHaveURL(/\/products\/list/);
  });
});
