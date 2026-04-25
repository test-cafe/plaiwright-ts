import { Page, Locator } from '@playwright/test';

export class AuthModalPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly switchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('[role="dialog"]:not([data-nextjs-dialog])');
    this.emailInput = page.getByPlaceholder('user@test.ru').or(page.getByPlaceholder('E-Mail'));
    this.passwordInput = page.getByLabel(/password/i).first();
    this.loginButton = page.getByRole('button', { name: /^sign in$/i });
    this.registerButton = page.getByRole('button', { name: /^register$/i }).first();
    this.switchButton = page.getByTestId('auth-switch-button');
  }

  async waitForOpen() {
    await this.dialog.waitFor({ state: 'visible' });
  }

  async fillLoginForm(email: string, password: string) {
    await this.page.getByPlaceholder('user@test.ru').fill(email);
    await this.page.getByLabel(/password/i).first().fill(password);
  }

  async fillRegisterForm(opts: { fullName: string; email: string; password: string; confirmPassword: string }) {
    await this.page.getByPlaceholder('Full name').fill(opts.fullName);
    await this.page.getByPlaceholder('E-Mail').fill(opts.email);
    await this.page.getByPlaceholder(/^Password$/).fill(opts.password);
    await this.page.getByPlaceholder(/Confirm password/i).fill(opts.confirmPassword);
  }

  async switchToRegister() {
    await this.switchButton.click();
  }

  async switchToLogin() {
    await this.switchButton.click();
  }

  async submitLogin() {
    await this.page.getByRole('button', { name: /^sign in$/i }).first().click();
  }

  async submitRegister() {
    await this.page.getByRole('button', { name: /^register$/i }).first().click();
  }
}
