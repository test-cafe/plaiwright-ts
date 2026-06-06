import { Page, expect } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  async openAuthModal() {
    await this.page.locator('[data-testid="sign-in-button"]').click();
    await expect(this.page.locator('[data-testid="auth-modal"]')).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.openAuthModal();
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.locator('[data-testid="login-submit"]').click();
  }

  async register(fullName: string, email: string, password: string) {
    await this.openAuthModal();
    await this.page.locator('[data-testid="register-tab"]').click();
    await this.page.fill('[name="fullName"]', fullName);
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.locator('[data-testid="register-submit"]').click();
  }

  async goToForgotPassword() {
    await this.page.goto('/forgot-password');
  }

  async requestPasswordReset(email: string) {
    await this.goToForgotPassword();
    await this.page.fill('[name="email"]', email);
    await this.page.locator('[data-testid="reset-submit"]').click();
  }

  async assertLoggedIn() {
    await expect(this.page.locator('[data-testid="profile-button"]')).toBeVisible();
  }

  async assertLoggedOut() {
    await expect(this.page.locator('[data-testid="sign-in-button"]')).toBeVisible();
  }
}
