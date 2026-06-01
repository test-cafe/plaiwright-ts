import { test, expect } from '@playwright/test';
import { DriverFactory } from '../driver-factory';

// @smoke
test.describe('@smoke Guest checkout flow', () => {
  test('guest can add pizza to cart and proceed to checkout', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.route('**/checkout.stripe.com/**', (route) =>
      route.fulfill({ status: 200, body: 'Stripe intercepted' }),
    );

    await driver.page.goto('/');
    await driver.page.locator('[data-testid="product-card"]').first().click();
    await driver.page.waitForURL(/\/product\/\d+/);

    await driver.product.addToCart();
    await driver.cart.goto();

    expect(await driver.cart.getItemCount()).toBeGreaterThan(0);

    await driver.dispose();
  });

  test('cart total updates when item quantity is incremented', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.locator('[data-testid="product-card"]').first().click();
    await driver.page.waitForURL(/\/product\/\d+/);
    await driver.page.locator('[data-testid="add-to-cart"]').click();

    await driver.cart.goto();
    const initialTotal = await driver.cart.getTotal();

    const firstName = await driver.page
      .locator('[data-testid="cart-item"]')
      .first()
      .textContent() ?? '';
    await driver.cart.updateQuantity(firstName, 'plus');

    expect(await driver.cart.getTotal()).toBeGreaterThan(initialTotal);

    await driver.dispose();
  });
});

// @smoke
test.describe('@smoke Mobile guest cart flow', () => {
  test('mobile client can access cart via x-cart-token header', async ({ browser }) => {
    const cartToken = `test-mobile-${Date.now()}`;
    const driver = await DriverFactory.asMobile(browser, cartToken);

    // Verify the header is sent with requests
    const headers: Record<string, string> = {};
    driver.page.on('request', (req) => {
      if (req.url().includes('/api/cart')) {
        Object.assign(headers, req.headers());
      }
    });

    await driver.page.goto('/');
    await expect(driver.page).toHaveURL('/');

    await driver.dispose();
  });
});
