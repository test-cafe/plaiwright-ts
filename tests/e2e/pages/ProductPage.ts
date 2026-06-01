import { Page, expect } from '@playwright/test';

export class ProductPage {
  constructor(private page: Page) {}

  async goto(productId: number) {
    await this.page.goto(`/product/${productId}`);
  }

  async selectSize(size: string) {
    await this.page.locator('[data-testid="pizza-size"]').filter({ hasText: size }).click();
  }

  async selectType(type: string) {
    await this.page.locator('[data-testid="pizza-type"]').filter({ hasText: type }).click();
  }

  async addIngredient(name: string) {
    await this.page.locator('[data-testid="ingredient"]').filter({ hasText: name }).click();
  }

  async addToCart() {
    await this.page.locator('[data-testid="add-to-cart"]').click();
  }

  async getPrice(): Promise<number> {
    const priceText = await this.page.locator('[data-testid="product-price"]').textContent();
    return parseFloat(priceText?.replace(/[^0-9.]/g, '') ?? '0');
  }

  async assertSizeDisabled(size: string) {
    await expect(
      this.page.locator('[data-testid="pizza-size"]').filter({ hasText: size }),
    ).toBeDisabled();
  }
}
