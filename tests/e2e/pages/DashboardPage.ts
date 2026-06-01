import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async gotoProducts() {
    await this.page.goto('/dashboard/products/create');
  }

  async gotoCategories() {
    await this.page.goto('/dashboard/categories/create');
  }

  async createProduct(name: string, categoryId: number, price: number) {
    await this.gotoProducts();
    await this.page.fill('[name="name"]', name);
    await this.page.selectOption('[name="categoryId"]', String(categoryId));
    await this.page.fill('[name="price"]', String(price));
    await this.page.locator('[data-testid="submit"]').click();
  }

  async deleteEntity(id: number) {
    await this.page.locator(`[data-testid="delete-${id}"]`).click();
    await this.page.locator('[data-testid="confirm-delete"]').click();
  }

  async assertOnDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async assertAccessDenied() {
    await expect(
      this.page.locator('text=403').or(this.page.locator('[data-testid="not-authorized"]')),
    ).toBeVisible();
  }
}
