import { test, expect } from '@playwright/test';
import { DriverFactory } from '../driver-factory';

// @regression
test.describe('@regression Admin dashboard access control', () => {
  test('unauthenticated user is redirected from /dashboard', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/dashboard');

    // Should redirect away — dashboard must not render for unauthenticated users
    await expect(driver.page).not.toHaveURL('/dashboard');

    await driver.dispose();
  });

  test('regular user cannot access dashboard', async ({ browser }) => {
    const driver = await DriverFactory.asUser(browser);

    await driver.dashboard.goto();

    // Either redirected or shown 403
    const url = driver.page.url();
    const isDenied = !url.includes('/dashboard') || (await driver.page.locator('text=403').count()) > 0;
    expect(isDenied).toBe(true);

    await driver.dispose();
  });
});

// @regression
test.describe('@regression Admin dashboard renders for admin', () => {
  test('admin can reach the dashboard page', async ({ browser }) => {
    const driver = await DriverFactory.asAdmin(browser);

    await driver.dashboard.goto();
    await driver.dashboard.assertOnDashboard();

    await driver.dispose();
  });
});
