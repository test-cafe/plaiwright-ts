import { chromium } from '@playwright/test';

export default async function globalSetup() {
  const baseURL = 'http://localhost:3000';
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Visit home and a product page to trigger JIT compilation of intercepted routes
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.goto(`${baseURL}/product/1`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});

  await browser.close();
}
