import { test, expect } from '@playwright/test';

// ─── Shared constants ───────────────────────────────────────────────────────
const MOCK_USER_ID = '64000000000000000000abcd';
const PLANT_ID = 'aabb000000000000000001aa';
const POST_ID = 'ccdd000000000000000002bb';

const mockUser = {
  id: MOCK_USER_ID,
  username: 'gardentester',
  email: 'gardentester@example.com',
  role: 'USER',
  authProvider: 'LOCAL',
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
};

const PLANT_IMAGE_URL = 'https://placehold.co/400x300/4ade80/ffffff?text=Monstera';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePlant(overrides: Record<string, unknown> = {}) {
  return {
    _id: PLANT_ID,
    id: PLANT_ID,
    userId: MOCK_USER_ID,
    name: 'Test Monstera',
    species: 'Monstera deliciosa',
    status: 'ACTIVE',
    imageUrl: PLANT_IMAGE_URL,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    ...overrides,
  };
}

function makePost(plantId: string | null = PLANT_ID) {
  return {
    _id: POST_ID,
    id: POST_ID,
    userId: { _id: MOCK_USER_ID, username: mockUser.username, profileImageUrl: null },
    plantId: plantId
      ? { _id: plantId, name: 'Test Monstera', species: 'Monstera deliciosa' }
      : null,
    type: 'UPDATE',
    content: 'My Monstera is absolutely thriving!',
    images: [],
    likesCount: 0,
    commentsCount: 0,
    isLiked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function setupAuth(page: import('@playwright/test').Page) {
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
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('My Garden — post linking and stats', () => {
  test('creates plant with image, links a post, and verifies postsCount icon and post appear in garden', async ({
    page,
  }) => {
    // ── Stateful mock state ──────────────────────────────────────────────────
    let plantCreated = false;
    const linkedPosts: ReturnType<typeof makePost>[] = [];

    await setupAuth(page);

    // Species list
    await page.route('**/api/species', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ _id: 'sp1', name: 'Monstera deliciosa' }]),
      }),
    );

    // Plant image upload — returns a URL (simulates "image from url")
    await page.route('**/api/plants/images', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ url: PLANT_IMAGE_URL }),
      }),
    );

    // GET /api/plants/with-stats — returns live postsCount based on state
    await page.route('**/api/plants/with-stats', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          plantCreated
            ? [makePlant({ postsCount: linkedPosts.length, commentsCount: 0 })]
            : [],
        ),
      }),
    );

    // GET /api/plants (used by PostModal plant dropdown) + POST /api/plants (create)
    await page.route('**/api/plants', async (route) => {
      if (route.request().method() === 'POST') {
        plantCreated = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(makePlant()),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(plantCreated ? [makePlant()] : []),
      });
    });

    // GET /api/posts?plantId=... + POST /api/posts
    await page.route(/\/api\/posts/, async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();

      if (method === 'POST') {
        const body = route.request().postDataJSON() as { plantId?: string; type: string; content: string; images?: string[] };
        const newPost = makePost(body.plantId ?? null);
        if (body.plantId === PLANT_ID) {
          linkedPosts.push(newPost);
        }
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newPost),
        });
      }

      // GET with plantId filter (PlantDetailPanel)
      const plantIdParam = url.searchParams.get('plantId');
      if (plantIdParam) {
        const posts = linkedPosts.filter((p) => p.plantId && p.plantId._id === plantIdParam);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(posts),
        });
      }

      // GET without filter (ProfilePage posts tab)
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(linkedPosts),
      });
    });

    // Comments
    await page.route(/\/api\/comments/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // Likes
    await page.route(/\/api\/likes/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: false }) }),
    );

    // User profile
    await page.route('**/api/users/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      }),
    );

    // ── STEP 1: My Garden is empty ────────────────────────────────────────────
    await page.goto('/inventory');
    await expect(page.getByRole('heading', { name: 'My Garden' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('No plants yet')).toBeVisible();

    // ── STEP 2: Create a plant with uploaded image ────────────────────────────
    await page.getByRole('button', { name: /add plant/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Add Plant' })).toBeVisible();

    // Upload via hidden file input (mock returns PLANT_IMAGE_URL)
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles([
      {
        name: 'monstera.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-jpeg-data'),
      },
    ]);

    // Wait for image preview — confirms upload succeeded and imageUrl is set
    await expect(page.locator('img[alt="Plant preview"]')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('e.g. My Monstera').fill('Test Monstera');
    await page.getByPlaceholder('e.g. Monstera deliciosa').fill('Monstera deliciosa');

    // Click the submit button inside the modal (last "Add Plant" button)
    await page.getByRole('button', { name: 'Add Plant' }).last().click();

    // ── STEP 3: Plant card visible with postsCount = 0 ────────────────────────
    await expect(page.getByText('Test Monstera').first()).toBeVisible({ timeout: 5000 });

    // The Sprout icon sits next to the postsCount text inside the card.
    // Both "0" values are inside the bottom of the card — one for posts, one for comments.
    const plantCardBottom = page.locator('.aspect-\\[3\\/4\\]').filter({ hasText: 'Test Monstera' });
    await expect(plantCardBottom).toBeVisible();

    // Verify "0" appears in the card stats (postsCount starts at 0)
    const statsArea = plantCardBottom.locator('div.flex.items-center.gap-3');
    await expect(statsArea).toContainText('0');

    // ── STEP 4: Navigate to Profile, create post linked to the plant ──────────
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: mockUser.username })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /new post/i }).click();
    await expect(page.getByRole('heading', { name: 'New Post' })).toBeVisible();

    // Wait for plant dropdown to load, then select our plant
    const plantSelect = page.locator('select').first();
    await expect(plantSelect).toBeVisible({ timeout: 5000 });
    await plantSelect.selectOption({ value: PLANT_ID });

    await page.getByPlaceholder("What's growing on?").fill('My Monstera is absolutely thriving!');

    // Submit the post
    await page.getByRole('button', { name: 'Post' }).last().click();

    // Confirm modal closed (post submitted successfully)
    await expect(page.getByRole('heading', { name: 'New Post' })).not.toBeVisible({ timeout: 5000 });

    // ── STEP 5: Navigate back to My Garden ───────────────────────────────────
    await page.goto('/inventory');
    await expect(page.getByRole('heading', { name: 'My Garden' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test Monstera').first()).toBeVisible({ timeout: 5000 });

    // ── STEP 6: postsCount icon must show 1 in the plant card ────────────────
    const updatedCard = page.locator('.aspect-\\[3\\/4\\]').filter({ hasText: 'Test Monstera' });
    const updatedStats = updatedCard.locator('div.flex.items-center.gap-3');

    // This assertion is the primary regression check:
    // After a post is created and linked to the plant, postsCount must be 1.
    await expect(updatedStats).toContainText('1', { timeout: 5000 });
    // commentsCount should still be 0
    await expect(updatedStats).not.toContainText('2');

    // ── STEP 7: Open plant detail panel, verify stats ─────────────────────────
    await updatedCard.click();

    // Panel header
    await expect(page.locator('aside h2').filter({ hasText: 'Test Monstera' })).toBeVisible({ timeout: 5000 });

    // Stats section: Posts count = 1
    const statsSection = page.locator('aside .flex.gap-4.py-3');
    await expect(statsSection).toContainText('1');
    await expect(statsSection.getByText('Posts')).toBeVisible();

    // ── STEP 8: Related post is visible in detail panel ───────────────────────
    await expect(
      page.locator('aside').getByText('My Monstera is absolutely thriving!'),
    ).toBeVisible({ timeout: 5000 });
  });
});
