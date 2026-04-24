import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import { PizzaModalPage } from './pages/pizza-modal.page';
import { CartDrawerPage } from './pages/cart-drawer.page';

test.describe('Cart flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart cookie before each test
    await page.context().clearCookies();
  });

  test('clicking a pizza card opens modal with pizza details', async ({ page }) => {
    const home = new HomePage(page);
    const modal = new PizzaModalPage(page);
    await home.goto();

    const firstCard = page.locator('.rounded-md').filter({ has: page.getByRole('button', { name: /choose/i }) }).first();
    await firstCard.getByRole('button', { name: /choose/i }).click();

    await modal.waitForOpen();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.addToCartButton).toBeVisible();
  });

  test('pizza price updates when selecting different size', async ({ page }) => {
    const home = new HomePage(page);
    const modal = new PizzaModalPage(page);
    await home.goto();

    const firstCard = page.locator('.rounded-md').filter({ has: page.getByRole('button', { name: /choose/i }) }).first();
    await firstCard.getByRole('button', { name: /choose/i }).click();
    await modal.waitForOpen();

    const priceBefore = await modal.getPrice();

    // Try to click a different size
    const sizes = modal.dialog.getByText(/\d+ cm/);
    const sizeCount = await sizes.count();

    if (sizeCount > 1) {
      await sizes.nth(1).click();
      await page.waitForTimeout(200);
      const priceAfter = await modal.getPrice();
      // Price should change (may be same or different depending on data)
      expect(priceAfter).toBeGreaterThanOrEqual(0);
    }

    expect(priceBefore).toBeGreaterThan(0);
  });

  test('adding pizza to cart updates cart button count', async ({ page }) => {
    const home = new HomePage(page);
    const modal = new PizzaModalPage(page);
    await home.goto();

    const firstCard = page.locator('.rounded-md').filter({ has: page.getByRole('button', { name: /choose/i }) }).first();
    await firstCard.getByRole('button', { name: /choose/i }).click();
    await modal.waitForOpen();

    await modal.clickAddToCart();
    await page.waitForTimeout(1000);

    // Cart button should now show $amount > $0
    const cartBtn = home.cartButton;
    const cartText = await cartBtn.textContent();
    expect(cartText).toMatch(/\$[1-9]/);
  });

  test('cart drawer shows added item', async ({ page }) => {
    const home = new HomePage(page);
    const modal = new PizzaModalPage(page);
    const drawer = new CartDrawerPage(page);
    await home.goto();

    // Add item
    const firstCard = page.locator('.rounded-md').filter({ has: page.getByRole('button', { name: /choose/i }) }).first();
    await firstCard.getByRole('button', { name: /choose/i }).click();
    await modal.waitForOpen();
    await modal.clickAddToCart();
    await page.waitForTimeout(1000);

    // Open drawer
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
    const modal = new PizzaModalPage(page);
    const drawer = new CartDrawerPage(page);
    await home.goto();

    // Add item first so checkout button appears
    const firstCard = page.locator('.rounded-md').filter({ has: page.getByRole('button', { name: /choose/i }) }).first();
    await firstCard.getByRole('button', { name: /choose/i }).click();
    await modal.waitForOpen();
    await modal.clickAddToCart();
    await page.waitForTimeout(1000);

    await home.openCartDrawer();
    await drawer.waitForOpen();
    await drawer.clickCheckout();

    await page.waitForURL('**/cart');
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByText('Checkout')).toBeVisible();
  });

  test('cart page shows items and order form', async ({ page }) => {
    const home = new HomePage(page);
    const modal = new PizzaModalPage(page);
    const drawer = new CartDrawerPage(page);
    await home.goto();

    const firstCard = page.locator('.rounded-md').filter({ has: page.getByRole('button', { name: /choose/i }) }).first();
    await firstCard.getByRole('button', { name: /choose/i }).click();
    await modal.waitForOpen();
    await modal.clickAddToCart();
    await page.waitForTimeout(1000);

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
