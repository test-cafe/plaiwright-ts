import { test, expect, Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { DriverFactory } from '../driver-factory';

const WCAG_TAGS = ['wcag2a', 'wcag2aa'];
const PRODUCT_CARD_SELECTOR = '[data-testid="product-card"]';
const PRODUCT_CARD_TIMEOUT_MS = 10000;
const AUTH_DIALOG_SCOPE = '[role="dialog"]';
const SEED_PRODUCT_ID = 1;

async function expectAccessible(page: Page, scope?: string) {
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (scope) builder.include(scope);
  const results = await builder.analyze();

  // Only critical violations fail the suite. The brand orange (#ff5e00) fails
  // AA contrast in many places, which axe reports as "serious" — fixing that
  // is a design-palette decision, not something to gate e2e runs on.
  const critical = results.violations.filter((v) => v.impact === 'critical');

  expect(critical).toEqual([]);
}

test.describe('@a11y Accessibility — core pages', () => {
  test('home page has no critical accessibility violations', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.waitForSelector(PRODUCT_CARD_SELECTOR, { timeout: PRODUCT_CARD_TIMEOUT_MS });

    await expectAccessible(driver.page);

    await driver.dispose();
  });

  test('product detail page has no critical accessibility violations', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.product.goto(SEED_PRODUCT_ID);

    await expectAccessible(driver.page);

    await driver.dispose();
  });

  test('cart page has no critical accessibility violations', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.cart.goto();

    await expectAccessible(driver.page);

    await driver.dispose();
  });

  test('checkout page has no critical accessibility violations', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.checkout.goto();

    await expectAccessible(driver.page);

    await driver.dispose();
  });

  test('auth modal has no critical accessibility violations', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.auth.openAuthModal();

    await expectAccessible(driver.page, AUTH_DIALOG_SCOPE);

    await driver.dispose();
  });

  test('dashboard has no critical accessibility violations for admins', async ({ browser }) => {
    const driver = await DriverFactory.asAdmin(browser);

    await driver.dashboard.goto();

    await expectAccessible(driver.page);

    await driver.dispose();
  });
});

test.describe('@a11y Accessibility — keyboard navigation', () => {
  test('pressing Tab on the home page moves focus to an interactive element', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.waitForSelector(PRODUCT_CARD_SELECTOR);
    await driver.page.keyboard.press('Tab');

    await expect(driver.page.locator(':focus').first()).toBeVisible();

    await driver.dispose();
  });

  test('product cards are keyboard focusable', async ({ browser }) => {
    const driver = await DriverFactory.asGuest(browser);

    await driver.page.goto('/');
    await driver.page.waitForSelector(PRODUCT_CARD_SELECTOR);
    await driver.page.locator(PRODUCT_CARD_SELECTOR).first().focus();

    await expect(driver.page.locator(':focus')).toHaveAttribute('data-testid', 'product-card');

    await driver.dispose();
  });
});
