import { Page, expect } from '@playwright/test';

export class CheckoutPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/cart');
    await this.page.locator('[data-testid="checkout-button"]').click();
  }

  async fillDetails(details: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    comment?: string;
  }) {
    await this.page.fill('[name="fullName"]', details.fullName);
    await this.page.fill('[name="email"]', details.email);
    await this.page.fill('[name="phone"]', details.phone);
    await this.page.fill('[name="address"]', details.address);
    if (details.comment) {
      await this.page.fill('[name="comment"]', details.comment);
    }
  }

  async submitOrder() {
    await this.page.locator('[data-testid="submit-order"]').click();
  }

  async assertRedirectedToStripe() {
    await expect(this.page).toHaveURL(/checkout\.stripe\.com|localhost/);
  }

  async assertValidationError(fieldName: string) {
    await expect(
      this.page.locator(`[data-testid="error-${fieldName}"]`),
    ).toBeVisible();
  }
}
