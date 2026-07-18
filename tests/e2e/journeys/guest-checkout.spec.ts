import { test, expect } from '@playwright/test';
import { DriverFactory } from '../driver-factory';

const PRODUCT_URL_PATTERN = /\/product\/\d+/;

test.describe('@smoke Guest checkout flow', () => {
  test('guest can add a pizza to the cart from the homepage', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.locator('[data-testid="product-card"]').first().click();
    await driver.page.waitForURL(PRODUCT_URL_PATTERN);
    await driver.product.addToCart();
    // The modal closes itself (and navigates back) after adding — wait for the
    // close so its navigation doesn't race the goto('/cart') below.
    await expect(driver.page.locator('[role="dialog"]')).toBeHidden();
    await driver.cart.goto();

    await expect(driver.page.locator('[data-testid="cart-item"]').first()).toBeVisible();

    await driver.dispose();
  });

  test('cart total increases when an item quantity is incremented', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.locator('[data-testid="product-card"]').first().click();
    await driver.page.waitForURL(PRODUCT_URL_PATTERN);
    await driver.product.addToCart();
    await expect(driver.page.locator('[role="dialog"]')).toBeHidden();
    await driver.cart.goto();
    await expect(driver.page.locator('[data-testid="cart-item"]').first()).toBeVisible();
    const initialTotal = await driver.cart.getTotal();
    const firstItemText = (await driver.page
      .locator('[data-testid="cart-item"]')
      .first()
      .textContent()) ?? '';

    await driver.cart.updateQuantity(firstItemText, 'plus');

    await expect.poll(() => driver.cart.getTotal()).toBeGreaterThan(initialTotal);

    await driver.dispose();
  });
});

test.describe('@smoke Mobile guest cart flow', () => {
  test('mobile client sends x-cart-token header on cart API requests', async ({ browser }) => {
    const cartToken = `test-mobile-${Date.now()}`;
    const driver = await DriverFactory.asMobile(browser, cartToken);

    const cartRequestPromise = driver.page.waitForRequest((req) =>
      req.url().includes('/api/cart'),
    );
    await driver.cart.goto();
    const cartRequest = await cartRequestPromise;

    expect(cartRequest.headers()['x-cart-token']).toBe(cartToken);

    await driver.dispose();
  });
});
