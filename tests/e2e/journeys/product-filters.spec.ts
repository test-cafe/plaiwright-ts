import { test, expect } from '@playwright/test';
import { DriverFactory } from '../driver-factory';

// @regression
test.describe('@regression Product filter sidebar', () => {
  test('price range inputs update URL params', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);
    await driver.page.goto('/');
    await driver.page.waitForSelector('[data-testid="product-card"]');

    const filters = driver.page.locator('[data-testid="filters"]');
    await filters.locator('input[placeholder="0"]').fill('20');
    await filters.locator('input[placeholder="100"]').fill('80');

    await driver.page.waitForURL(/priceFrom=20/);
    await expect(driver.page).toHaveURL(/priceTo=80/);

    await driver.dispose();
  });

  test('selecting a pizza type adds its param to the URL', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);
    await driver.page.goto('/');
    await driver.page.waitForSelector('[data-testid="product-card"]');

    await driver.page.locator('#checkbox-pizzaTypes-1').click();

    await driver.page.waitForURL(/pizzaTypes=1/);
    await expect(driver.page).toHaveURL(/pizzaTypes=1/);

    await driver.dispose();
  });

  test('selecting a size adds its param to the URL', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);
    await driver.page.goto('/');
    await driver.page.waitForSelector('[data-testid="product-card"]');

    await driver.page.locator('#checkbox-sizes-30').click();

    await driver.page.waitForURL(/sizes=30/);
    await expect(driver.page).toHaveURL(/sizes=30/);

    await driver.dispose();
  });

  test('selecting an ingredient adds its param to the URL', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);
    await driver.page.goto('/');
    await driver.page.waitForSelector('[data-testid="product-card"]');

    // Ingredient checkboxes are loaded async — wait for the skeleton to resolve
    await driver.page.waitForSelector('[id^="checkbox-ingredients-"]');
    await driver.page.locator('[id^="checkbox-ingredients-"]').first().click();

    await driver.page.waitForURL(/ingredients=/);
    await expect(driver.page).toHaveURL(/ingredients=/);

    await driver.dispose();
  });

  test('combining pizza type and size filters both appear in URL', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);
    await driver.page.goto('/');
    await driver.page.waitForSelector('[data-testid="product-card"]');

    await driver.page.locator('#checkbox-pizzaTypes-2').click();
    await driver.page.waitForURL(/pizzaTypes/);

    await driver.page.locator('#checkbox-sizes-20').click();
    await driver.page.waitForURL(/sizes/);

    await expect(driver.page).toHaveURL(/pizzaTypes=2/);
    await expect(driver.page).toHaveURL(/sizes=20/);

    await driver.dispose();
  });

  test('unchecking a filter removes its param from the URL', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);
    await driver.page.goto('/');
    await driver.page.waitForSelector('[data-testid="product-card"]');

    await driver.page.locator('#checkbox-pizzaTypes-1').click();
    await driver.page.waitForURL(/pizzaTypes=1/);

    await driver.page.locator('#checkbox-pizzaTypes-1').click();
    await driver.page.waitForFunction(
      () => !window.location.search.includes('pizzaTypes=1'),
    );

    await expect(driver.page).not.toHaveURL(/pizzaTypes=1/);

    await driver.dispose();
  });
});
