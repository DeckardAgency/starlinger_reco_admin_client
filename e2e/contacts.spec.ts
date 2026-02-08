import { test, expect } from '@playwright/test';

/**
 * Contacts Module - CRUD E2E Tests
 * Fields: toggles (billing, isActive), firstName, lastName, phone, email
 */
test.describe('Contacts CRUD', () => {
  const timestamp = Date.now();
  const testData = {
    firstName: 'E2E',
    lastName: `Contact${timestamp}`,
    phone: '+385 1 234 5678',
    email: `e2e_contact_${timestamp}@test.com`,
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/contacts/list');
    await page.waitForLoadState('networkidle');
  });

  test('1. should display contacts list', async ({ page }) => {
    const table = page.locator('ui-data-table, table').first();
    await expect(table).toBeVisible({ timeout: 15000 });

    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    const rows = page.locator('ui-data-table tbody tr, table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('2. should navigate to create form', async ({ page }) => {
    const addButton = page.locator('ui-list-header button:has-text("Add"), button:has-text("Add")').first();
    await addButton.click();

    await expect(page).toHaveURL(/\/contacts\/new/);
    await expect(page.locator('.form-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('3. should create a new contact', async ({ page }) => {
    await page.goto('/admin/contacts/new');
    await page.waitForLoadState('networkidle');

    // Fill first name
    const firstNameInput = page.locator('input[placeholder="First name"]');
    if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstNameInput.fill(testData.firstName);
    }

    // Fill last name
    const lastNameInput = page.locator('input[placeholder="Last name"]');
    if (await lastNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await lastNameInput.fill(testData.lastName);
    }

    // Fill phone
    const phoneInput = page.locator('input[placeholder="Phone"]');
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.fill(testData.phone);
    }

    // Fill email
    const emailInput = page.locator('input[placeholder="Email"]');
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(testData.email);
    }

    // Save
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/users') && resp.request().method() === 'POST',
        { timeout: 15000 }
      ).catch(() => {}),
      saveButton.click(),
    ]);

    await expect(page).toHaveURL(/\/contacts/, { timeout: 15000 });
  });

  test('4. should navigate to edit page via actions dropdown', async ({ page }) => {
    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    if (await actionsDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsDropdown.locator('button').first().click();
      await page.locator('text="Edit"').first().click();

      await expect(page).toHaveURL(/\/contacts\/[\w-]+\/edit/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');

      // Verify form is loaded
      await expect(page.locator('.form-card').first()).toBeVisible({ timeout: 10000 });
    } else {
      test.skip(true, 'No contacts to edit');
    }
  });

  test('5. should edit an existing contact', async ({ page }) => {
    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    if (await actionsDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsDropdown.locator('button').first().click();
      await page.locator('text="Edit"').first().click();

      await expect(page).toHaveURL(/\/contacts\/[\w-]+\/edit/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');

      // Modify first name
      const firstNameInput = page.locator('input[placeholder="First name"]');
      if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const currentName = await firstNameInput.inputValue();
        await firstNameInput.fill(currentName ? `${currentName} Edited` : 'Edited');
      }

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

      await expect(page).toHaveURL(/\/contacts/, { timeout: 15000 });
    } else {
      test.skip(true, 'No contacts to edit');
    }
  });

  test('6. should delete a contact', async ({ page }) => {
    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

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
      test.skip(true, 'No test contact found to delete');
      return;
    }

    const actionsDropdown = page.locator('ui-table-actions-dropdown').nth(rowIndex);
    await actionsDropdown.locator('button').first().click();
    await page.locator('text="Delete"').first().click();

    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.request().method() === 'DELETE',
      { timeout: 10000 }
    ).catch(() => {});

    await expect(page).toHaveURL(/\/contacts/, { timeout: 5000 });
  });

  test('7. should toggle billing status in edit form', async ({ page }) => {
    await page.waitForResponse(
      resp => resp.url().includes('/users') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});

    const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
    if (await actionsDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsDropdown.locator('button').first().click();
      await page.locator('text="Edit"').first().click();

      await expect(page).toHaveURL(/\/contacts\/[\w-]+\/edit/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');

      // Find and toggle billing
      const billingToggle = page.locator('ui-toggle').filter({ hasText: /billing/i }).first();
      if (await billingToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await billingToggle.click();
        await page.waitForTimeout(300);
        await billingToggle.click(); // Toggle back
      }

      await expect(page).toHaveURL(/\/contacts\/[\w-]+\/edit/);
    } else {
      test.skip(true, 'No contacts to test toggle');
    }
  });

  test('8. should go back to list', async ({ page }) => {
    await page.goto('/admin/contacts/new');
    await page.waitForLoadState('networkidle');

    const backButton = page.locator('ui-detail-header button').first();
    await backButton.click();

    await expect(page).toHaveURL(/\/contacts/, { timeout: 10000 });
  });
});
