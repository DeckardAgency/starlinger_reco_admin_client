import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export interface ModuleConfig {
  name: string;
  listPath: string;
  apiEndpoint: string;
  /** The primary text field used for creating unique test records (used in list verification). */
  primaryField: string;
  formFields: FormFieldConfig[];
  /** Set to false for modules that only have "Save" (no "Save and continue"). Defaults to true. */
  hasSaveAndContinue?: boolean;
  /** Set to false when primaryField isn't displayed in list table (skips verifyRowExists). */
  verifyInList?: boolean;
}

export interface FormFieldConfig {
  name: string;
  /** Exact placeholder text. If empty string, field is located by label or index. */
  placeholder: string;
  type?: 'text' | 'number' | 'select' | 'toggle' | 'textarea';
  required?: boolean;
  /** When multiple inputs share the same placeholder, use nth(fieldIndex) to select the right one. */
  fieldIndex?: number;
  /** For inputs without placeholders, locate by label text inside ui-form-field container. */
  label?: string;
}

/**
 * Generic Admin Module Page Object
 * Handles list view, create form, and edit form for any admin module.
 *
 * Key design principle: NO silent error swallowing.
 * If an element doesn't exist or an API call fails, the test fails.
 */
export class AdminModulePage extends BasePage {
  constructor(page: Page, private config: ModuleConfig) {
    super(page);
  }

  // ==================== Navigation ====================

