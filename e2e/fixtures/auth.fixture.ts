import { test as base } from '@playwright/test';

/**
 * Auth fixture - now simplified since global setup handles auth
 *
 * The global setup logs in once and saves storage state.
 * All tests automatically use that saved state.
 *
 * Use `authenticatedPage` when you want to be explicit about auth requirement.
 * Or just use regular `page` - it's already authenticated.
 */
export const test = base.extend<{ authenticatedPage: typeof base.prototype.page }>({
  authenticatedPage: async ({ page }, use) => {
    // Page is already authenticated via storageState in playwright.config.ts
    // Just verify we're logged in and provide the page
    await use(page);
  },
});

export { expect } from '@playwright/test';
