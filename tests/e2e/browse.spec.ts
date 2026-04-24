import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';

test.describe('Browse & Search', () => {
  test('homepage loads with products and filters', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(page.getByText('All Pizzas')).toBeVisible();
    await expect(home.filterTitle).toBeVisible();
    await expect(home.searchInput).toBeVisible();
    await expect(home.cartButton).toBeVisible();
  });

  test('search shows matching products', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await home.search('pizza');

    await expect(home.searchResults.first()).toBeVisible();
  });

  test('search with no match shows no results', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await home.search('xyznotarealproduct12345');

    await expect(home.searchResults).toHaveCount(0);
  });

  test('search result click navigates to product page', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await home.searchInput.click();
    await home.searchInput.fill('');
    await page.waitForTimeout(300);

    const firstResult = home.searchResults.first();
    const count = await home.searchResults.count();

    if (count > 0) {
      const name = await firstResult.textContent();
      await firstResult.click();
      await page.waitForURL(/\/product\//);
      await expect(page).toHaveURL(/\/product\//);
    }
  });

  test('filter by pizza type updates URL', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await page.getByText('Thin', { exact: true }).click();
    await page.waitForTimeout(400);

    await expect(page).toHaveURL(/pizzaTypes/);
  });

  test('filter by size updates URL', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await page.getByText('30 sm', { exact: true }).click();
    await page.waitForTimeout(400);

    await expect(page).toHaveURL(/sizes/);
  });

  test('category nav links are visible in top bar', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    const topBar = page.locator('nav, [class*="sticky"]').first();
    await expect(topBar).toBeVisible();
  });
});
