import { Page, expect } from '@playwright/test';

export class CartPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/cart');
  }

  async getItemCount() {
    const items = this.page.locator('[data-testid="cart-item"]');
    return items.count();
  }

  async getTotal(): Promise<number> {
    const totalText = await this.page.locator('[data-testid="cart-total"]').textContent();
    return parseFloat(totalText?.replace(/[^0-9.]/g, '') ?? '0');
  }

  async removeItem(name: string) {
    const item = this.page.locator('[data-testid="cart-item"]').filter({ hasText: name });
    await item.locator('[data-testid="remove-item"]').click();
  }

  async updateQuantity(name: string, action: 'plus' | 'minus') {
    const item = this.page.locator('[data-testid="cart-item"]').filter({ hasText: name });
    await item.locator(`[data-testid="count-${action}"]`).click();
  }

  async proceedToCheckout() {
    await this.page.locator('[data-testid="checkout-button"]').click();
  }

  async assertEmpty() {
    await expect(this.page.locator('[data-testid="cart-empty"]')).toBeVisible();
  }

  async assertItemPresent(name: string) {
    await expect(
      this.page.locator('[data-testid="cart-item"]').filter({ hasText: name }),
    ).toBeVisible();
  }
}
