import { Browser, BrowserContext, Page, devices } from '@playwright/test';
import { CartPage } from './pages/CartPage';
import { ProductPage } from './pages/ProductPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';

export interface Driver {
  page: Page;
  context: BrowserContext;
  cart: CartPage;
  product: ProductPage;
  checkout: CheckoutPage;
  auth: AuthPage;
  dashboard: DashboardPage;
  dispose: () => Promise<void>;
}

function buildDriver(page: Page, context: BrowserContext): Driver {
  return {
    page,
    context,
    cart: new CartPage(page),
    product: new ProductPage(page),
    checkout: new CheckoutPage(page),
    auth: new AuthPage(page),
    dashboard: new DashboardPage(page),
    dispose: () => context.close(),
  };
}

export class DriverFactory {
  /**
   * Anonymous user — no cookies, no session.
   * Cart token is assigned automatically on first interaction.
   */
  static async asGuest(browser: Browser): Promise<Driver> {
    const context = await browser.newContext();
    const page = await context.newPage();
    return buildDriver(page, context);
  }

  /**
   * Authenticated regular user.
   * Loads auth state from tests/e2e/.auth/user.json (created by global-setup).
   */
  static async asUser(browser: Browser): Promise<Driver> {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/user.json',
    });
    const page = await context.newPage();
    return buildDriver(page, context);
  }

  /**
   * Authenticated admin user.
   * Loads auth state from tests/e2e/.auth/admin.json (created by global-setup).
   */
  static async asAdmin(browser: Browser): Promise<Driver> {
    const context = await browser.newContext({
      storageState: 'tests/e2e/.auth/admin.json',
    });
    const page = await context.newPage();
    return buildDriver(page, context);
  }

  /**
   * Mobile client — uses iPhone 14 viewport + extra HTTP headers that
   * simulate the x-cart-token mobile pattern (no cookie support).
   */
  static async asMobile(browser: Browser, cartToken?: string): Promise<Driver> {
    const context = await browser.newContext({
      ...devices['iPhone 14'],
      extraHTTPHeaders: cartToken ? { 'x-cart-token': cartToken } : {},
    });
    const page = await context.newPage();
    return buildDriver(page, context);
  }

  /**
   * Authenticated mobile user — combines mobile device emulation with a
   * persisted user session.
   */
  static async asMobileUser(browser: Browser): Promise<Driver> {
    const context = await browser.newContext({
      ...devices['iPhone 14'],
      storageState: 'tests/e2e/.auth/user.json',
    });
    const page = await context.newPage();
    return buildDriver(page, context);
  }
}
