import { chromium, Browser, FullConfig } from '@playwright/test';
import * as path from 'path';

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

/**
 * Runs once before all Playwright tests.
 * Creates auth storage state files for user and admin roles so each spec
 * can load a pre-authenticated context via DriverFactory without re-logging in.
 *
 * Throws on any auth failure so CI fails fast at setup rather than producing
 * misleading errors in every downstream test that needs a session.
 */
async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();

  try {
    await warmUpAuthRoutes(browser);
    await warmUpProductModalRoute(browser);

    // Sequential on purpose: on a cold dev server the first login pays the
    // webpack compile cost. Two parallel logins double that load and push the
    // slower one past its timeout.
    await createAuthState(browser, {
      email: process.env.TEST_USER_EMAIL ?? 'user@test.com',
      password: process.env.TEST_USER_PASSWORD ?? 'TestPass123!',
      outputPath: path.resolve('tests/e2e/.auth/user.json'),
    });
    await createAuthState(browser, {
      email: process.env.TEST_ADMIN_EMAIL ?? 'admin@test.com',
      password: process.env.TEST_ADMIN_PASSWORD ?? 'AdminPass123!',
      outputPath: path.resolve('tests/e2e/.auth/admin.json'),
    });
  } finally {
    await browser.close();
  }
}

/**
 * Compiles the home page and NextAuth routes before any login attempt.
 * On a cold dev server the parallel session/providers/csrf requests all
 * compile-block; each sees no CSRF cookie and sets its own, so the token the
 * client posts can mismatch the cookie that won — NextAuth then rejects the
 * sign-in with `signin?csrf=true`. One sequential pass avoids that race.
 */
async function warmUpAuthRoutes(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { timeout: 60_000 });
    await page.request.get(`${BASE_URL}/api/auth/session`);
    await page.request.get(`${BASE_URL}/api/auth/providers`);
    await page.request.get(`${BASE_URL}/api/auth/csrf`);
  } finally {
    await context.close();
  }
}

/**
 * Compiles the intercepted product modal route before tests run. On a cold
 * dev server the first client-side navigation to /product/[id] aborts while
 * the route compiles and bounces back to `/`, so the first spec that clicks
 * a product card times out. Clicking here (with retries) absorbs that cost.
 */
async function warmUpProductModalRoute(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      await page.goto(`${BASE_URL}/`);
      await page.waitForSelector('[data-testid="product-card"]', { timeout: 30_000 });
      await page.locator('[data-testid="product-card"]').first().click();
      try {
        await page.waitForURL(/\/product\/\d+/, { timeout: 20_000 });
        return;
      } catch {
        console.warn(`[global-setup] Product modal warm-up attempt ${attempt} bounced, retrying...`);
      }
    }
    console.warn('[global-setup] Product modal warm-up never succeeded; tests may be flaky.');
  } finally {
    await context.close();
  }
}

async function createAuthState(
  browser: Browser,
  opts: { email: string; password: string; outputPath: string },
) {
  const attempts = 2;

  for (let attempt = 1; ; attempt++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // The app uses an auth modal on the home page — there is no standalone signin page.
      await page.goto(`${BASE_URL}/`);
      await page.click('[data-testid="sign-in-button"]');
      await page.waitForSelector('[data-testid="auth-modal"]', { timeout: 10_000 });
      await page.fill('[name="email"]', opts.email);
      await page.fill('[name="password"]', opts.password);
      await page.click('[data-testid="login-submit"]');
      // After credentials signIn the modal closes and router.refresh() runs.
      // Wait for the profile button to appear — it only renders when authenticated.
      await page.waitForSelector('[data-testid="profile-button"]', { timeout: 30_000 });
      await context.storageState({ path: opts.outputPath });
      return;
    } catch (err) {
      if (attempt < attempts) {
        console.warn(`[global-setup] Auth attempt ${attempt} failed for ${opts.email}, retrying...`);
        continue;
      }
      throw new Error(
        `[global-setup] Auth setup failed for ${opts.email}. ` +
          `Ensure the app is running and the user exists in the DB.\n${err}`,
      );
    } finally {
      await context.close();
    }
  }
}

export default globalSetup;
