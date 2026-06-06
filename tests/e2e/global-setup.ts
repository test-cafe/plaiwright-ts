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
    await Promise.all([
      createAuthState(browser, {
        email: process.env.TEST_USER_EMAIL ?? 'user@test.com',
        password: process.env.TEST_USER_PASSWORD ?? 'TestPass123!',
        outputPath: path.resolve('tests/e2e/.auth/user.json'),
      }),
      createAuthState(browser, {
        email: process.env.TEST_ADMIN_EMAIL ?? 'admin@test.com',
        password: process.env.TEST_ADMIN_PASSWORD ?? 'AdminPass123!',
        outputPath: path.resolve('tests/e2e/.auth/admin.json'),
      }),
    ]);
  } finally {
    await browser.close();
  }
}

async function createAuthState(
  browser: Browser,
  opts: { email: string; password: string; outputPath: string },
) {
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
    await page.waitForSelector('[data-testid="profile-button"]', { timeout: 15_000 });
    await context.storageState({ path: opts.outputPath });
  } catch (err) {
    throw new Error(
      `[global-setup] Auth setup failed for ${opts.email}. ` +
        `Ensure the app is running and the user exists in the DB.\n${err}`,
    );
  } finally {
    await context.close();
  }
}

export default globalSetup;
