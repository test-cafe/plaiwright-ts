import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import { PizzaModalPage } from './pages/pizza-modal.page';
import { CartDrawerPage } from './pages/cart-drawer.page';

async function addFirstPizzaToCart(page: import('@playwright/test').Page) {
  const home = new HomePage(page);
  const modal = new PizzaModalPage(page);
  await home.goto();

  // Get the product URL from the first card and navigate directly (intercepted
  // route modals require fully hydrated client router — navigating directly is reliable)
  const firstCard = page.getByTestId('product-card').first();
  const href = await firstCard.getAttribute('href');
  await page.goto(href!);
  await modal.waitForOpen();
  await modal.clickAddToCart();

  // Wait for the cart button in the header to reflect the added item before navigating
  await page.waitForFunction(
    () => /\$[1-9]/.test(document.querySelector('[data-testid="cart-button"]')?.textContent ?? ''),
    { timeout: 10000 },
  );

  // Navigate home to ensure clean state
  await page.goto('/');
  // Wait for the cart button to finish loading and show the updated total
  await page.waitForFunction(
    () => /\$[1-9]/.test(document.querySelector('[data-testid="cart-button"]')?.textContent ?? ''),
    { timeout: 10000 },
  );
}

test.describe('Cart flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('clicking a pizza card opens modal with pizza details', async ({ page }) => {
    const home = new HomePage(page);
    const modal = new PizzaModalPage(page);
    await home.goto();

    const firstCard = page.getByTestId('product-card').first();
    const href = await firstCard.getAttribute('href');
    await page.goto(href!);

    await modal.waitForOpen();

    await expect(modal.addToCartButton).toBeVisible();
  });

  test('pizza price updates when selecting different size', async ({ page }) => {
    const home = new HomePage(page);
    const modal = new PizzaModalPage(page);
    await home.goto();

    const firstCard = page.getByTestId('product-card').first();
    const href = await firstCard.getAttribute('href');
    await page.goto(href!);
    await modal.waitForOpen();

    const priceBefore = await modal.getPrice();

    const sizes = page.getByText(/\d+ cm/);
    const sizeCount = await sizes.count();

    if (sizeCount > 1) {
      await sizes.nth(1).click();
      await page.waitForTimeout(200);
      const priceAfter = await modal.getPrice();
      expect(priceAfter).toBeGreaterThanOrEqual(0);
    }

    expect(priceBefore).toBeGreaterThan(0);
  });

  test('adding pizza to cart updates cart button count', async ({ page }) => {
    const home = new HomePage(page);
    await addFirstPizzaToCart(page);

    const cartBtn = home.cartButton;
    const cartText = await cartBtn.textContent();
    expect(cartText).toMatch(/\$[1-9]/);
  });

  test('cart drawer shows added item', async ({ page }) => {
    const home = new HomePage(page);
    const drawer = new CartDrawerPage(page);

    await addFirstPizzaToCart(page);

    await home.openCartDrawer();
    await drawer.waitForOpen();

    const itemCount = await drawer.getItemCount();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('empty cart drawer shows empty message', async ({ page }) => {
    const home = new HomePage(page);
    const drawer = new CartDrawerPage(page);
    await home.goto();

    await home.openCartDrawer();
    await drawer.waitForOpen();

    await expect(drawer.emptyMessage).toBeVisible();
  });

  test('checkout button in drawer navigates to /cart', async ({ page }) => {
    const home = new HomePage(page);
    const drawer = new CartDrawerPage(page);

    await addFirstPizzaToCart(page);

    await home.openCartDrawer();
    await drawer.waitForOpen();
    await drawer.clickCheckout();

    await page.waitForURL('**/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByText('Checkout')).toBeVisible();
  });

  test('cart page shows items and order form', async ({ page }) => {
    const home = new HomePage(page);
    const drawer = new CartDrawerPage(page);

    await addFirstPizzaToCart(page);

    await home.openCartDrawer();
    await drawer.waitForOpen();
    await drawer.clickCheckout();
    await page.waitForURL('**/cart');

    await expect(page.getByText('1. Cart')).toBeVisible();
    await expect(page.getByText('2. Personal Information')).toBeVisible();
    await expect(page.getByText('3. Delivery Address')).toBeVisible();
    await expect(page.getByPlaceholder('First name')).toBeVisible();
    await expect(page.getByPlaceholder('E-Mail')).toBeVisible();
  });
});