  async gotoList() {
    // Start listening for the API response BEFORE navigating to avoid race conditions.
    // By the time networkidle fires, the response has already arrived.
    const responsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes(this.config.apiEndpoint) && resp.request().method() === 'GET',
      { timeout: 15000 }
    );
    await this.page.goto(`/admin/${this.config.listPath}/list`);
    const response = await responsePromise;
    expect(response.status(), `List API ${this.config.apiEndpoint} returned ${response.status()}`).toBeLessThan(400);
    // Wait for Angular to render the table after API data is received
    await this.page.waitForLoadState('networkidle');
  }

  async gotoCreate() {
    await this.page.goto(`/admin/${this.config.listPath}/new`);
    await this.waitForPageLoad();
  }

  // ==================== List View ====================

  get table(): Locator {
    return this.page.locator('ui-data-table, table').first();
  }

  get tableRows(): Locator {
    return this.page.locator('ui-data-table tbody tr, table tbody tr');
  }

  get addButton(): Locator {
    return this.page.locator('ui-list-header button.btn--primary').first();
  }

  get searchInput(): Locator {
    return this.page.locator('ui-list-header input[type="text"]').first();
  }

  actionsDropdown(index: number = 0): Locator {
    return this.page.locator('ui-table-actions-dropdown').nth(index);
  }

  async clickAdd() {
    await this.addButton.click();
    await expect(this.page).toHaveURL(new RegExp(`/${this.config.listPath}/new`));
  }

  async openRowActions(index: number = 0) {
    const dropdown = this.actionsDropdown(index);
    await dropdown.locator('button').first().click();
    // Wait for dropdown menu to appear and animation to settle
    await expect(this.page.locator('.dropdown-menu').first()).toBeVisible({ timeout: 3000 });
    await this.page.waitForTimeout(200);
  }

  async clickEdit(index: number = 0) {
    await this.openRowActions(index);
    await this.page.locator('.dropdown-menu__item:has-text("Edit")').first().click();
    await expect(this.page).toHaveURL(new RegExp(`/${this.config.listPath}/[\\w-]+/edit`), { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
    // Wait for form fields to be present
    await this.waitForFormData();
  }

  /**
   * Click delete on a row. Handles the native browser confirm() dialog.
   * The dialog handler is set up BEFORE clicking, which is the correct order.
   */
  async clickDeleteAndConfirm(index: number = 0) {
    await this.openRowActions(index);
    // Handle BOTH native confirm() and custom modal dialogs
    this.acceptNextDialog();
    const responsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes(this.config.apiEndpoint) && resp.request().method() === 'DELETE',
      { timeout: 15000 }
    );
    await this.page.locator('.dropdown-menu__item:has-text("Delete")').first().click();
    // Some modules show a custom alertdialog modal instead of native confirm()
    const confirmBtn = this.page.locator('[role="alertdialog"]').filter({ hasText: 'Delete' })
      .locator('button', { hasText: 'Confirm' });
    try {
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });
      await confirmBtn.click();
    } catch {
      // No custom dialog — native confirm() was handled by acceptNextDialog()
    }
    // For native dialog: response arrives immediately after auto-accept
    // For custom dialog: response arrives after Confirm click
    const response = await responsePromise;
    expect(response.status(), `DELETE ${this.config.apiEndpoint} returned ${response.status()}`).toBeLessThan(400);
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Search may be client-side (filters current page) or server-side (triggers API call).
    // Wait for potential API response, then allow Angular to re-render.
    await this.page.waitForTimeout(500);
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async hasData(): Promise<boolean> {
    const count = await this.getRowCount();
    return count > 0;
  }

  /** Find the index of a row containing the given text. Returns -1 if not found. */
  async findRowWithText(text: string): Promise<number> {
    const count = await this.getRowCount();
    for (let i = 0; i < count; i++) {
      const rowText = await this.tableRows.nth(i).textContent();
      if (rowText?.includes(text)) {
        return i;
      }
    }
    return -1;
  }

  /** Assert that a row containing the given text exists in the table.
   *  Uses server-side search to find the record (handles pagination). */
  async verifyRowExists(text: string) {
    // Small stability wait for list to settle after navigation
    await this.page.waitForTimeout(300);

    // Match ONLY the search-triggered GET (URL must contain our search text as a query param)
    const searchFragment = text.substring(0, 10);
    const responsePromise = this.page.waitForResponse(
      (resp) =>
        resp.url().includes(this.config.apiEndpoint) &&
        resp.request().method() === 'GET' &&
        resp.url().includes(searchFragment),
      { timeout: 15000 }
    );
    await this.searchInput.fill(text);
    await responsePromise;
    await this.page.waitForLoadState('networkidle');

    await expect(
      this.page.locator('ui-data-table tbody tr, table tbody tr').filter({ hasText: text }).first()
    ).toBeVisible({ timeout: 10000 });

    // Clear search to restore full list for subsequent tests
    await this.searchInput.fill('');
    await this.page.waitForTimeout(500);
  }

  /** Assert that NO row contains the given text (auto-retrying). */
  async verifyRowNotExists(text: string) {
    await expect(
      this.page.locator('ui-data-table tbody tr, table tbody tr').filter({ hasText: text })
    ).toHaveCount(0, { timeout: 10000 });
  }

  // ==================== Form View ====================

  /** "Save" button (primary) — behaviour varies by module */
  get saveButton(): Locator {
    // Products uses section-header instead of ui-detail-header
    return this.page.locator('ui-detail-header button.btn--primary, .section-header button.btn--primary').first();
  }

  /** "Save and continue" button — behaviour varies by module */
  get saveAndGoToListButton(): Locator {
    // Match button in header area only (not mobile footer which has the same text)
    return this.page.locator('ui-detail-header, .section-header').first()
      .getByRole('button', { name: 'Save and continue' });
  }

  get backButton(): Locator {
    return this.page.locator('ui-detail-header button.btn--icon, .section-header button.btn--icon').first();
  }

  getInput(placeholder: string, fieldIndex?: number): Locator {
    const loc = this.page.locator(`input[placeholder="${placeholder}"]`);
    return fieldIndex !== undefined ? loc.nth(fieldIndex) : loc;
  }

  getTextarea(placeholder: string): Locator {
    return this.page.locator(`textarea[placeholder="${placeholder}"]`);
  }

  getSelect(index: number = 0): Locator {
    return this.page.locator('ui-select').nth(index);
  }

  /**
   * Select the first available option from a custom ui-select dropdown.
   * Clicks the trigger to open, then clicks the first non-disabled option.
   * Waits for the dropdown to actually close before returning.
   */
  async selectFirstUiOption(index: number = 0) {
    const select = this.page.locator('ui-select').nth(index);
    const trigger = select.locator('.ui-select__trigger');
    await expect(trigger).toBeVisible({ timeout: 5000 });
    await trigger.click();
    const dropdown = select.locator('.ui-select__dropdown');
    await expect(dropdown).toBeVisible({ timeout: 3000 });
    const option = select.locator('.ui-select__option').first();
    await option.click();
    // Wait for dropdown to actually close (option click sets isOpen=false)
    await dropdown.waitFor({ state: 'hidden', timeout: 3000 }).catch(async () => {
      // Fallback: press Escape to force close
      await this.page.keyboard.press('Escape');
      await dropdown.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
    });
    await this.page.waitForTimeout(150);
  }

  /**
   * Select the first option for ALL visible ui-selects on the current form.
   * Handles dropdown close reliably by waiting for each to close.
   */
  async selectAllUiSelects() {
    // Wait for async-loaded dropdown options (e.g. delivery types loaded from API)
    await this.page.waitForLoadState('networkidle');

    const selects = this.page.locator('ui-select');
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
      const sel = selects.nth(i);
      const trigger = sel.locator('.ui-select__trigger');
      if (await trigger.isVisible().catch(() => false)) {
        // Dispatch click directly on trigger via JS — guaranteed to fire Angular's handler
        // regardless of any overlapping elements from a previous dropdown animation
        await trigger.dispatchEvent('click');
        await this.page.waitForTimeout(200);

        const dropdown = sel.locator('.ui-select__dropdown');
        const dropdownVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
        if (!dropdownVisible) {
          // Retry once — dropdown might not have opened due to timing
          await trigger.dispatchEvent('click');
          const retryVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
          if (!retryVisible) continue;
        }

        const option = sel.locator('.ui-select__option').first();
        // Wait up to 5s for options (async-loaded options like delivery types need time)
        if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
          await option.click();
          // Wait for dropdown to actually close
          await dropdown.waitFor({ state: 'hidden', timeout: 3000 }).catch(async () => {
            await this.page.keyboard.press('Escape');
            await dropdown.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
          });
          await this.page.waitForTimeout(200);
        } else {
          // No options available — close dropdown and continue
          await this.page.keyboard.press('Escape');
          await dropdown.waitFor({ state: 'hidden', timeout: 1000 }).catch(() => {});
        }
      }
    }
  }

  async waitForFormData() {
    // Wait for the first text input field to be populated (edit mode)
    const firstTextField = this.config.formFields.find(f => f.type !== 'select' && f.type !== 'toggle' && f.placeholder);
    if (firstTextField) {
      const input = firstTextField.type === 'textarea'
        ? this.getTextarea(firstTextField.placeholder)
        : this.getInput(firstTextField.placeholder);
      await expect(input).toBeVisible({ timeout: 10000 });
    }
  }

  async fillField(placeholder: string, value: string, fieldIndex?: number) {
    const input = this.getInput(placeholder, fieldIndex);
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill(value);
  }

  async fillFieldByLabel(label: string, value: string) {
    const input = this.page.locator('ui-form-field').filter({ hasText: label }).locator('input').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill(value);
  }

  async fillTextarea(placeholder: string, value: string) {
    const textarea = this.getTextarea(placeholder);
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill(value);
  }

  async selectFirstOption(index: number = 0) {
    await this.selectFirstUiOption(index);
  }

  async fillForm(data: Record<string, string>) {
    for (const field of this.config.formFields) {
      const value = data[field.name];
      if (value !== undefined) {
        if (field.type === 'textarea') {
          await this.fillTextarea(field.placeholder, value);
        } else if (field.type === 'select' || field.type === 'toggle') {
          continue;
        } else if (field.label) {
          await this.fillFieldByLabel(field.label, value);
        } else {
          await this.fillField(field.placeholder, value, field.fieldIndex);
        }
      }
    }
  }

  async save() {
    await this.saveButton.click();
  }

  /**
   * Click Save, wait for the API response to succeed, then verify navigation to list.
   * NO error swallowing — if the API returns 4xx/5xx, the test fails.
   */
  async saveAndExpectList() {
    // Set up the listener BEFORE clicking, filtered to write methods only
    const responsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes(this.config.apiEndpoint) &&
                ['POST', 'PATCH', 'PUT'].includes(resp.request().method()),
      { timeout: 15000 }
    );

    // Let Angular process pending form value changes (OnPush needs time for signal updates)
    await this.page.waitForTimeout(300);

    if (this.config.hasSaveAndContinue !== false) {
      // "Save and continue" navigates to list automatically
      await this.saveAndGoToListButton.click();
    } else {
      // Modules without "Save and continue" — click "Save" (stays on form)
      await this.saveButton.click();
    }

    const response = await responsePromise;
    expect(response.status(), `Save API ${this.config.apiEndpoint} returned ${response.status()}`).toBeLessThan(400);

    if (this.config.hasSaveAndContinue !== false) {
      await expect(this.page).toHaveURL(new RegExp(`/${this.config.listPath}/list`), { timeout: 15000 });
    } else {
      // Navigate to list manually since Save stays on form
      await this.page.goto(`/admin/${this.config.listPath}/list`);
    }
    await this.page.waitForLoadState('networkidle');
  }

  async goBack() {
    await this.backButton.click();
    await expect(this.page).toHaveURL(new RegExp(`/${this.config.listPath}/list`), { timeout: 10000 });
  }

  async getCurrentInputValue(placeholder: string, fieldIndex?: number): Promise<string> {
    const input = this.getInput(placeholder, fieldIndex);
    await expect(input).toBeVisible({ timeout: 10000 });
    return input.inputValue();
  }
}

