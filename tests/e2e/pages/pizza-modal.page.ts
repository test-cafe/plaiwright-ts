import { Page, Locator } from '@playwright/test';

export class PizzaModalPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('[role="dialog"]');
    this.addToCartButton = page.getByRole('button', { name: /add to cart/i });
  }

  async waitForOpen() {
    await this.dialog.waitFor({ state: 'visible' });
  }

  async selectSize(size: '25' | '30' | '40') {
    const sizeLabel = `${size} cm`;
    await this.page.getByText(sizeLabel, { exact: true }).click();
  }

  async selectDoughType(type: 'Thin' | 'Traditional') {
    await this.dialog.getByText(type, { exact: true }).click();
  }

  async addIngredient(name: string) {
    await this.dialog.getByText(name).click();
  }

  async getPrice(): Promise<number> {
    const text = await this.addToCartButton.textContent();
    const match = text?.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async clickAddToCart() {
    await this.addToCartButton.click();
  }
}
