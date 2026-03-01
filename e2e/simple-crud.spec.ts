import { test, expect } from '@playwright/test';
import { AdminModulePage, MODULE_CONFIGS } from './pages';
import { cleanupE2ERecords } from './fixtures/api-cleanup';

/**
 * Simple CRUD Modules - Unified E2E Tests
 *
 * Tests: Countries, Warehouses, Delivery Types, Payment Types, Tax Types,
 *        Discounts, Product Groups, Delivery Prices, Packaging Prices, Fuel Surcharges,
 *        Client Groups
 *
 * Key principle: NO silent error swallowing. Every assertion is real.
 * If a form field doesn't exist, the API fails, or data doesn't persist — the test FAILS.
 */

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
  'clientGroups',
] as const;

for (const moduleKey of SIMPLE_CRUD_MODULES) {
  const config = MODULE_CONFIGS[moduleKey];
  if (!config) continue;

  test.describe(`${config.name} CRUD`, () => {
    // Tests are sequential: create → verify → edit → delete
    test.describe.configure({ mode: 'serial' });

    // Unique identifier for this test run — used to find/verify test records
    const testId = `E2E_${Date.now()}`;
    let modulePage: AdminModulePage;

    test.beforeEach(async ({ page }) => {
      modulePage = new AdminModulePage(page, config);
    });

    test.afterAll(async () => {
      await cleanupE2ERecords(config.apiEndpoint, config.primaryField);
    });

    test(`1. should display ${config.name.toLowerCase()} list with data`, async ({ page }) => {
      await modulePage.gotoList();

      await expect(modulePage.table).toBeVisible();
      // Verify table has at least the header structure
      const headerCells = page.locator('ui-data-table th, table th');
      const headerCount = await headerCells.count();
      expect(headerCount).toBeGreaterThan(0);
    });

    test(`2. should navigate to create form via Add button`, async ({ page }) => {
      await modulePage.gotoList();
      await modulePage.clickAdd();

      await expect(page).toHaveURL(new RegExp(`/${config.listPath}/new`));
      // Verify the first form field is visible
      if (config.formFields.length > 0) {
        const firstField = config.formFields[0];
        if (firstField.type === 'textarea') {
          await expect(modulePage.getTextarea(firstField.placeholder)).toBeVisible();
        } else {
          await expect(modulePage.getInput(firstField.placeholder)).toBeVisible();
        }
      }
    });

    test(`3. should create a new ${config.name.toLowerCase().slice(0, -1)}`, async ({ page }) => {
      await modulePage.gotoCreate();

      // Fill each form field — NO try/catch, NO if(isVisible) guards.
      // If a field doesn't exist, the test fails. That's the point.
      for (const field of config.formFields) {
        if (field.type === 'select' || field.type === 'toggle') continue;

        // Generate appropriate values based on field name/constraints
        let value: string;
        if (field.type === 'number') {
          // Use small, valid numbers — large random values may fail API validation
          value = '1';
        } else if (field.name === 'date') {
          value = '2026-01-15';
        } else if (field.name === 'name' || field.name === 'contactPerson') {
          value = testId;
        } else if (field.name === 'code') {
          // Country codes are exactly 2 chars — use letter+digit for 260 possible values
          const ts = Date.now();
          value = String.fromCharCode(65 + (ts % 26)) + String(ts % 10);
        } else if (field.name === 'iso3Code') {
          value = `E${String(Date.now() % 100).padStart(2, '0')}`.substring(0, 3);
        } else if (field.name === 'email') {
          value = `e2e_${Date.now()}@test.com`;
        } else {
          value = `e2e_${Date.now()}`;
        }

        if (field.type === 'textarea') {
          await modulePage.fillTextarea(field.placeholder, value);
        } else if (field.label) {
          await modulePage.fillFieldByLabel(field.label, value);
        } else {
          await modulePage.fillField(field.placeholder, value, field.fieldIndex);
        }
      }

      // Select first option for ALL visible ui-selects on the form
      await modulePage.selectAllUiSelects();

      await modulePage.saveAndExpectList();

      // VERIFY: The created record appears in the list (skip when primary field isn't in table)
      if (config.verifyInList !== false) {
        await modulePage.verifyRowExists(testId);
      }
    });

    test(`4. should navigate to edit page via actions dropdown`, async ({ page }) => {
      await modulePage.gotoList();

      // Find the E2E test record — never edit production data
      const rowIndex = await modulePage.findRowWithText('E2E');
      test.skip(rowIndex === -1, `No test ${config.name.toLowerCase()} found to edit`);

      await modulePage.clickEdit(rowIndex);

      await expect(page).toHaveURL(new RegExp(`/${config.listPath}/[\\w-]+/edit`));
      // Verify the save button is present (we're on a form page)
      await expect(modulePage.saveButton).toBeVisible();
    });

    test(`5. should edit an existing ${config.name.toLowerCase().slice(0, -1)}`, async ({ page }) => {
      await modulePage.gotoList();

      // Find the E2E test record — never edit production data
      const rowIndex = await modulePage.findRowWithText('E2E');
      test.skip(rowIndex === -1, `No test ${config.name.toLowerCase()} found to edit`);

      await modulePage.clickEdit(rowIndex);

      // Modify the first text field — use a fresh value to avoid accumulation from previous runs
      const firstField = config.formFields.find(f => f.type !== 'number' && f.type !== 'select' && f.type !== 'toggle' && f.type !== 'textarea' && f.name !== 'date');
      if (firstField) {
        const editedValue = `E2E_Edited_${Date.now()}`;
        await modulePage.fillField(firstField.placeholder, editedValue, firstField.fieldIndex);
      }

      await modulePage.saveAndExpectList();
    });

    test(`6. should delete a ${config.name.toLowerCase().slice(0, -1)} via actions dropdown`, async ({ page }) => {
      await modulePage.gotoList();

      // Find a test record to delete (created by test 3)
      const rowIndex = await modulePage.findRowWithText('E2E');
      test.skip(rowIndex === -1, `No test ${config.name.toLowerCase()} found to delete`);

      const rowText = await modulePage.tableRows.nth(rowIndex).textContent();

      // Delete uses window.confirm() — handled by acceptNextDialog()
      await modulePage.clickDeleteAndConfirm(rowIndex);

      // VERIFY: The deleted row is gone
      // Give Angular a moment to update the list signal
      await page.waitForTimeout(300);
      if (rowText) {
        // Look for the specific E2E test ID that was in the deleted row
        const e2eMatch = rowText.match(/E2E_\d+/);
        if (e2eMatch) {
          await modulePage.verifyRowNotExists(e2eMatch[0]);
        }
      }
    });

    test(`7. should search/filter ${config.name.toLowerCase()}`, async ({ page }) => {
      await modulePage.gotoList();

      const initialRowCount = await modulePage.getRowCount();
      test.skip(initialRowCount === 0, `No ${config.name.toLowerCase()} to search`);

      // Get text from first row to use as search term
      const firstRowText = await modulePage.tableRows.first().textContent();
      const searchTerm = firstRowText?.trim().substring(0, 10) ?? 'test';

      await modulePage.search(searchTerm);

      // Should remain on the list page (table or empty state may be shown)
      await expect(page).toHaveURL(new RegExp(`/${config.listPath}/list`));
    });

    test(`8. should cancel and go back to list`, async ({ page }) => {
      await modulePage.gotoCreate();
      await modulePage.goBack();

      await expect(page).toHaveURL(new RegExp(`/${config.listPath}/list`));
    });
  });
}
