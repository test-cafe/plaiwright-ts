import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

/**
 * Step definitions for cart.feature
 * These are wired to Playwright via a custom world — see cucumber.config.ts
 */

Given('the product catalog is seeded with pizzas and ingredients', async function () {
  // Seed is handled in beforeAll global setup
});

Given('I am an anonymous user with a cart token', async function () {
  await this.page.goto('/');
  // Token is created automatically on first cart interaction
});

Given('I have {string} size {string} type {string} in my cart', async function (
  name: string,
  size: string,
  type: string,
) {
  await this.page.goto('/');
  await this.page.locator('[data-testid="product-card"]').filter({ hasText: name }).click();
  await this.page.locator('[data-testid="pizza-size"]').filter({ hasText: size }).click();
  await this.page.locator('[data-testid="pizza-type"]').filter({ hasText: type }).click();
  await this.page.locator('[data-testid="add-to-cart"]').click();
});

When('I add {string} size {string} type {string} to the cart', async function (
  name: string,
  size: string,
  type: string,
) {
  await this.page.goto('/');
  await this.page.locator('[data-testid="product-card"]').filter({ hasText: name }).click();
  await this.page.locator('[data-testid="pizza-size"]').filter({ hasText: size }).click();
  await this.page.locator('[data-testid="pizza-type"]').filter({ hasText: type }).click();
  await this.page.locator('[data-testid="add-to-cart"]').click();
});

When('I add {string} size {string} type {string} to the cart again', async function (
  name: string,
  size: string,
  type: string,
) {
  await this.page.goto('/');
  await this.page.locator('[data-testid="product-card"]').filter({ hasText: name }).click();
  await this.page.locator('[data-testid="pizza-size"]').filter({ hasText: size }).click();
  await this.page.locator('[data-testid="pizza-type"]').filter({ hasText: type }).click();
  await this.page.locator('[data-testid="add-to-cart"]').click();
});

Then('the cart should contain {int} item', async function (count: number) {
  await this.page.goto('/cart');
  const items = await this.page.locator('[data-testid="cart-item"]').count();
  expect(items).toBe(count);
});

Then('the cart should contain {int} item with quantity {int}', async function (
  itemCount: number,
  quantity: number,
) {
  await this.page.goto('/cart');
  const items = await this.page.locator('[data-testid="cart-item"]').count();
  expect(items).toBe(itemCount);
  const quantityEl = await this.page.locator('[data-testid="item-quantity"]').first().textContent();
  expect(Number(quantityEl)).toBe(quantity);
});

Then('the cart total should be greater than {int}', async function (amount: number) {
  const totalText = await this.page.locator('[data-testid="cart-total"]').textContent();
  const total = parseFloat(totalText?.replace(/[^0-9.]/g, '') ?? '0');
  expect(total).toBeGreaterThan(amount);
});
