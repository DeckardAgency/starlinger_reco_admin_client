import { test, expect } from '@playwright/test';
import { AdminModulePage, MODULE_CONFIGS } from './pages';

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

    // Fill product details — no guards
    await page.locator('input[placeholder="Enter product name"]').fill(testData.name);
    await page.locator('input[placeholder="Enter code"]').fill(testData.code);

    // Select first option for all visible selects (product group, tax type, currency)
    const selects = page.locator('select.ui-select__field');
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
      const sel = selects.nth(i);
      if (await sel.isVisible().catch(() => false)) {
        await sel.selectOption({ index: 1 });
      }
    }

    await modulePage.saveAndExpectList();

    // VERIFY: The created product appears in the list
    // Products list displays slug (lowercased/hyphenated) as name, so verify by code
    await modulePage.verifyRowExists(testData.code);
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

    // Modify the name field — use a fresh value to avoid accumulation from previous runs
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

    // Search is client-side — use a term that matches existing product codes
    await modulePage.search('BCSM');

    await expect(modulePage.table).toBeVisible();
  });

  test('8. should navigate through product tabs', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickEdit(0);

    // Check for tabs component
    const tabs = page.locator('ui-tabs');
    await expect(tabs).toBeVisible({ timeout: 5000 });

    // Click through tabs
    const tabItems = ['Gallery', 'Product documents', 'Applied discounts'];
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

  test('9. should cancel and go back to list', async ({ page }) => {
    // Navigate via list first so browser history has the list page
    await modulePage.gotoList();
    await modulePage.clickAdd();
    await modulePage.goBack();

    await expect(page).toHaveURL(/\/products\/list/);
  });
});
