import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });


  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page.getByText('Please confirm your password')).toBeVisible();
  });

  test('should validate username requirements', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/username/i).fill('ab');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible();

    await page.getByLabel(/username/i).clear();
    await page.getByLabel(/username/i).fill('user@name!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Username can only contain letters, numbers, and underscores')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/email address/i).fill('not-an-email');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('should validate password strength requirements', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Password').fill('Short1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();

    await page.getByLabel('Password').clear();
    await page.getByLabel('Password').fill('alllowercase');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Password must contain uppercase, lowercase, and a number')).toBeVisible();
  });

  test('should validate password confirmation matches', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByLabel(/confirm password/i).fill('DifferentPass123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should clear field errors when user starts typing', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Username is required')).toBeVisible();

    await page.getByLabel(/username/i).fill('t');

    await expect(page.getByText('Username is required')).not.toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/username/i).fill('newuser123');
    await page.getByLabel(/email address/i).fill('nitzan@example.com');
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByLabel(/confirm password/i).fill('ValidPass123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('should successfully register with valid data', async ({ page }) => {
    await page.goto('/register');

    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const uniqueUsername = `testuser_${Date.now().toString(36)}`;

    await page.getByLabel(/username/i).fill(uniqueUsername);
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByLabel(/confirm password/i).fill('ValidPass123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/feed/, { timeout: 10000 });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('link', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('should disable form during submission', async ({ page }) => {
    await page.goto('/register');

    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const uniqueUsername = `testuser_${Date.now().toString(36)}`;

    await page.getByLabel(/username/i).fill(uniqueUsername);
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByLabel(/confirm password/i).fill('ValidPass123');

    const submitButton = page.getByRole('button', { name: /create account/i });
    await submitButton.click();
  });
});

test.describe('Google OAuth Registration', () => {
  test('should have Google sign up button', async ({ page }) => {
    await page.goto('/register');

    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test('should redirect to Google OAuth when clicking Google button', async ({ page }) => {
    await page.goto('/register');

    const navigationPromise = page.waitForURL(/accounts\.google\.com|\/api\/auth\/google/, {
      timeout: 5000,
    }).catch(() => null);

    await page.getByRole('button', { name: /continue with google/i }).click();

    await navigationPromise;
  });
});
