import { Page, Locator } from '@playwright/test';

export class CartDrawerPage {
  readonly page: Page;
  readonly drawer: Locator;
  readonly checkoutButton: Locator;
  readonly emptyMessage: Locator;
  readonly totalAmount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.drawer = page.locator('[data-radix-scroll-area-viewport], [class*="SheetContent"]').first();
    this.checkoutButton = page.getByRole('link', { name: /checkout/i });
    this.emptyMessage = page.getByText('Cart is empty');
    this.totalAmount = page.locator('text=/\\$\\d+/').last();
  }

  async waitForOpen() {
    await this.page.waitForSelector('[class*="SheetContent"], [data-state="open"]', { timeout: 5000 });
  }

  async getItemCount(): Promise<number> {
    const heading = await this.page.getByText(/In cart:/i).textContent();
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
