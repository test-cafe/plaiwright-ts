import { test, expect } from '@playwright/test';
import { DriverFactory } from '../driver-factory';

// @regression
test.describe('@regression Password reset flow', () => {
  test('forgot password page renders email input', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.auth.goToForgotPassword();
    await expect(driver.page.locator('[name="email"]')).toBeVisible();

    await driver.dispose();
  });

  test('submitting unknown email shows generic confirmation without revealing existence', async ({
    browser,
  }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.auth.requestPasswordReset('nonexistent@test.com');

    await expect(
      driver.page.locator('text=/check your email|reset link/i'),
    ).toBeVisible();
    await expect(
      driver.page.locator('text=/not found|does not exist/i'),
    ).not.toBeVisible();

    await driver.dispose();
  });

  test('reset password page renders token-based form', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/reset-password?token=test-token');
    await expect(
      driver.page.locator('[name="password"]').or(driver.page.locator('[name="newPassword"]')),
    ).toBeVisible();

    await driver.dispose();
  });
});
