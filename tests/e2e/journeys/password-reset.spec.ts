import { test, expect } from '@playwright/test';
import { DriverFactory } from '../driver-factory';

const UNKNOWN_EMAIL = 'nonexistent@test.com';
const FAKE_TOKEN = 'test-token';

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

    await driver.auth.requestPasswordReset(UNKNOWN_EMAIL);

    await expect(driver.page.locator('text=/check your inbox|reset link/i')).toBeVisible();
    await expect(driver.page.locator('text=/not found|does not exist/i')).not.toBeVisible();

    await driver.dispose();
  });

  test('reset password page renders the token-based password + confirm form', async ({
    browser,
  }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto(`/reset-password?token=${FAKE_TOKEN}`);

    await expect(driver.page.locator('[name="password"]')).toBeVisible();
    await expect(driver.page.locator('[name="confirmPassword"]')).toBeVisible();

    await driver.dispose();
  });
});
