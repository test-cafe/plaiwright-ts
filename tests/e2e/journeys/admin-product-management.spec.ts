import { test, expect } from '@playwright/test';
import { DriverFactory } from '../driver-factory';

test.describe('@regression Admin dashboard access control', () => {
  test('unauthenticated user is redirected to home from /dashboard', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/dashboard');

    await expect(driver.page).toHaveURL('/');

    await driver.dispose();
  });

  test('regular (non-admin) user is redirected to home from /dashboard', async ({ browser }) => {
    const driver = await DriverFactory.asUser(browser);

    await driver.dashboard.goto();

    await expect(driver.page).toHaveURL('/');

    await driver.dispose();
  });
});

test.describe('@regression Admin dashboard renders for admin', () => {
  test('admin can reach the dashboard page', async ({ browser }) => {
    const driver = await DriverFactory.asAdmin(browser);

    await driver.dashboard.goto();
    await driver.dashboard.assertOnDashboard();

    await driver.dispose();
  });
});
