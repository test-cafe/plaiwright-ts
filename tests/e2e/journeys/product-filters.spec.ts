import { test, expect, Browser } from '@playwright/test';
import { DriverFactory, Driver } from '../driver-factory';

const PRODUCT_CARD_SELECTOR = '[data-testid="product-card"]';
const FILTERS_SELECTOR = '[data-testid="filters"]';
const INGREDIENT_CHECKBOX_SELECTOR = '[id^="checkbox-ingredients-"]';

const PIZZA_TYPE_TRADITIONAL_ID = 1;
const PIZZA_TYPE_THIN_ID = 2;
const SIZE_SMALL_INCHES = 20;
const SIZE_MEDIUM_INCHES = 30;

const PRICE_FROM = '20';
const PRICE_TO = '80';

async function openHome(browser: Browser): Promise<Driver> {
  const driver = await DriverFactory.asGuest(browser);
  await driver.page.goto('/');
  await driver.page.waitForSelector(PRODUCT_CARD_SELECTOR);
  return driver;
}

test.describe('@regression Product filter sidebar', () => {
  test('price range inputs add priceFrom and priceTo to the URL', async ({ browser }) => {
    const driver = await openHome(browser);
    const filters = driver.page.locator(FILTERS_SELECTOR);

    await filters.locator('input[placeholder="0"]').fill(PRICE_FROM);
    await filters.locator('input[placeholder="100"]').fill(PRICE_TO);

    await expect(driver.page).toHaveURL(new RegExp(`priceFrom=${PRICE_FROM}`));
    await expect(driver.page).toHaveURL(new RegExp(`priceTo=${PRICE_TO}`));

    await driver.dispose();
  });

  test('selecting a pizza type adds its param to the URL', async ({ browser }) => {
    const driver = await openHome(browser);

    await driver.page.locator(`#checkbox-pizzaTypes-${PIZZA_TYPE_TRADITIONAL_ID}`).click();

    await expect(driver.page).toHaveURL(new RegExp(`pizzaTypes=${PIZZA_TYPE_TRADITIONAL_ID}`));

    await driver.dispose();
  });

  test('selecting a size adds its param to the URL', async ({ browser }) => {
    const driver = await openHome(browser);

    await driver.page.locator(`#checkbox-sizes-${SIZE_MEDIUM_INCHES}`).click();

    await expect(driver.page).toHaveURL(new RegExp(`sizes=${SIZE_MEDIUM_INCHES}`));

    await driver.dispose();
  });

  test('selecting an ingredient adds its param to the URL', async ({ browser }) => {
    const driver = await openHome(browser);

    await driver.page.waitForSelector(INGREDIENT_CHECKBOX_SELECTOR);
    await driver.page.locator(INGREDIENT_CHECKBOX_SELECTOR).first().click();

    await expect(driver.page).toHaveURL(/ingredients=/);

    await driver.dispose();
  });

  test('combining pizza type and size adds both params to the URL', async ({ browser }) => {
    const driver = await openHome(browser);

    await driver.page.locator(`#checkbox-pizzaTypes-${PIZZA_TYPE_THIN_ID}`).click();
    await driver.page.locator(`#checkbox-sizes-${SIZE_SMALL_INCHES}`).click();

    await expect(driver.page).toHaveURL(new RegExp(`pizzaTypes=${PIZZA_TYPE_THIN_ID}`));
    await expect(driver.page).toHaveURL(new RegExp(`sizes=${SIZE_SMALL_INCHES}`));

    await driver.dispose();
  });

  test('unchecking a filter removes its param from the URL', async ({ browser }) => {
    const driver = await openHome(browser);
    const checkbox = driver.page.locator(`#checkbox-pizzaTypes-${PIZZA_TYPE_TRADITIONAL_ID}`);

    await checkbox.click();
    await expect(driver.page).toHaveURL(new RegExp(`pizzaTypes=${PIZZA_TYPE_TRADITIONAL_ID}`));
    await checkbox.click();

    await expect(driver.page).not.toHaveURL(new RegExp(`pizzaTypes=${PIZZA_TYPE_TRADITIONAL_ID}`));

    await driver.dispose();
  });
});
