import { test, expect } from '@playwright/test';
import { AdminModulePage, MODULE_CONFIGS } from './pages';

/**
 * Contacts Module - CRUD E2E Tests
 * Fields: toggles (billing, isActive), firstName, lastName, phone, email
 */
test.describe('Contacts CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const testId = `E2E_${timestamp}`;
  const testData = {
    firstName: testId,
    lastName: 'Contact',
    phone: '+385 1 234 5678',
    email: `e2e_contact_${timestamp}@test.com`,
  };

  let modulePage: AdminModulePage;

  test.beforeEach(async ({ page }) => {
    modulePage = new AdminModulePage(page, MODULE_CONFIGS['contacts']);
  });

  test('1. should display contacts list', async ({ page }) => {
    await modulePage.gotoList();

    await expect(modulePage.table).toBeVisible();
  });

  test('2. should navigate to create form', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickAdd();

    await expect(page).toHaveURL(/\/contacts\/new/);
    await expect(page.locator('input[placeholder="First name"]')).toBeVisible({ timeout: 10000 });
  });

  test('3. should create a new contact', async ({ page }) => {
    await modulePage.gotoCreate();

    // Fill contact details — no guards
    await page.locator('input[placeholder="First name"]').fill(testData.firstName);
    await page.locator('input[placeholder="Last name"]').fill(testData.lastName);
    await page.locator('input[placeholder="Phone"]').first().fill(testData.phone);
    await page.locator('input[placeholder="Email"]').first().fill(testData.email);

    await modulePage.saveAndExpectList();

    // VERIFY: The created contact appears in the list
    await modulePage.verifyRowExists(testId);
  });

  test('4. should navigate to edit page via actions dropdown', async ({ page }) => {
    await modulePage.gotoList();

    const hasData = await modulePage.hasData();
    test.skip(!hasData, 'No contacts to edit');

    await modulePage.clickEdit(0);

    await expect(page).toHaveURL(/\/contacts\/[\w-]+\/edit/);
    await expect(page.locator('input[placeholder="First name"]')).toBeVisible({ timeout: 10000 });
  });

  test('5. should edit an existing contact', async ({ page }) => {
    await modulePage.gotoList();

    const hasData = await modulePage.hasData();
    test.skip(!hasData, 'No contacts to edit');

    await modulePage.clickEdit(0);

    // Modify first name — use a fresh value to avoid accumulation from previous runs
    const firstNameInput = page.locator('input[placeholder="First name"]');
    await expect(firstNameInput).toBeVisible();
    await firstNameInput.fill(`Edited_${Date.now()}`);

    await modulePage.saveAndExpectList();
  });

  test('6. should delete a contact', async ({ page }) => {
    await modulePage.gotoList();

    const rowIndex = await modulePage.findRowWithText('E2E');
    test.skip(rowIndex === -1, 'No test contact found to delete');

    await modulePage.clickDeleteAndConfirm(rowIndex);

    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/contacts\/list/);
  });

  test('7. should toggle billing status in edit form', async ({ page }) => {
    await modulePage.gotoList();

    const hasData = await modulePage.hasData();
    test.skip(!hasData, 'No contacts to test toggle');

    await modulePage.clickEdit(0);

    // Find and toggle billing
    const billingToggle = page.locator('ui-toggle').filter({ hasText: /billing/i }).first();
    await expect(billingToggle).toBeVisible({ timeout: 3000 });

    await billingToggle.click();
    await page.waitForTimeout(300);
    await billingToggle.click(); // Toggle back

    await expect(page).toHaveURL(/\/contacts\/[\w-]+\/edit/);
  });

  test('8. should go back to list', async ({ page }) => {
    // Navigate via list first so browser history has the list page
    await modulePage.gotoList();
    await modulePage.clickAdd();
    await modulePage.goBack();

    await expect(page).toHaveURL(/\/contacts\/list/);
  });
});
