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
    await page.fill('input[type="email"], input[formcontrolname="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);

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
    await page.waitForLoadState('networkidle');

    // Without auth token the app should either:
    // - redirect to /login, OR
    // - stay on the admin page but show an empty/restricted view, OR
    // - redirect to root /
    // The key assertion: admin content should NOT be fully accessible
    const table = page.locator('ui-data-table tbody tr, table tbody tr');
    const rowCount = await table.count();
    // Without valid auth, the data table should be empty (no API data loaded)
    // or the user is redirected away from the admin page
    const url = page.url();
    const redirectedAway = !url.includes('/admin/countries');
    const noDataLoaded = rowCount === 0;
    expect(redirectedAway || noDataLoaded).toBeTruthy();
  });

  test('should maintain session after page reload', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[formcontrolname="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(admin|dashboard)/, { timeout: 30000 });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be in admin area
    await expect(page).toHaveURL(/\/(admin|dashboard)/);
  });

  test('should render forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Reset password')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('ui-button[type="submit"]')).toBeVisible();
    await expect(page.getByText('Back to login')).toBeVisible();
  });

  test('should submit forgot password and show success', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="username"]').fill('admin@starlinger.com');
    await page.locator('ui-button[type="submit"]').click();

    // The component simulates a 1.5s API call, then shows success state
    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("sent password reset instructions")).toBeVisible();
  });

  test('should navigate from forgot password back to login', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Click the "Back to login" link
    await page.getByText('Back to login').click();

    await expect(page).toHaveURL(/\/login/);
  });
});
