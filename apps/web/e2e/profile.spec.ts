import { test, expect } from '@playwright/test';

const MOCK_USER_ID = '64000000000000000000abcd';

const mockUser = {
  id: MOCK_USER_ID,
  username: 'gardenuser',
  email: 'garden@example.com',
  role: 'USER',
  authProvider: 'LOCAL',
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
};

const mockPosts = [
  {
    id: 'post-1',
    userId: { _id: MOCK_USER_ID, username: 'gardenuser' },
    type: 'UPDATE',
    content: 'My tomato is growing well this season.',
    images: [],
    likesCount: 4,
    commentsCount: 1,
    createdAt: new Date('2024-06-01').toISOString(),
    updatedAt: new Date('2024-06-01').toISOString(),
  },
  {
    id: 'post-2',
    userId: { _id: MOCK_USER_ID, username: 'gardenuser' },
    type: 'GIVEAWAY',
    content: 'Free basil seedlings available.',
    images: [],
    likesCount: 7,
    commentsCount: 3,
    createdAt: new Date('2024-06-05').toISOString(),
    updatedAt: new Date('2024-06-05').toISOString(),
  },
];

const mockPlants = [
  {
    id: 'plant-1',
    userId: MOCK_USER_ID,
    name: 'Cherry Tomato',
    species: 'Solanum lycopersicum',
    status: 'ACTIVE',
    imageUrl: '',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
];

test.describe('ProfilePage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.evaluate((user) => {
      localStorage.setItem(
        'rootshare-auth',
        JSON.stringify({
          state: {
            user,
            tokens: { accessToken: 'mock-token', refreshToken: 'mock-refresh' },
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
    }, mockUser);

    await page.route('**/api/posts', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPosts),
      }),
    );

    await page.route('**/api/plants', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlants),
      }),
    );

    await page.route('**/api/users/profile', async (route) => {
      if (route.request().method() === 'PUT') {
        const body = route.request().postDataJSON() as { username?: string };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockUser, username: body.username ?? mockUser.username }),
        });
      }
      return route.continue();
    });
  });

  test('shows profile header with username and stats', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'gardenuser' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('garden@example.com')).toBeVisible();

    await expect(page.getByText('2', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('1', { exact: true })).toBeVisible();
    await expect(page.getByText('Posts').first()).toBeVisible();
    await expect(page.getByText('Plants').first()).toBeVisible();
  });

  test('post cards render in posts tab', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByText('My tomato is growing well this season.')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText('Free basil seedlings available.')).toBeVisible();
  });

  test('plant cards render after switching to plants tab', async ({ page }) => {
    await page.goto('/profile');

    await page.getByRole('button', { name: /^plants$/i }).click();

    await expect(page.getByText('Cherry Tomato')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Solanum lycopersicum')).toBeVisible();
  });

  test('username updates and stats remain after save — regression for data-loss bug', async ({
    page,
  }) => {
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'gardenuser' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('2', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('1', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /edit username/i }).click();

    const input = page.getByRole('textbox');
    await expect(input).toBeVisible();
    await input.fill('renameduser');

    await page.getByRole('button', { name: /save username/i }).click();

    await expect(page.getByRole('heading', { name: 'renameduser' })).toBeVisible({ timeout: 5000 });

    await expect(page.getByText('2', { exact: true })).toBeVisible();
    await expect(page.getByText('1', { exact: true })).toBeVisible();
  });

  test('cancel edit restores original username', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'gardenuser' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /edit username/i }).click();

    const input = page.getByRole('textbox');
    await input.fill('something-else');

    await page.getByRole('button', { name: /cancel edit/i }).click();

    await expect(page.getByRole('heading', { name: 'gardenuser' })).toBeVisible();
    await expect(page.getByRole('textbox')).not.toBeVisible();
  });

  test('tab switching preserves stats section', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByText('2', { exact: true })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /^plants$/i }).click();
    await expect(page.getByText('Cherry Tomato')).toBeVisible({ timeout: 5000 });

    await expect(page.getByText('2', { exact: true })).toBeVisible();
    await expect(page.getByText('1', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /^posts$/i }).click();
    await expect(page.getByText('My tomato is growing well this season.')).toBeVisible({
      timeout: 5000,
    });
  });
});
