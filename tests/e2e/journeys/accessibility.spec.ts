import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { DriverFactory } from '../driver-factory';

// @a11y
test.describe('@a11y Accessibility — core pages', () => {
  test('home page has no critical accessibility violations', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    const results = await new AxeBuilder({ page: driver.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);

    await driver.dispose();
  });

  test('product detail page has no critical accessibility violations', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.locator('[data-testid="product-card"]').first().click();
    await driver.page.waitForURL(/\/product\/\d+/);

    const results = await new AxeBuilder({ page: driver.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);

    await driver.dispose();
  });

  test('cart page has no critical accessibility violations', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.cart.goto();

    const results = await new AxeBuilder({ page: driver.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);

    await driver.dispose();
  });

  test('checkout page has no critical accessibility violations', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.checkout.goto();

    const results = await new AxeBuilder({ page: driver.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);

    await driver.dispose();
  });

  test('auth modal has no critical accessibility violations', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.auth.openAuthModal();

    const results = await new AxeBuilder({ page: driver.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('[role="dialog"]')
      .analyze();

    expect(results.violations).toEqual([]);

    await driver.dispose();
  });

  test('dashboard is accessible to admin users', async ({ browser }) => {
    const driver = await DriverFactory.asAdmin(browser);

    await driver.dashboard.goto();

    const results = await new AxeBuilder({ page: driver.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);

    await driver.dispose();
  });
});

// @a11y
test.describe('@a11y Accessibility — keyboard navigation', () => {
  test('user can tab through nav categories', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.keyboard.press('Tab');

    const focused = driver.page.locator(':focus');
    await expect(focused).toBeVisible();

    await driver.dispose();
  });

  test('product cards are keyboard reachable', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.waitForSelector('[data-testid="product-card"]');

    // Tab until a product card is focused
    for (let i = 0; i < 20; i++) {
      await driver.page.keyboard.press('Tab');
      const focused = await driver.page.evaluate(() =>
        document.activeElement?.getAttribute('data-testid'),
      );
      if (focused === 'product-card') break;
    }

    const focused = await driver.page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid'),
    );
    expect(focused).toBe('product-card');

    await driver.dispose();
  });
});
