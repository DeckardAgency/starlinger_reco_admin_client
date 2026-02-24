import { chromium, FullConfig } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-data';
import * as fs from 'fs';

const AUTH_FILE = 'e2e/.auth/user.json';

function isAuthTokenValid(): boolean {
  try {
    const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    const origin = data.origins?.find((o: any) => o.localStorage);
    const tokenEntry = origin?.localStorage?.find((e: any) => e.name === 'auth_token');
    if (!tokenEntry?.value) return false;

    // Decode JWT payload (base64url)
    const parts = tokenEntry.value.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Check expiration with 5-minute buffer
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now + 300;
  } catch {
    return false;
  }
}

async function globalSetup(config: FullConfig) {
  // Skip login if we already have a valid auth token
  if (isAuthTokenValid()) {
    console.log('Auth token still valid, skipping login');
    return;
  }

  const { baseURL } = config.projects[0].use;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Setting up authentication...');

  // Navigate to login page
  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[formcontrolname="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await emailInput.fill(TEST_USERS.admin.email);
  await passwordInput.fill(TEST_USERS.admin.password);

  // Submit and wait for login
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('login_check')).catch(() => {}),
    submitButton.click(),
  ]);

  // Wait for redirect to admin area
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 30000 });

  console.log('Logged in successfully');

  // Save storage state (cookies + localStorage)
  await context.storageState({ path: AUTH_FILE });

  console.log(`Auth state saved to ${AUTH_FILE}`);

  await browser.close();
}

export default globalSetup;
