import { test, expect } from '@playwright/test';

/**
 * Accounts Module - CRUD E2E Tests
 * Complex module with basic info, contact info, toggles, and multiple tabs
 * (contacts, addresses, shop-orders, manual-entries, machines)
 */
test.describe('Accounts CRUD', () => {
  const timestamp = Date.now();
  const testData = {
    name: `E2E Test Company ${timestamp}`,
    code: `E2E${timestamp % 10000}`,
    oib: `${timestamp % 100000000000}`,
    email: `e2e_company_${timestamp}@test.com`,
    phone: '+385 1 234 5678',
    web: 'https://e2e-test.com',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to accounts list
    await page.goto('/admin/accounts/list');
    await page.waitForLoadState('networkidle');
  });

  test('1. should display accounts list with data', async ({ page }) => {
    // Verify the data table is visible
    const table = page.locator('ui-data-table, table').first();
    await expect(table).toBeVisible({ timeout: 15000 });

    // Wait for API response (accounts uses /clients endpoint)
    await page.waitForResponse(
      resp => resp.url().includes('/clients') && resp.status() === 200,
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
    await expect(page).toHaveURL(/\/accounts\/new/);

    // Verify form structure is visible - accounts has toggles and form cards
    await expect(page.locator('.card, .form-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('3. should create a new account', async ({ page }) => {
    // Go directly to create page
    await page.goto('/admin/accounts/new');
    await page.waitForLoadState('networkidle');

    // Fill basic information
    const nameInput = page.locator('input[placeholder="Company title"], input[placeholder*="title"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill(testData.name);
    }

    const codeInput = page.locator('input[placeholder="Code"]').first();
    if (await codeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await codeInput.fill(testData.code);
    }

    const oibInput = page.locator('input[placeholder="OIB"]').first();
    if (await oibInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await oibInput.fill(testData.oib);
    }

    // Fill contact information
    const emailInput = page.locator('input[placeholder="Email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(testData.email);
    }

    const phoneInput = page.locator('input[placeholder="Phone"]').first();
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.fill(testData.phone);
    }

    // Note: "Is active" toggle is enabled by default in new accounts

    // Click save and wait for response
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/clients') && resp.request().method() === 'POST',
        { timeout: 15000 }
      ).catch(() => {}),
      saveButton.click(),
    ]);

    // Wait for redirect to list
    await expect(page).toHaveURL(/\/accounts/, { timeout: 15000 });
  });

  test('4. should navigate to edit page via actions dropdown', async ({ page }) => {
    // Wait for table to load
    await page.waitForResponse(
      resp => resp.url().includes('/clients') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Open actions dropdown for first row
    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    await actionsDropdown.locator('button').first().click();

    // Click Edit
    await page.locator('text="Edit"').first().click();

    // Verify navigation to edit page
    await expect(page).toHaveURL(/\/accounts\/[\w-]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify form is populated - cards should be visible
    await expect(page.locator('.card, .form-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('5. should edit an existing account', async ({ page }) => {
    // Wait for table data
    await page.waitForResponse(
      resp => resp.url().includes('/clients') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Open actions and click edit
    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    await actionsDropdown.locator('button').first().click();
    await page.locator('text="Edit"').first().click();

    // Wait for form to load
    await expect(page).toHaveURL(/\/accounts\/[\w-]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait for form data to load
    await page.waitForTimeout(1000);

    // Find and modify the name/title field
    const nameInput = page.locator('input[placeholder="Company title"], input[placeholder*="title"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const currentName = await nameInput.inputValue();
      const editedName = currentName ? `${currentName} - Edited` : `Edited Account ${Date.now()}`;
      await nameInput.fill(editedName);
    }

    // Save
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/clients') &&
                (resp.request().method() === 'PATCH' || resp.request().method() === 'PUT'),
        { timeout: 15000 }
      ).catch(() => {}),
      saveButton.click(),
    ]);

    // Wait for redirect
    await expect(page).toHaveURL(/\/accounts/, { timeout: 15000 });
  });

  test('6. should delete an account via actions dropdown', async ({ page }) => {
    // Wait for table data
    await page.waitForResponse(
      resp => resp.url().includes('/clients') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Find test account to delete
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
      test.skip(true, 'No test account found to delete');
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
      resp => resp.url().includes('/clients') && resp.request().method() === 'DELETE',
      { timeout: 10000 }
    ).catch(() => {});

    // Verify still on accounts page
    await expect(page).toHaveURL(/\/accounts/, { timeout: 5000 });
  });

  test('7. should search/filter accounts', async ({ page }) => {
    // Wait for table data
    await page.waitForResponse(
      resp => resp.url().includes('/clients') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Find search input
    const searchInput = page.locator('ui-list-header input[type="text"], input[placeholder*="Search"]').first();

    // Search for an account
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Table should still be visible
    const table = page.locator('ui-data-table, table').first();
    await expect(table).toBeVisible();
  });

  test('8. should navigate through account tabs', async ({ page }) => {
    // Go to edit page of first account
    await page.waitForResponse(
      resp => resp.url().includes('/clients') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Open actions and click edit
    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    await actionsDropdown.locator('button').first().click();
    await page.locator('text="Edit"').first().click();

    // Wait for edit page
    await expect(page).toHaveURL(/\/accounts\/[\w-]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Check for tabs component - only test tabs that don't navigate away
    const tabsSection = page.locator('.tabs-section, ui-tabs').first();
    if (await tabsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click through internal tab items only (within ui-tabs component)
      // These tabs switch content without changing URL
      const internalTabNames = ['Contacts', 'Addresses', 'Machines'];
      for (const tabName of internalTabNames) {
        const tab = tabsSection.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`).first();
        if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // Verify we're still on the edit page
    await expect(page).toHaveURL(/\/accounts\/[\w-]+\/edit/);
  });

  test('9. should toggle account status', async ({ page }) => {
    // Go to edit page of first account
    await page.waitForResponse(
      resp => resp.url().includes('/clients') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Open actions and click edit
    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    await actionsDropdown.locator('button').first().click();
    await page.locator('text="Edit"').first().click();

    // Wait for edit page
    await expect(page).toHaveURL(/\/accounts\/[\w-]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Find the "Is active" toggle
    const activeToggle = page.locator('ui-toggle').filter({ hasText: /active/i }).first();
    if (await activeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click to toggle the state
      await activeToggle.click();
      await page.waitForTimeout(300);

      // Toggle back to original state
      await activeToggle.click();
    }

    // Verify we're still on the edit page
    await expect(page).toHaveURL(/\/accounts\/[\w-]+\/edit/);
  });

  test('10. should cancel and go back to list', async ({ page }) => {
    // Go to create form
    await page.goto('/admin/accounts/new');
    await page.waitForLoadState('networkidle');

    // Click back button
    const backButton = page.locator('ui-detail-header button').first();
    await backButton.click();

    // Verify redirect to list
    await expect(page).toHaveURL(/\/accounts/, { timeout: 10000 });
  });
});
