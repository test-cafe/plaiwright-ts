import { Page, Locator } from '@playwright/test';

export class PizzaModalPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly addToCartButton: Locator;
  private _isModalMode = true;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('[role="dialog"]:not([data-nextjs-dialog])');
    this.addToCartButton = page.getByTestId('add-to-cart-button');
  }

  // Waits for either the intercepted-route modal dialog or a full product page navigation
  async waitForOpen() {
    // add-to-cart button exists in both the modal and the standalone product page
    await this.addToCartButton.waitFor({ state: 'visible', timeout: 15000 });
    // Determine which mode we're in (dialog visible = intercepted route fired)
    this._isModalMode = await this.dialog.isVisible();
  }

  async selectSize(size: '25' | '30' | '40') {
    const sizeLabel = `${size} cm`;
    const container = this._isModalMode ? this.dialog : this.page;
    await container.getByText(sizeLabel, { exact: true }).click();
  }

  async selectDoughType(type: 'Thin' | 'Traditional') {
    const container = this._isModalMode ? this.dialog : this.page;
    await container.getByText(type, { exact: true }).click();
  }

  async addIngredient(name: string) {
    const container = this._isModalMode ? this.dialog : this.page;
    await container.getByText(name).click();
  }

  async getPrice(): Promise<number> {
    const text = await this.addToCartButton.textContent();
    const match = text?.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async clickAddToCart() {
    // useChoosePizza initializes with size=20 but then a useEffect updates to the first
    // available size. Wait 300ms so the effect has time to run before we click.
    await this.page.waitForTimeout(300);
    await this.addToCartButton.click();
  }
}
