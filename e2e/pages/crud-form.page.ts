import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface FormField {
  name: string;
  value: string | boolean | number;
  type?: 'text' | 'select' | 'checkbox' | 'toggle' | 'number';
}

export class CrudFormPage extends BasePage {
  // Selectors
  private get saveButton(): Locator {
    return this.page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Create"), button[type="submit"]').first();
  }

  private get cancelButton(): Locator {
    return this.page.locator('button:has-text("Cancel"), button:has-text("Back"), a:has-text("Cancel")').first();
  }

  private get form(): Locator {
    return this.page.locator('form').first();
  }

  async fillField(fieldName: string, value: string | boolean | number, type: string = 'text') {
    // Try multiple selector strategies
    const selectors = [
      `input[formcontrolname="${fieldName}"]`,
      `input[name="${fieldName}"]`,
      `input[id="${fieldName}"]`,
      `input[placeholder*="${fieldName}" i]`,
      `textarea[formcontrolname="${fieldName}"]`,
      `textarea[name="${fieldName}"]`,
      `select[formcontrolname="${fieldName}"]`,
      `select[name="${fieldName}"]`,
    ];

    for (const selector of selectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (type === 'select') {
          await element.selectOption({ label: String(value) }).catch(async () => {
            await element.selectOption(String(value));
          });
        } else if (type === 'checkbox' || type === 'toggle') {
          const isChecked = await element.isChecked();
          if (isChecked !== Boolean(value)) {
            await element.click();
          }
        } else {
          await element.fill(String(value));
        }
        return;
      }
    }

    // Try label-based selection
    const labelElement = this.page.locator(`label:has-text("${fieldName}")`).first();
    if (await labelElement.isVisible({ timeout: 1000 }).catch(() => false)) {
      const forAttr = await labelElement.getAttribute('for');
      if (forAttr) {
        const input = this.page.locator(`#${forAttr}`);
        if (type === 'select') {
          await input.selectOption(String(value));
        } else if (type === 'checkbox' || type === 'toggle') {
          const isChecked = await input.isChecked();
          if (isChecked !== Boolean(value)) {
            await input.click();
          }
        } else {
          await input.fill(String(value));
        }
        return;
      }
    }

    throw new Error(`Could not find field: ${fieldName}`);
  }

  async fillFields(fields: FormField[]) {
    for (const field of fields) {
      await this.fillField(field.name, field.value, field.type || 'text');
    }
  }

  async getFieldValue(fieldName: string): Promise<string> {
    const selectors = [
      `input[formcontrolname="${fieldName}"]`,
      `input[name="${fieldName}"]`,
      `input[id="${fieldName}"]`,
      `textarea[formcontrolname="${fieldName}"]`,
      `select[formcontrolname="${fieldName}"]`,
    ];

    for (const selector of selectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        return await element.inputValue();
      }
    }

    return '';
  }

  async save() {
    await this.saveButton.click();
  }

  async saveAndWaitForNavigation(listUrlPattern: string | RegExp = /\/list/) {
    await Promise.all([
      this.page.waitForURL(listUrlPattern, { timeout: 10000 }),
      this.saveButton.click(),
    ]);
  }

  async saveAndWaitForApi(apiEndpoint: string) {
    await Promise.all([
      this.page.waitForResponse(
        resp => resp.url().includes(apiEndpoint) && (resp.status() === 200 || resp.status() === 201)
      ),
      this.saveButton.click(),
    ]);
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async hasValidationError(): Promise<boolean> {
    const errorSelectors = [
      '.error',
      '.invalid-feedback',
      '[class*="error"]',
      '.field-error',
      'mat-error',
    ];

    for (const selector of errorSelectors) {
      const error = this.page.locator(selector).first();
      if (await error.isVisible({ timeout: 1000 }).catch(() => false)) {
        return true;
      }
    }
    return false;
  }

  async getValidationErrors(): Promise<string[]> {
    const errors: string[] = [];
    const errorElements = await this.page.locator('.error, .invalid-feedback, [class*="error-message"]').all();

    for (const el of errorElements) {
      const text = await el.textContent();
      if (text) errors.push(text.trim());
    }

    return errors;
  }

  async isFormValid(): Promise<boolean> {
    // Check if save button is enabled
    const isDisabled = await this.saveButton.isDisabled();
    return !isDisabled;
  }
}
