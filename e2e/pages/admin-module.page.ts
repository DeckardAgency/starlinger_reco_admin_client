import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export interface ModuleConfig {
  name: string;
  listPath: string;
  apiEndpoint: string;
  formFields: FormFieldConfig[];
}

export interface FormFieldConfig {
  name: string;
  placeholder: string;
  type?: 'text' | 'number' | 'select' | 'toggle' | 'textarea';
  required?: boolean;
}

/**
 * Generic Admin Module Page Object
 * Handles list view, create form, and edit form for any admin module
 */
export class AdminModulePage extends BasePage {
  constructor(page: Page, private config: ModuleConfig) {
    super(page);
  }

  // ==================== Navigation ====================

  async gotoList() {
    await this.page.goto(`/admin/${this.config.listPath}/list`);
    await this.waitForPageLoad();
    await this.waitForListData();
  }

  async gotoCreate() {
    await this.page.goto(`/admin/${this.config.listPath}/new`);
    await this.waitForPageLoad();
  }

  async gotoEdit(id: string) {
    await this.page.goto(`/admin/${this.config.listPath}/${id}/edit`);
    await this.waitForPageLoad();
    await this.waitForFormData();
  }

  // ==================== List View ====================

  get table(): Locator {
    return this.page.locator('ui-data-table, table').first();
  }

  get tableRows(): Locator {
    return this.page.locator('ui-data-table tbody tr, table tbody tr');
  }

  get addButton(): Locator {
    return this.page.locator('ui-list-header button:has-text("Add"), button:has-text("Add")').first();
  }

  get searchInput(): Locator {
    return this.page.locator('ui-list-header input[type="text"], input[placeholder*="Search"]').first();
  }

  actionsDropdown(index: number = 0): Locator {
    return this.page.locator('ui-table-actions-dropdown').nth(index);
  }

  async waitForListData() {
    await this.page.waitForResponse(
      resp => resp.url().includes(this.config.apiEndpoint) && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {});
  }

  async clickAdd() {
    await this.addButton.click();
    await expect(this.page).toHaveURL(new RegExp(`/${this.config.listPath}/new`));
  }

  async openRowActions(index: number = 0) {
    const dropdown = this.actionsDropdown(index);
    await dropdown.locator('button').first().click();
  }

