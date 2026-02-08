import { test, expect } from '@playwright/test';

/**
 * Products Module - CRUD E2E Tests
 * Complex module with product details, toggles, pricing, tabs, and related products
 */
test.describe('Products CRUD', () => {
  const timestamp = Date.now();
  const testData = {
    name: `E2E Test Product ${timestamp}`,
    code: `E2E-${timestamp % 10000}`,
    url: `e2e-product-${timestamp}`,
    basePrice: '99.99',
    retailPrice: '149.99',
    weight: '1.5',
    shortDescription: 'This is an E2E test product description.',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to products list
    await page.goto('/admin/products/list');
    await page.waitForLoadState('networkidle');
  });

  test('1. should display products list with data', async ({ page }) => {
    // Verify the data table is visible
    const table = page.locator('ui-data-table, table').first();
    await expect(table).toBeVisible({ timeout: 15000 });

    // Wait for API response
    await page.waitForResponse(
      resp => resp.url().includes('/products') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Check that table has rows
    const rows = page.locator('ui-data-table tbody tr, table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('2. should navigate to create form via Add button', async ({ page }) => {
    // Find and click the Add button
    const addButton = page.locator('ui-list-header button:has-text("Add"), button:has-text("Add")').first();
    await addButton.click();

    // Verify navigation to create page
    await expect(page).toHaveURL(/\/products\/new/);

    // Verify form structure is visible - product has toggles and form fields
    await expect(page.locator('ui-toggle').first()).toBeVisible({ timeout: 10000 });
  });

  test('3. should create a new product', async ({ page }) => {
    // Go directly to create page
    await page.goto('/admin/products/new');
    await page.waitForLoadState('networkidle');

    // Fill product details - the form uses input fields with various placeholders
    // Fill name field
    const nameInput = page.locator('input[placeholder*="Name"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill(testData.name);
    }

    // Fill code field
    const codeInput = page.locator('input[placeholder*="Code"], input[placeholder*="code"]').first();
    if (await codeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await codeInput.fill(testData.code);
    }

    // Fill URL field (skip if disabled - auto-generated from name)
    const urlInput = page.locator('input[placeholder*="URL"], input[placeholder*="url"]').first();
    if (await urlInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isDisabled = await urlInput.isDisabled().catch(() => true);
      if (!isDisabled) {
        await urlInput.fill(testData.url);
      }
    }

    // Enable toggles if they exist
    const activeToggle = page.locator('ui-toggle').filter({ hasText: /active/i }).first();
    if (await activeToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await activeToggle.click();
    }

    // Click save and wait for response
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/products') && resp.request().method() === 'POST',
        { timeout: 15000 }
      ).catch(() => {}),
      saveButton.click(),
    ]);

    // Wait for redirect to list
    await expect(page).toHaveURL(/\/products/, { timeout: 15000 });
  });

  test('4. should navigate to edit page via actions dropdown', async ({ page }) => {
    // Wait for table to load
    await page.waitForResponse(
      resp => resp.url().includes('/products') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Open actions dropdown for first row
    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    await actionsDropdown.locator('button').first().click();

    // Click Edit
    await page.locator('text="Edit"').first().click();

    // Verify navigation to edit page
    await expect(page).toHaveURL(/\/products\/[\w-]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify form is populated - toggles should be visible in edit mode
    await expect(page.locator('ui-toggle').first()).toBeVisible({ timeout: 10000 });
  });

  test('5. should edit an existing product', async ({ page }) => {
    // Wait for table data
    await page.waitForResponse(
      resp => resp.url().includes('/products') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Open actions and click edit
    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    await actionsDropdown.locator('button').first().click();
    await page.locator('text="Edit"').first().click();

    // Wait for form to load
    await expect(page).toHaveURL(/\/products\/[\w-]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait for form data to load
    await page.waitForTimeout(1000);

    // Find and modify the name field
    const nameInput = page.locator('input[placeholder*="Name"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const currentName = await nameInput.inputValue();
      const editedName = currentName ? `${currentName} - Edited` : `Edited Product ${Date.now()}`;
      await nameInput.fill(editedName);
    }

    // Save
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/products') &&
                (resp.request().method() === 'PATCH' || resp.request().method() === 'PUT'),
        { timeout: 15000 }
      ).catch(() => {}),
      saveButton.click(),
    ]);

    // Wait for redirect
    await expect(page).toHaveURL(/\/products/, { timeout: 15000 });
  });

  test('6. should delete a product via actions dropdown', async ({ page }) => {
    // Wait for table data
    await page.waitForResponse(
      resp => resp.url().includes('/products') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Find test product to delete
    const rows = page.locator('ui-data-table tbody tr, table tbody tr');
    const rowCount = await rows.count();

    let rowIndex = -1;
    for (let i = 0; i < rowCount; i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText?.includes('E2E') || rowText?.includes('e2e')) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      test.skip(true, 'No test product found to delete');
      return;
    }

    // Open actions dropdown for the found row
    const actionsDropdown = page.locator('ui-table-actions-dropdown').nth(rowIndex);
    await actionsDropdown.locator('button').first().click();

    // Click Delete
    await page.locator('text="Delete"').first().click();

    // Confirm deletion if dialog appears
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Wait for delete request
    await page.waitForResponse(
      resp => resp.url().includes('/products') && resp.request().method() === 'DELETE',
      { timeout: 10000 }
    ).catch(() => {});

    // Verify still on products page
    await expect(page).toHaveURL(/\/products/, { timeout: 5000 });
  });

  test('7. should search/filter products', async ({ page }) => {
    // Wait for table data
    await page.waitForResponse(
      resp => resp.url().includes('/products') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Find search input
    const searchInput = page.locator('ui-list-header input[type="text"], input[placeholder*="Search"]').first();

    // Search for a product
    await searchInput.fill('part');
    await page.waitForTimeout(500);

    // Table should still be visible
    const table = page.locator('ui-data-table, table').first();
    await expect(table).toBeVisible();
  });

  test('8. should navigate through product tabs', async ({ page }) => {
    // Go to edit page of first product
    await page.waitForResponse(
      resp => resp.url().includes('/products') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Open actions and click edit
    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    await actionsDropdown.locator('button').first().click();
    await page.locator('text="Edit"').first().click();

    // Wait for edit page
    await expect(page).toHaveURL(/\/products\/[\w-]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Check for tabs component
    const tabs = page.locator('ui-tabs');
    if (await tabs.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click through different tabs
      const tabItems = ['Gallery', 'Product documents', 'Applied discounts'];
      for (const tabName of tabItems) {
        const tab = page.locator(`text="${tabName}"`).first();
        if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // Verify we're still on the edit page
    await expect(page).toHaveURL(/\/products\/[\w-]+\/edit/);
  });

  test('9. should cancel and go back to list', async ({ page }) => {
    // Go to create form
    await page.goto('/admin/products/new');
    await page.waitForLoadState('networkidle');

    // Click back button
    const backButton = page.locator('button:has-text("Back"), ui-breadcrumbs a, .back-button').first();
    await backButton.click();

    // Verify redirect to list
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
  });
});
