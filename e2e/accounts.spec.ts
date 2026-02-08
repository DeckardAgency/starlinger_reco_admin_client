import { test, expect } from '@playwright/test';
import { AdminModulePage, MODULE_CONFIGS } from './pages';

/**
 * Accounts Module - CRUD E2E Tests
 * Complex module with basic info, contact info, toggles, and multiple tabs
 * (contacts, addresses, shop-orders, manual-entries, machines)
 */
test.describe('Accounts CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const testId = `E2E_${timestamp}`;
  const testData = {
    name: testId,
    code: `E2E${timestamp % 10000}`,
    email: `e2e_company_${timestamp}@test.com`,
    phone: '+385 1 234 5678',
  };

  let modulePage: AdminModulePage;

  test.beforeEach(async ({ page }) => {
    modulePage = new AdminModulePage(page, MODULE_CONFIGS['accounts']);
  });

  test('1. should display accounts list with data', async ({ page }) => {
    await modulePage.gotoList();

    await expect(modulePage.table).toBeVisible();
    const rowCount = await modulePage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('2. should navigate to create form via Add button', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickAdd();

    await expect(page).toHaveURL(/\/accounts\/new/);
    // Verify form structure — accounts has toggles and form fields
    await expect(page.locator('input[placeholder="Company title"]')).toBeVisible({ timeout: 10000 });
  });

  test('3. should create a new account', async ({ page }) => {
    await modulePage.gotoCreate();

    // Fill basic information — no guards
    await page.locator('input[placeholder="Company title"]').fill(testData.name);
    await page.locator('input[placeholder="Code"]').fill(testData.code);
    await page.locator('input[placeholder="Email"]').first().fill(testData.email);
    await page.locator('input[placeholder="Phone"]').first().fill(testData.phone);

    // Select first option for all visible selects (accountType is REQUIRED)
    const selects = page.locator('select.ui-select__field');
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
      const sel = selects.nth(i);
      if (await sel.isVisible().catch(() => false)) {
        await sel.selectOption({ index: 1 });
      }
    }

    await modulePage.saveAndExpectList();

    // VERIFY: The created account appears in the list
    await modulePage.verifyRowExists(testId);
  });

  test('4. should navigate to edit page via actions dropdown', async ({ page }) => {
    await modulePage.gotoList();

    await modulePage.clickEdit(0);

    await expect(page).toHaveURL(/\/accounts\/[\w-]+\/edit/);
    await expect(page.locator('input[placeholder="Company title"]')).toBeVisible({ timeout: 10000 });
  });

  test('5. should edit an existing account', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickEdit(0);

    // Modify the title field
    const nameInput = page.locator('input[placeholder="Company title"]');
    await expect(nameInput).toBeVisible();
    const currentName = await nameInput.inputValue();
    await nameInput.fill(`${currentName} Edited`);

    await modulePage.saveAndExpectList();
  });

  test('6. should delete an account via actions dropdown', async ({ page }) => {
    await modulePage.gotoList();

    const rowIndex = await modulePage.findRowWithText('E2E');
    test.skip(rowIndex === -1, 'No test account found to delete');

    await modulePage.clickDeleteAndConfirm(rowIndex);

    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/accounts\/list/);
  });

  test('7. should search/filter accounts', async ({ page }) => {
    await modulePage.gotoList();

    // Search is client-side
    await modulePage.search('test');

    await expect(modulePage.table).toBeVisible();
  });

  test('8. should navigate through account tabs', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickEdit(0);

    // Check for tabs
    const tabsSection = page.locator('ui-tabs').first();
    await expect(tabsSection).toBeVisible({ timeout: 5000 });

    // Click through internal tabs
    const internalTabNames = ['Contacts', 'Addresses', 'Machines'];
    for (const tabName of internalTabNames) {
      const tab = tabsSection.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`).first();
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }

    await expect(page).toHaveURL(/\/accounts\/[\w-]+\/edit/);
  });

  test('9. should toggle account status', async ({ page }) => {
    await modulePage.gotoList();
    await modulePage.clickEdit(0);

    // Find the "Is active" toggle
    const activeToggle = page.locator('ui-toggle').filter({ hasText: /active/i }).first();
    await expect(activeToggle).toBeVisible({ timeout: 3000 });

    // Click to toggle the state
    await activeToggle.click();
    await page.waitForTimeout(300);

    // Toggle back to original state
    await activeToggle.click();

    await expect(page).toHaveURL(/\/accounts\/[\w-]+\/edit/);
  });

  test('10. should cancel and go back to list', async ({ page }) => {
    await modulePage.gotoCreate();
    await modulePage.goBack();

    await expect(page).toHaveURL(/\/accounts\/list/);
  });
});