  async clickEdit(index: number = 0) {
    await this.openRowActions(index);
    await this.page.locator('text="Edit"').first().click();
    await expect(this.page).toHaveURL(new RegExp(`/${this.config.listPath}/[\\w-]+/edit`), { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
    // Wait for form to be visible (not for specific data)
    await this.page.waitForTimeout(1000);
  }

  async clickDelete(index: number = 0) {
    await this.openRowActions(index);
    await this.page.locator('text="Delete"').first().click();
  }

  async confirmDelete() {
    const confirmBtn = this.page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await this.page.waitForResponse(
      resp => resp.url().includes(this.config.apiEndpoint) && resp.request().method() === 'DELETE',
      { timeout: 10000 }
    ).catch(() => {});
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async hasData(): Promise<boolean> {
    const count = await this.getRowCount();
    return count > 0;
  }

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

  // ==================== Form View ====================

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save', exact: true });
  }

  get saveAndContinueButton(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get backButton(): Locator {
    return this.page.locator('ui-detail-header button').first();
  }

  getInput(placeholder: string): Locator {
    return this.page.locator(`input[placeholder="${placeholder}"]`);
  }

  getTextarea(placeholder: string): Locator {
    return this.page.locator(`textarea[placeholder="${placeholder}"]`);
  }

  getSelect(): Locator {
    return this.page.locator('select.select-field').first();
  }

  getToggle(label: string): Locator {
    return this.page.locator(`ui-toggle`).filter({ hasText: label });
  }

  async waitForFormData() {
    // Wait for form inputs to be populated
    const firstField = this.config.formFields[0];
    if (firstField) {
      const input = this.getInput(firstField.placeholder);
      await expect(async () => {
        const value = await input.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }).toPass({ timeout: 10000 });
    }
  }

  async fillField(placeholder: string, value: string) {
    const input = this.getInput(placeholder);
    await input.fill(value);
  }

  async fillTextarea(placeholder: string, value: string) {
    const textarea = this.getTextarea(placeholder);
    await textarea.fill(value);
  }

  async selectOption(index: number = 0) {
    const select = this.page.locator('select.select-field').nth(index);
    await select.selectOption({ index: 1 });
  }

  async fillForm(data: Record<string, string>) {
    for (const field of this.config.formFields) {
      const value = data[field.name];
      if (value !== undefined) {
        if (field.type === 'textarea') {
          await this.fillTextarea(field.placeholder, value);
        } else {
          await this.fillField(field.placeholder, value);
        }
      }
    }
  }

  async save() {
    await this.saveButton.click();
  }

  async saveAndExpectList() {
    // Click save and wait for both API response and navigation
    await Promise.all([
      this.page.waitForResponse(
        resp => resp.url().includes(this.config.apiEndpoint) &&
                (resp.request().method() === 'POST' ||
                 resp.request().method() === 'PATCH' ||
                 resp.request().method() === 'PUT'),
        { timeout: 15000 }
      ).catch(() => {}),
      this.saveButton.click(),
    ]);

    // Wait for redirect to list
    await expect(this.page).toHaveURL(new RegExp(`/${this.config.listPath}`), { timeout: 15000 });
  }

  async goBack() {
    await this.backButton.click();
    await expect(this.page).toHaveURL(new RegExp(`/${this.config.listPath}/list`), { timeout: 10000 });
  }

  async getCurrentInputValue(placeholder: string): Promise<string> {
    const input = this.getInput(placeholder);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    return input.inputValue();
  }
}

// ==================== Module Configurations ====================

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  // Simple CRUD Modules
  countries: {
    name: 'Countries',
    listPath: 'countries',
    apiEndpoint: '/countries',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'code', placeholder: 'Enter code', required: true },
      { name: 'iso3Code', placeholder: 'Enter ISO code' },
      { name: 'taxPercent', placeholder: '0,00', type: 'number' },
    ],
  },
  warehouses: {
    name: 'Warehouses',
    listPath: 'warehouses',
    apiEndpoint: '/warehouses',
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
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'grossFactor', placeholder: '1,00', type: 'number' },
      { name: 'order', placeholder: '0', type: 'number' },
    ],
  },
  paymentTypes: {
    name: 'Payment Types',
    listPath: 'payment-types',
    apiEndpoint: '/payment_types',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
    ],
  },
  taxTypes: {
    name: 'Tax Types',
    listPath: 'tax-types',
    apiEndpoint: '/tax_types',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'percent', placeholder: '0,00', type: 'number' },
    ],
  },
  discounts: {
    name: 'Discounts',
    listPath: 'discounts',
    apiEndpoint: '/discounts',
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
    ],
  },
  productGroups: {
    name: 'Product Groups',
    listPath: 'product-groups',
    apiEndpoint: '/product_groups',
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
    formFields: [
      { name: 'name', placeholder: 'Enter name', required: true },
      { name: 'sizeFrom', placeholder: '0', type: 'number' },
      { name: 'sizeTo', placeholder: '0', type: 'number' },
      { name: 'priceBase', placeholder: '0,00', type: 'number' },
    ],
  },
  packagingPrices: {
    name: 'Packaging Prices',
    listPath: 'packaging-prices',
    apiEndpoint: '/packaging_prices',
    formFields: [
      { name: 'sizeFrom', placeholder: '0', type: 'number' },
      { name: 'sizeTo', placeholder: '0', type: 'number' },
      { name: 'priceBase', placeholder: '0', type: 'number' },
    ],
  },
  fuelSurcharges: {
    name: 'Fuel Surcharges',
    listPath: 'fuel-surcharges',
    apiEndpoint: '/fuel_surcharges',
    formFields: [
      { name: 'date', placeholder: '01/01/2025' },
      { name: 'fuelSurcharge', placeholder: '1,025', type: 'number' },
    ],
  },
  // Complex CRUD Modules (have custom form logic)
  users: {
    name: 'Users',
    listPath: 'users',
    apiEndpoint: '/users',
    formFields: [
      { name: 'firstName', placeholder: 'Enter first name', required: true },
      { name: 'lastName', placeholder: 'Enter last name', required: true },
      { name: 'email', placeholder: 'Enter email', required: true },
      { name: 'username', placeholder: 'Enter username' },
    ],
  },
  contacts: {
    name: 'Contacts',
    listPath: 'contacts',
    apiEndpoint: '/users',
    formFields: [
      { name: 'firstName', placeholder: 'First name' },
      { name: 'lastName', placeholder: 'Last name' },
      { name: 'phone', placeholder: 'Phone' },
      { name: 'email', placeholder: 'Email' },
    ],
  },
  accounts: {
    name: 'Accounts',
    listPath: 'accounts',
    apiEndpoint: '/clients',
    formFields: [
      { name: 'name', placeholder: 'Company title', required: true },
      { name: 'code', placeholder: 'Code' },
      { name: 'email', placeholder: 'Email' },
      { name: 'phone', placeholder: 'Phone' },
    ],
  },
  products: {
    name: 'Products',
    listPath: 'products',
    apiEndpoint: '/products',
    formFields: [
      { name: 'name', placeholder: 'Name', required: true },
      { name: 'code', placeholder: 'Code' },
    ],
  },
};
