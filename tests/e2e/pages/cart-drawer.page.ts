import { Page, Locator } from '@playwright/test';

export class CartDrawerPage {
  readonly page: Page;
  readonly drawer: Locator;
  readonly checkoutButton: Locator;
  readonly emptyMessage: Locator;
  readonly totalAmount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.drawer = page.getByTestId('cart-drawer');
    this.checkoutButton = page.getByTestId('checkout-button');
    this.emptyMessage = page.getByTestId('cart-empty');
    this.totalAmount = page.locator('text=/\\$\\d+/').last();
  }

  async waitForOpen() {
    await this.drawer.waitFor({ state: 'visible' });
  }

  async getItemCount(): Promise<number> {
    const heading = await this.page.getByTestId('cart-item-count').textContent();
    const match = heading?.match(/(\d+) items?/);
    return match ? parseInt(match[1]) : 0;
  }

  async clickCheckout() {
    await this.checkoutButton.click();
  }

  async close() {
    await this.page.keyboard.press('Escape');
  }
}
