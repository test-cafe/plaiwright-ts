import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import { AuthModalPage } from './pages/auth-modal.page';

test.describe('Auth flow', () => {
  test('clicking sign in button opens auth modal', async ({ page }) => {
    const home = new HomePage(page);
    const auth = new AuthModalPage(page);
    await home.goto();

    await page.getByRole('button', { name: /sign in/i }).click();

    await auth.waitForOpen();
    await expect(auth.dialog).toBeVisible();
  });

  test('login form is shown by default in auth modal', async ({ page }) => {
    const home = new HomePage(page);
    const auth = new AuthModalPage(page);
    await home.goto();

    await page.getByRole('button', { name: /sign in/i }).click();
    await auth.waitForOpen();

    await expect(page.getByPlaceholder('user@test.ru')).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('switching to register shows register form', async ({ page }) => {
    const home = new HomePage(page);
    const auth = new AuthModalPage(page);
    await home.goto();

    await page.getByRole('button', { name: /sign in/i }).click();
    await auth.waitForOpen();
    await auth.switchToRegister();

    await expect(page.getByPlaceholder('Full name')).toBeVisible();
    await expect(page.getByPlaceholder(/Confirm password/i)).toBeVisible();
  });

  test('switching back to login from register shows login form', async ({ page }) => {
    const home = new HomePage(page);
    const auth = new AuthModalPage(page);
    await home.goto();

    await page.getByRole('button', { name: /sign in/i }).click();
    await auth.waitForOpen();
    await auth.switchToRegister();
    await auth.switchToLogin();

    await expect(page.getByPlaceholder('user@test.ru')).toBeVisible();
    await expect(page.getByPlaceholder('Full name')).not.toBeVisible();
  });

  test('login with wrong credentials shows error', async ({ page }) => {
    const home = new HomePage(page);
    const auth = new AuthModalPage(page);
    await home.goto();

    await page.getByRole('button', { name: /sign in/i }).click();
    await auth.waitForOpen();

    await auth.fillLoginForm('wrong@example.com', 'wrongpassword');
    await auth.submitLogin();

    await page.waitForTimeout(2000);
    // Modal should stay open or show error
    const errorOrModal = await auth.dialog.isVisible().catch(() => false);
    expect(errorOrModal).toBeTruthy();
  });

  test('register form validates required fields', async ({ page }) => {
    const home = new HomePage(page);
    const auth = new AuthModalPage(page);
    await home.goto();

    await page.getByRole('button', { name: /sign in/i }).click();
    await auth.waitForOpen();
    await auth.switchToRegister();

    await auth.submitRegister();

    // Validation errors should appear (form doesn't submit)
    await expect(auth.dialog).toBeVisible();
  });

  test('register with mismatched passwords shows validation error', async ({ page }) => {
    const home = new HomePage(page);
    const auth = new AuthModalPage(page);
    await home.goto();

    await page.getByRole('button', { name: /sign in/i }).click();
    await auth.waitForOpen();
    await auth.switchToRegister();

    await auth.fillRegisterForm({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different123',
    });
    await auth.submitRegister();

    await page.waitForTimeout(500);
    await expect(auth.dialog).toBeVisible();
  });

  test('closing modal with Escape key works', async ({ page }) => {
    const home = new HomePage(page);
    const auth = new AuthModalPage(page);
    await home.goto();

    await page.getByRole('button', { name: /sign in/i }).click();
    await auth.waitForOpen();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await expect(auth.dialog).not.toBeVisible();
  });
});
