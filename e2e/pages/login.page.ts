import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  // Selectors
  private emailInput = 'input[type="email"], input[name="email"], input[formcontrolname="email"]';
  private passwordInput = 'input[type="password"], input[name="password"], input[formcontrolname="password"]';
  private submitButton = 'button[type="submit"]';
  private errorMessage = '.error, .alert-error, [class*="error"]';

  async goto() {
    await this.page.goto('/login');
    await this.waitForPageLoad();
  }

  async login(email: string, password: string) {
    await this.page.fill(this.emailInput, email);
    await this.page.fill(this.passwordInput, password);

    // Click submit and wait for navigation or API response
    await Promise.all([
      this.page.waitForResponse(
        resp => resp.url().includes('login_check'),
        { timeout: 15000 }
      ).catch(() => {}), // Don't fail if response already happened
      this.page.click(this.submitButton),
    ]);

    // Give time for auth to complete
    await this.page.waitForTimeout(500);
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    // Wait for redirect to dashboard or admin area with longer timeout
    await this.page.waitForURL(/\/(admin|dashboard)/, { timeout: 20000 }).catch(async () => {
      // If timeout, check if we're already logged in
      if (this.page.url().includes('/login')) {
        // Try login again
        await this.login(email, password);
        await this.page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
      }
    });
  }

  async getErrorMessage(): Promise<string | null> {
    const error = this.page.locator(this.errorMessage).first();
    if (await error.isVisible({ timeout: 3000 }).catch(() => false)) {
      return error.textContent();
    }
    return null;
  }

  async isLoggedIn(): Promise<boolean> {
    // Check if we're on the admin/dashboard page
    return this.page.url().includes('/admin') || this.page.url().includes('/dashboard');
  }
}
