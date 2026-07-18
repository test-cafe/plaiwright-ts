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
    await Promise.all([
      this.page.waitForResponse(
        (resp) => resp.url().includes('/api/cart') && resp.request().method() === 'POST' && resp.status() === 200,
        // Generous: on a cold dev server the first /api/cart hit pays the compile cost.
        { timeout: 20000 },
      ),
      this.page.locator('[data-testid="add-to-cart"]').click(),
    ]);
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
