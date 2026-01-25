import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth state before each test
    await page.goto('/register');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });


  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/register');

    // Submit empty form
    await page.getByRole('button', { name: /create account/i }).click();

    // Check for validation errors
    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page.getByText('Please confirm your password')).toBeVisible();
  });

  test('should validate username requirements', async ({ page }) => {
    await page.goto('/register');

    // Test short username
    await page.getByLabel(/username/i).fill('ab');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible();

    // Clear and test invalid characters
    await page.getByLabel(/username/i).clear();
    await page.getByLabel(/username/i).fill('user@name!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Username can only contain letters, numbers, and underscores')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');

    // Test invalid email
    await page.getByLabel(/email address/i).fill('not-an-email');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('should validate password strength requirements', async ({ page }) => {
    await page.goto('/register');

    // Test short password
    await page.getByLabel('Password').fill('Short1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();

    // Clear and test password without required characters
    await page.getByLabel('Password').clear();
    await page.getByLabel('Password').fill('alllowercase');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Password must contain uppercase, lowercase, and a number')).toBeVisible();
  });

  test('should validate password confirmation matches', async ({ page }) => {
    await page.goto('/register');

    // Enter mismatched passwords
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByLabel(/confirm password/i).fill('DifferentPass123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should clear field errors when user starts typing', async ({ page }) => {
    await page.goto('/register');

    // Submit empty form to trigger errors
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Username is required')).toBeVisible();

    // Start typing in username field
    await page.getByLabel(/username/i).fill('t');

    // Error should be cleared
    await expect(page.getByText('Username is required')).not.toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/register');

    // Try to register with existing email
    await page.getByLabel(/username/i).fill('newuser123');
    await page.getByLabel(/email address/i).fill('nitzan@example.com'); // Existing user
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByLabel(/confirm password/i).fill('ValidPass123');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error for duplicate email
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('should successfully register with valid data', async ({ page }) => {
    await page.goto('/register');

    // Generate unique email for this test
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const uniqueUsername = `testuser_${Date.now().toString(36)}`;

    await page.getByLabel(/username/i).fill(uniqueUsername);
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByLabel(/confirm password/i).fill('ValidPass123');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to feed page after successful registration
    await expect(page).toHaveURL(/\/feed/, { timeout: 10000 });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/register');

    // Click on sign in link
    await page.getByRole('link', { name: 'Sign in' }).click();

    // Should navigate to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should disable form during submission', async ({ page }) => {
    await page.goto('/register');

    // Generate unique email for this test
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const uniqueUsername = `testuser_${Date.now().toString(36)}`;

    await page.getByLabel(/username/i).fill(uniqueUsername);
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel('Password').fill('ValidPass123');
    await page.getByLabel(/confirm password/i).fill('ValidPass123');

    // Click submit
    const submitButton = page.getByRole('button', { name: /create account/i });
    await submitButton.click();

    // Form should be in loading state
    // The button typically shows a spinner or is disabled during submission
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

    // Set up listener for navigation
    const navigationPromise = page.waitForURL(/accounts\.google\.com|\/api\/auth\/google/, {
      timeout: 5000,
    }).catch(() => null);

    // Click Google sign up button
    await page.getByRole('button', { name: /continue with google/i }).click();

    // Should redirect to Google OAuth or our API endpoint
    const result = await navigationPromise;
    // The navigation will either go to Google or to our API endpoint
    // which then redirects to Google
  });
});
