import { chromium, FullConfig } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-data';

const AUTH_FILE = 'e2e/.auth/user.json';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔐 Setting up authentication...');

  // Navigate to login page
  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[formcontrolname="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await emailInput.fill(TEST_USERS.superAdmin.email);
  await passwordInput.fill(TEST_USERS.superAdmin.password);

  // Submit and wait for login
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('login_check')).catch(() => {}),
    submitButton.click(),
  ]);

  // Wait for redirect to admin area
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 30000 });

  console.log('✅ Logged in successfully');

  // Save storage state (cookies + localStorage)
  await context.storageState({ path: AUTH_FILE });

  console.log(`💾 Auth state saved to ${AUTH_FILE}`);

  await browser.close();
}

export default globalSetup;
