import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('I am logged in as a registered user', async function () {
  await this.page.goto('/');
  // Use stored auth state or programmatic login
  await this.page.evaluate(() => {
    document.cookie = 'next-auth.session-token=mock-session-token; path=/';
  });
});

Given('I am logged in as an admin user', async function () {
  // Load admin auth state from storage
  await this.context.storageState({ path: 'tests/e2e/.auth/admin.json' });
  await this.page.goto('/');
});

Given('I am not logged in', async function () {
  await this.context.clearCookies();
  await this.page.goto('/');
});

When('I register with email {string} and password {string} and name {string}', async function (
  email: string,
  password: string,
  name: string,
) {
  await this.page.goto('/');
  await this.page.locator('[data-testid="auth-button"]').click();
  await this.page.locator('[data-testid="register-tab"]').click();
  await this.page.fill('[name="fullName"]', name);
  await this.page.fill('[name="email"]', email);
  await this.page.fill('[name="password"]', password);
  await this.page.locator('[data-testid="register-submit"]').click();
});

When('I sign in with email {string} and password {string}', async function (
  email: string,
  password: string,
) {
  await this.page.goto('/');
  await this.page.locator('[data-testid="auth-button"]').click();
  await this.page.fill('[name="email"]', email);
  await this.page.fill('[name="password"]', password);
  await this.page.locator('[data-testid="login-submit"]').click();
});

Then('I should receive a valid session', async function () {
  await expect(this.page.locator('[data-testid="profile-button"]')).toBeVisible({ timeout: 5000 });
});

Then('authentication should fail', async function () {
  await expect(
    this.page.locator('[data-testid="auth-error"]').or(this.page.locator('text=/invalid|incorrect/i')),
  ).toBeVisible();
});

Then('registration should fail with error containing {string}', async function (errorText: string) {
  await expect(
    this.page.locator(`text=/${errorText}/i`),
  ).toBeVisible();
});
