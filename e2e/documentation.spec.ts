import { test, expect } from '@playwright/test';
import { cleanupE2ERecords } from './fixtures/api-cleanup';

/**
 * Documentation Module - CRUD E2E Tests
 * Custom UI (not using ui-data-table / ui-detail-header)
 * Features: markdown editor, revisions, media upload, search, pagination
 */
test.describe('Documentation CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const testId = `E2E_${timestamp}`;

  test.afterAll(async () => {
    await cleanupE2ERecords('/documentations', 'title');
  });

  test.beforeEach(async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/documentations') && resp.request().method() === 'GET',
      { timeout: 15000 }
    );
    await page.goto('/admin/documentation/list');
    await responsePromise;
    await page.waitForLoadState('networkidle');
  });

  test('1. should display documentation list', async ({ page }) => {
    await expect(page.locator('.doc-list__title')).toBeVisible();
    await expect(page).toHaveURL(/\/documentation\/list/);
  });

  test('2. should navigate to create form via Add button', async ({ page }) => {
    // Header has "Add documentation"; empty state also has an add button — use the header one
    const addButton = page.locator('.doc-list__actions .doc-list__add-button');
    await expect(addButton).toBeVisible();
    await addButton.click();

    await expect(page).toHaveURL(/\/documentation\/new/);
    await expect(page.locator('input#title')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input#category')).toBeVisible();
  });

  test('3. should create a new documentation', async ({ page }) => {
    await page.goto('/admin/documentation/new');
    await page.waitForLoadState('networkidle');

    await page.locator('input#title').fill(testId);
    await page.locator('input#category').fill('E2E Test');
    await page.locator('textarea[formControlName="content"]').fill(`# ${testId}\n\nTest content for E2E.`);

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/documentations') && resp.request().method() === 'POST',
      { timeout: 15000 }
    );
    // "Save" button (not "Save & Continue")
    await page.locator('button.documentation-edit__btn--primary:has-text("Save")').first().click();
    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    await expect(page).toHaveURL(/\/documentation\/list/, { timeout: 15000 });
  });

  test('4. should search documentation', async ({ page }) => {
    const searchInput = page.locator('.doc-list__search-input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('E2E');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/documentation\/list/);
  });

  test('5. should navigate to edit page', async ({ page }) => {
    const rows = page.locator('.doc-list__table tbody tr');
    const rowCount = await rows.count();
    test.skip(rowCount === 0, 'No documentation to edit');

    // Edit button in actions column
    await page.locator('.doc-list__action-btn:has-text("Edit")').first().click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/documentation\/\d+\/edit/);
  });

  test('6. should edit an existing documentation', async ({ page }) => {
    const rows = page.locator('.doc-list__table tbody tr');
    const rowCount = await rows.count();
    test.skip(rowCount === 0, 'No documentation to edit');

    // Click Edit and wait for both navigation and API data fetch
    const apiPromise = page.waitForResponse(
      (resp) => resp.url().includes('/documentations/') && resp.request().method() === 'GET',
      { timeout: 15000 }
    );
    await page.locator('.doc-list__action-btn:has-text("Edit")').first().click();
    await apiPromise;
    // Component has delay(200) + Angular rendering time
    await expect(page.locator('input#title')).toBeVisible({ timeout: 15000 });

    await page.locator('input#title').fill(`Edited_${Date.now()}`);

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/documentations') && ['PATCH', 'PUT'].includes(resp.request().method()),
      { timeout: 15000 }
    );
    await page.locator('button.documentation-edit__btn--primary:has-text("Save")').first().click();
    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    await expect(page).toHaveURL(/\/documentation\/list/, { timeout: 15000 });
  });

  test('7. should delete a documentation', async ({ page }) => {
    const rows = page.locator('.doc-list__table tbody tr');
    const rowCount = await rows.count();

    let targetRow = -1;
    for (let i = 0; i < rowCount; i++) {
      const text = await rows.nth(i).textContent();
      if (text?.includes('E2E')) {
        targetRow = i;
        break;
      }
    }
    test.skip(targetRow === -1, 'No E2E documentation to delete');

    // Per-row Delete button with confirm dialog
    page.once('dialog', dialog => dialog.accept());
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/documentations') && resp.request().method() === 'DELETE',
      { timeout: 15000 }
    );
    await rows.nth(targetRow).locator('.doc-list__action-btn--danger').click();

    // Handle custom alert modal if present
    const confirmBtn = page.locator('[role="alertdialog"] button:has-text("Confirm"), .alert-dialog button:has-text("Confirm")');
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);
  });

  test('8. should cancel and return to list', async ({ page }) => {
    await page.goto('/admin/documentation/new');
    await page.waitForLoadState('networkidle');

    await page.locator('button.documentation-edit__btn--secondary:has-text("Cancel")').first().click();

    await expect(page).toHaveURL(/\/documentation\/list/);
  });
});