// ==================== Module Configurations ====================

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  countries: {
    name: 'Countries',
    listPath: 'countries',
    apiEndpoint: '/countries',
    primaryField: 'name',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'code', placeholder: 'Enter code', required: true },
      { name: 'iso3Code', placeholder: 'Enter ISO code' },
      { name: 'taxPercent', placeholder: '0.00', type: 'number' },
    ],
  },
  warehouses: {
    name: 'Warehouses',
    listPath: 'warehouses',
    apiEndpoint: '/warehouses',
    primaryField: 'name',
    formFields: [
      { name: 'contactPerson', placeholder: 'Enter contact person' },
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'address', placeholder: 'Enter address' },
      { name: 'city', placeholder: 'Enter city' },
      { name: 'phone', placeholder: 'Enter phone' },
      { name: 'email', placeholder: 'Enter email' },
    ],
  },
  deliveryTypes: {
    name: 'Delivery Types',
    listPath: 'delivery-types',
    apiEndpoint: '/delivery_types',
    primaryField: 'name',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'grossFactor', placeholder: '1.00', type: 'number' },
      { name: 'order', placeholder: '0', type: 'number' },
    ],
  },
  paymentTypes: {
    name: 'Payment Types',
    listPath: 'payment-types',
    apiEndpoint: '/payment_types',
    primaryField: 'name',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
    ],
  },
  taxTypes: {
    name: 'Tax Types',
    listPath: 'tax-types',
    apiEndpoint: '/tax_types',
    primaryField: 'name',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'percent', placeholder: '0', type: 'number' },
    ],
  },
  discounts: {
    name: 'Discounts',
    listPath: 'discounts',
    apiEndpoint: '/discounts',
    primaryField: 'name',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
    ],
  },
  productGroups: {
    name: 'Product Groups',
    listPath: 'product-groups',
    apiEndpoint: '/product_groups',
    primaryField: 'name',
    formFields: [
      { name: 'name', placeholder: 'Enter category name', required: true },
      { name: 'code', placeholder: 'Enter category code' },
      { name: 'description', placeholder: 'Enter description', type: 'textarea' },
    ],
  },
  deliveryPrices: {
    name: 'Delivery Prices',
    listPath: 'delivery-prices',
    apiEndpoint: '/delivery_prices',
    primaryField: 'name',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'sizeFrom', placeholder: '0', type: 'number', fieldIndex: 0 },
      { name: 'sizeTo', placeholder: '0', type: 'number', fieldIndex: 1 },
      { name: 'priceBase', placeholder: '0.00', type: 'number', fieldIndex: 0 },
    ],
  },
  packagingPrices: {
    name: 'Packaging Prices',
    listPath: 'packaging-prices',
    apiEndpoint: '/packaging_prices',
    primaryField: 'name',
    hasSaveAndContinue: false,
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'priceBase', placeholder: '', type: 'number', label: 'Price base', required: true },
    ],
  },
  fuelSurcharges: {
    name: 'Fuel Surcharges',
    listPath: 'fuel-surcharges',
    apiEndpoint: '/fuel_surcharges',
    primaryField: 'name',
    // "Save" goes to list; "Save and continue" stays on edit (reversed convention)
    hasSaveAndContinue: false,
    // Table shows Date/Surcharge/Delivery Type — name not displayed
    verifyInList: false,
    formFields: [
      { name: 'surcharge', placeholder: '0.0000', type: 'number', fieldIndex: 0 },
      { name: 'date', placeholder: '', label: 'Date', required: true },
      { name: 'name', placeholder: 'Optional name' },
    ],
  },
  users: {
    name: 'Users',
    listPath: 'users',
    apiEndpoint: '/users',
    primaryField: 'firstName',
    hasSaveAndContinue: false,
    formFields: [
      { name: 'firstName', placeholder: 'Enter first name', required: true },
      { name: 'lastName', placeholder: 'Enter last name', required: true },
      { name: 'username', placeholder: 'Enter username' },
      { name: 'email', placeholder: 'Enter email', required: true },
    ],
  },
  contacts: {
    name: 'Contacts',
    listPath: 'contacts',
    apiEndpoint: '/contacts',
    primaryField: 'firstName',
    hasSaveAndContinue: false,
    formFields: [
      { name: 'firstName', placeholder: 'First name' },
      { name: 'lastName', placeholder: 'Last name' },
      { name: 'phone', placeholder: 'Phone' },
      { name: 'email', placeholder: 'Email' },
    ],
  },
  accounts: {
    name: 'Accounts',
    listPath: 'clients',
    apiEndpoint: '/clients',
    primaryField: 'name',
    hasSaveAndContinue: false,
    formFields: [
      { name: 'name', placeholder: 'Company title', required: true },
      { name: 'code', placeholder: 'Code' },
      { name: 'email', placeholder: 'Email' },
      { name: 'phone', placeholder: 'Phone' },
    ],
  },
  clientGroups: {
    name: 'Client Groups',
    listPath: 'client-groups',
    apiEndpoint: '/account_groups',
    primaryField: 'name',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
    ],
  },
  products: {
    name: 'Products',
    listPath: 'products',
    apiEndpoint: '/products',
    primaryField: 'name',
    formFields: [
      { name: 'name', placeholder: 'Enter product name', required: true },
      { name: 'code', placeholder: 'Enter code' },
    ],
  },
};
