import { test as setup } from '@playwright/test';

setup('clear auth state', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });
});
