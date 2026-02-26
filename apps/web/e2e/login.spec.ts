import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email address/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('should show error for short password', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('12345');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });

  test('should clear field errors when user starts typing', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Email is required')).toBeVisible();

    await page.getByLabel(/email address/i).fill('t');

    await expect(page.getByText('Email is required')).not.toBeVisible();
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email address/i).fill('nonexistent@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email address/i).fill('nitzan@example.com');
    await page.getByLabel(/password/i).fill('Admin111');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/feed/, { timeout: 10000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: 'Create one' }).click();

    await expect(page).toHaveURL(/\/register/);
  });

  test('should redirect to intended page after login', async ({ page }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel(/email address/i).fill('nitzan@example.com');
    await page.getByLabel(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /sign in/i }).click();
  });
});
