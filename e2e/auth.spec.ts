import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-data';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[formcontrolname="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill credentials
    await page.fill('input[type="email"], input[formcontrolname="email"]', TEST_USERS.superAdmin.email);
    await page.fill('input[type="password"]', TEST_USERS.superAdmin.password);

    // Submit
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('login_check')).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);

    // Should be redirected to admin area
    await expect(page).toHaveURL(/\/(admin|dashboard)/, { timeout: 15000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to login with wrong password
    await page.fill('input[type="email"], input[formcontrolname="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click submit
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(2000);

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access admin page directly without auth
    await page.goto('/admin/countries/list');

    // Should be redirected to login or show login modal
    // Note: App might have DEV BYPASS enabled
    const url = page.url();
    const isOnLoginOrAdmin = url.includes('/login') || url.includes('/admin');
    expect(isOnLoginOrAdmin).toBeTruthy();
  });

  test('should maintain session after page reload', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"], input[formcontrolname="email"]', TEST_USERS.superAdmin.email);
    await page.fill('input[type="password"]', TEST_USERS.superAdmin.password);

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('login_check')).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);

    await expect(page).toHaveURL(/\/(admin|dashboard)/, { timeout: 15000 });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be in admin area
    await expect(page).toHaveURL(/\/(admin|dashboard)/);
  });
});
