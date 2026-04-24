import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly cartButton: Locator;
  readonly searchResults: Locator;
  readonly filterTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Search for pizza...');
    this.cartButton = page.locator('header button').filter({ hasText: /\$/ });
    this.searchResults = page.locator('.shadow-md a');
    this.filterTitle = page.getByText('Filters', { exact: true });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async search(query: string) {
    await this.searchInput.click();
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300);
  }

  async clickSearchResult(name: string) {
    await this.searchResults.filter({ hasText: name }).first().click();
  }

  async clickProductCard(name: string) {
    await this.page.getByText(name, { exact: true }).first().click();
  }

  async checkPizzaTypeFilter(label: string) {
    await this.page.getByText(label, { exact: true }).click();
    await this.page.waitForTimeout(400);
  }

  async getProductCardCount() {
    return this.page.locator('[class*="product-card"], .rounded-md.overflow-hidden').count();
  }

  async openCartDrawer() {
    await this.cartButton.click();
  }

  async clickSignIn() {
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }
}
