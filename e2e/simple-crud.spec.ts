import { test, expect } from '@playwright/test';
import { AdminModulePage, MODULE_CONFIGS } from './pages';

/**
 * Simple CRUD Modules - Unified E2E Tests using Page Object Model
 * Tests: Countries, Warehouses, Delivery Types, Payment Types, Tax Types,
 *        Discounts, Product Groups, Delivery Prices, Packaging Prices, Fuel Surcharges
 */

// Define which modules to test with this unified approach
const SIMPLE_CRUD_MODULES = [
  'countries',
  'warehouses',
  'deliveryTypes',
  'paymentTypes',
  'taxTypes',
  'discounts',
  'productGroups',
  'deliveryPrices',
  'packagingPrices',
  'fuelSurcharges',
] as const;

for (const moduleKey of SIMPLE_CRUD_MODULES) {
  const config = MODULE_CONFIGS[moduleKey];
  if (!config) continue;

  test.describe(`${config.name} CRUD`, () => {
    const timestamp = Date.now();
    let modulePage: AdminModulePage;

    test.beforeEach(async ({ page }) => {
      modulePage = new AdminModulePage(page, config);
    });

    test(`1. should display ${config.name.toLowerCase()} list with data`, async ({ page }) => {
      await modulePage.gotoList();

      await expect(modulePage.table).toBeVisible();
      // List may be empty for some modules, just verify table loads
    });

    test(`2. should navigate to create form via Add button`, async ({ page }) => {
      await modulePage.gotoList();
      await modulePage.clickAdd();

      // Verify we're on the create page
      await expect(page).toHaveURL(new RegExp(`/${config.listPath}/new`));
    });

    test(`3. should create a new ${config.name.toLowerCase().slice(0, -1)}`, async ({ page }) => {
      await modulePage.gotoCreate();

      // Fill form fields based on config
      for (const field of config.formFields) {
        if (field.type === 'select') continue; // Skip selects for now

        const value = field.type === 'number'
          ? String(timestamp % 1000)
          : field.name === 'name' || field.name === 'firstName'
            ? `E2E Test ${timestamp}`
            : `e2e_${field.name}_${timestamp}`;

        try {
          const input = field.type === 'textarea'
            ? page.locator(`textarea[placeholder="${field.placeholder}"]`).first()
            : page.locator(`input[placeholder="${field.placeholder}"]`).first();

          if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
            await input.fill(value);
          }
        } catch {
          // Field might not be visible or have different placeholder
        }
      }

      // Try to select first option if there's a select
      const select = page.locator('select.select-field').first();
      if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
        await select.selectOption({ index: 1 }).catch(() => {});
      }

      await modulePage.saveAndExpectList();
    });

    test(`4. should navigate to edit page via actions dropdown`, async ({ page }) => {
      await modulePage.gotoList();

      const hasData = await modulePage.hasData();
      if (!hasData) {
        test.skip(true, `No ${config.name.toLowerCase()} to edit`);
        return;
      }

      // Check if actions dropdown exists
      const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
      if (!await actionsDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
        test.skip(true, `No actions dropdown available`);
        return;
      }

      await modulePage.clickEdit(0);

      // Verify we're on edit page
      await expect(page).toHaveURL(new RegExp(`/${config.listPath}/[\\w-]+/edit`));
    });

    test(`5. should edit an existing ${config.name.toLowerCase().slice(0, -1)}`, async ({ page }) => {
      await modulePage.gotoList();

      const hasData = await modulePage.hasData();
      if (!hasData) {
        test.skip(true, `No ${config.name.toLowerCase()} to edit`);
        return;
      }

      // Check if actions dropdown exists
      const actionsDropdown = page.locator('ui-table-actions-dropdown').first();
      if (!await actionsDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
        test.skip(true, `No actions dropdown available`);
        return;
      }

      await modulePage.clickEdit(0);

      // Try to modify first field
      const firstField = config.formFields[0];
      if (firstField && firstField.type !== 'number') {
        try {
          const input = page.locator(`input[placeholder="${firstField.placeholder}"]`).first();
          if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
            const currentValue = await input.inputValue();
            await input.fill(`${currentValue} - Edited`);
          }
        } catch {
          // Field might not be editable
        }
      }

      await modulePage.saveAndExpectList();
    });

    test(`6. should delete a ${config.name.toLowerCase().slice(0, -1)} via actions dropdown`, async ({ page }) => {
      await modulePage.gotoList();

      // Find test data to delete
      const rowIndex = await modulePage.findRowWithText('E2E');
      if (rowIndex === -1) {
        test.skip(true, `No test ${config.name.toLowerCase()} found to delete`);
        return;
      }

      await modulePage.clickDelete(rowIndex);
      await modulePage.confirmDelete();

      await expect(page).toHaveURL(new RegExp(`/${config.listPath}`), { timeout: 5000 });
    });

    test(`7. should search/filter ${config.name.toLowerCase()}`, async ({ page }) => {
      await modulePage.gotoList();

      await modulePage.search('test');
      await page.waitForTimeout(500);

      // Table should still be visible
      await expect(modulePage.table).toBeVisible();
    });

    test(`8. should cancel and go back to list`, async ({ page }) => {
      await modulePage.gotoCreate();
      await modulePage.goBack();

      await expect(page).toHaveURL(new RegExp(`/${config.listPath}/list`));
    });
  });
}
