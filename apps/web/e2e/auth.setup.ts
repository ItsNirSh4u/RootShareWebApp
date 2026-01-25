import { test as setup } from '@playwright/test';

// This file can be used to set up authenticated state for tests that need it
// For now, we'll keep it simple and test auth flows directly

setup('clear auth state', async ({ page }) => {
  // Clear localStorage to ensure clean state
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });
});
