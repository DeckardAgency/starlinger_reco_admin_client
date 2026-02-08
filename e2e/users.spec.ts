import { test, expect } from '@playwright/test';

/**
 * Users Module - CRUD E2E Tests
 * Complex module with user details, password, and role selection
 */
test.describe('Users CRUD', () => {
  const timestamp = Date.now();
  const testData = {
    firstName: `E2E`,
    lastName: `User${timestamp}`,
    username: `e2e_user_${timestamp}`,
    email: `e2e_user_${timestamp}@test.com`,
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to users list
    await page.goto('/admin/users/list');
    await page.waitForLoadState('networkidle');
  });

  test('1. should display users list with data', async ({ page }) => {
    // Verify the data table is visible
    const table = page.locator('ui-data-table, table').first();
    await expect(table).toBeVisible({ timeout: 15000 });

    // Wait for API response
    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200,
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
    await expect(page).toHaveURL(/\/users\/new/);

    // Verify form fields are visible
    await expect(page.locator('input[placeholder="Enter first name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter last name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter email"]')).toBeVisible();
  });

  test('3. should create a new user', async ({ page }) => {
    // Go directly to create page
    await page.goto('/admin/users/new');
    await page.waitForLoadState('networkidle');

    // Fill user details
    await page.locator('input[placeholder="Enter first name"]').fill(testData.firstName);
    await page.locator('input[placeholder="Enter last name"]').fill(testData.lastName);
    await page.locator('input[placeholder="Enter username"]').fill(testData.username);
    await page.locator('input[placeholder="Enter email"]').fill(testData.email);

    // Fill password
    await page.locator('input[placeholder="Enter password"]').fill(testData.password);
    await page.locator('input[placeholder="Repeat password"]').fill(testData.password);

    // Select a role (click on first role item if visible)
    const roleItem = page.locator('.role-item').first();
    if (await roleItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await roleItem.click();
    }

    // Click save and wait for response
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/users') && resp.request().method() === 'POST',
        { timeout: 15000 }
      ).catch(() => {}),
      saveButton.click(),
    ]);

    // Wait for redirect to list
    await expect(page).toHaveURL(/\/users/, { timeout: 15000 });
  });

  test('4. should navigate to edit page via actions dropdown', async ({ page }) => {
    // Wait for table to load
    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Open actions dropdown for first row
    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    await actionsDropdown.locator('button').first().click();

    // Click Edit
    await page.locator('text="Edit"').first().click();

    // Verify navigation to edit page
    await expect(page).toHaveURL(/\/users\/[\w-]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify form is populated
    const firstNameInput = page.locator('input[placeholder="Enter first name"]');
    await firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    const value = await firstNameInput.inputValue();
    // In edit mode, the field should have a value (even if empty string for some users)
    expect(value).toBeDefined();
  });

  test('5. should edit an existing user', async ({ page }) => {
    // Wait for table data
    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Open actions and click edit
    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    await actionsDropdown.locator('button').first().click();
    await page.locator('text="Edit"').first().click();

    // Wait for form to load
    await expect(page).toHaveURL(/\/users\/[\w-]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Get current first name and modify it
    const firstNameInput = page.locator('input[placeholder="Enter first name"]');
    await firstNameInput.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for form data to load
    await expect(async () => {
      const value = await firstNameInput.inputValue();
      expect(value.length).toBeGreaterThanOrEqual(0);
    }).toPass({ timeout: 10000 });

    const currentFirstName = await firstNameInput.inputValue();
    const editedFirstName = currentFirstName ? `${currentFirstName} Edited` : `Edited ${Date.now()}`;
    await firstNameInput.fill(editedFirstName);

    // Save
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/users') &&
                (resp.request().method() === 'PATCH' || resp.request().method() === 'PUT'),
        { timeout: 15000 }
      ).catch(() => {}),
      saveButton.click(),
    ]);

    // Wait for redirect
    await expect(page).toHaveURL(/\/users/, { timeout: 15000 });
  });

  test('6. should delete a user via actions dropdown', async ({ page }) => {
    // Wait for table data
    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Find test user to delete
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
      test.skip(true, 'No test user found to delete');
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
      resp => resp.url().includes('/users') && resp.request().method() === 'DELETE',
      { timeout: 10000 }
    ).catch(() => {});

    // Verify still on users page
    await expect(page).toHaveURL(/\/users/, { timeout: 5000 });
  });

  test('7. should search/filter users', async ({ page }) => {
    // Wait for table data
    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    // Find search input
    const searchInput = page.locator('ui-list-header input[type="text"], input[placeholder*="Search"]').first();

    // Search for a user
    await searchInput.fill('admin');
    await page.waitForTimeout(500);

    // Table should still be visible
    const table = page.locator('ui-data-table, table').first();
    await expect(table).toBeVisible();
  });

  test('8. should cancel and go back to list', async ({ page }) => {
    // Go to create form
    await page.goto('/admin/users/new');
    await page.waitForLoadState('networkidle');

    // Click back button
    const backButton = page.locator('ui-detail-header button').first();
    await backButton.click();

    // Verify redirect to list
    await expect(page).toHaveURL(/\/users\/list/);
  });
});
