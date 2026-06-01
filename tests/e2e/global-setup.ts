import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

/**
 * Runs once before all Playwright tests.
 * Creates auth storage state files for user and admin roles so each spec
 * can load a pre-authenticated context via DriverFactory without re-logging in.
 */
async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();

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

  await browser.close();
}

async function createAuthState(
  browser: Parameters<typeof chromium.launch>[0] extends any ? any : never,
  opts: { email: string; password: string; outputPath: string },
) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Sign in via NextAuth credentials provider
    await page.goto(`${BASE_URL}/api/auth/signin`);
    await page.fill('[name="email"]', opts.email);
    await page.fill('[name="password"]', opts.password);
    await page.click('[type="submit"]');
    await page.waitForURL(BASE_URL + '/**', { timeout: 10_000 });

    await context.storageState({ path: opts.outputPath });
  } catch {
    // Auth state creation is best-effort — tests requiring auth will fail
    // gracefully rather than blocking the whole suite from starting.
    console.warn(`[global-setup] Could not create auth state for ${opts.email}`);
    // Write empty storage state so the file exists
    await context.storageState({ path: opts.outputPath });
  } finally {
    await context.close();
  }
}

export default globalSetup;
