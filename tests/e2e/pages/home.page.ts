import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly cartButton: Locator;
  readonly searchResults: Locator;
  readonly filterTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId('search-input');
    this.cartButton = page.getByTestId('cart-button');
    this.searchResults = page.getByTestId('search-results').locator('a');
    this.filterTitle = page.getByTestId('filters').getByText('Filters', { exact: true });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForSelector('header', { state: 'visible' });
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
    await this.page.getByTestId('product-card').filter({ hasText: name }).first().click();
  }

  async checkPizzaTypeFilter(label: string) {
    await this.page.getByText(label, { exact: true }).click();
    await this.page.waitForTimeout(400);
  }

  async getProductCardCount() {
    return this.page.getByTestId('product-card').count();
  }

  async openCartDrawer() {
    await this.cartButton.click();
  }

  async clickSignIn() {
    await this.page.getByTestId('sign-in-button').click();
  }
}
