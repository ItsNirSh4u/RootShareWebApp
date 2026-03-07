import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { FeedPage } from '@/pages/FeedPage';
import { fetchPosts, fetchFeaturedPlants, toggleLikePost } from '@/pages/Feed/feed';
import { PostType, PlantStatus } from '@rootshare/shared-types';
import type { IPostWithDetails, IPlant } from '@rootshare/shared-types';

vi.mock('@/pages/Feed/feed', () => ({
  fetchPosts: vi.fn(),
  fetchFeaturedPlants: vi.fn(),
  toggleLikePost: vi.fn(),
}));

function createMockPost(overrides?: Partial<IPostWithDetails>): IPostWithDetails {
  return {
    id: 'post-1',
    userId: 'user-1',
    type: PostType.UPDATE,
    content: 'My plant is growing well',
    images: [],
    likesCount: 5,
    commentsCount: 2,
    isLiked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-1', username: 'testuser' },
    ...overrides,
  };
}

function createMockPlant(overrides?: Partial<IPlant>): IPlant {
  return {
    id: 'plant-1',
    userId: 'user-1',
    name: 'My Fern',
    species: 'Nephrolepis exaltata',
    status: PlantStatus.ACTIVE,
    imageUrl: 'https://example.com/plant.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('FeedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchPosts).mockResolvedValue([]);
    vi.mocked(fetchFeaturedPlants).mockResolvedValue([]);
    vi.mocked(toggleLikePost).mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders feed page layout with heading and featured plants section', async () => {
      render(<FeedPage />);

      expect(screen.getByRole('heading', { name: /community feed/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /featured plants/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(fetchPosts).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading skeletons while posts are being fetched', () => {
      vi.mocked(fetchPosts).mockReturnValue(new Promise(() => {}));
      vi.mocked(fetchFeaturedPlants).mockResolvedValue([]);

      render(<FeedPage />);

      const postsSection = screen.getByRole('region', { name: /posts/i });
      const skeletons = postsSection.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders posts after successful fetch', async () => {
      const posts = [
        createMockPost({ id: 'post-1', content: 'First post content', user: { id: 'user-1', username: 'alice' } }),
        createMockPost({ id: 'post-2', content: 'Second post content', user: { id: 'user-2', username: 'bob' } }),
      ];
      vi.mocked(fetchPosts).mockResolvedValue(posts);

      render(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByText('First post content')).toBeInTheDocument();
        expect(screen.getByText('Second post content')).toBeInTheDocument();
      });
    });

    it('shows error alert when posts fetch fails', async () => {
      vi.mocked(fetchPosts).mockRejectedValue(new Error('Network error'));

      render(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to load posts/i);
      });
    });

    it('shows empty state when no posts match the active filter', async () => {
      const posts = [
        createMockPost({ id: 'post-1', type: PostType.UPDATE }),
      ];
      vi.mocked(fetchPosts).mockResolvedValue(posts);

      const user = userEvent.setup();
      render(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByText('My plant is growing well')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /swap/i }));

      await waitFor(() => {
        expect(screen.getByText(/no posts found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('filters posts by type when a type pill is clicked', async () => {
      const posts = [
        createMockPost({ id: 'post-1', type: PostType.UPDATE, content: 'Update post' }),
        createMockPost({ id: 'post-2', type: PostType.SWAP, content: 'Swap post', user: { id: 'user-2', username: 'bob' } }),
      ];
      vi.mocked(fetchPosts).mockResolvedValue(posts);

      const user = userEvent.setup();
      render(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByText('Update post')).toBeInTheDocument();
        expect(screen.getByText('Swap post')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^swap$/i }));

      await waitFor(() => {
        expect(screen.queryByText('Update post')).not.toBeInTheDocument();
        expect(screen.getByText('Swap post')).toBeInTheDocument();
      });
    });

    it('filters posts by search text input', async () => {
      const posts = [
        createMockPost({ id: 'post-1', content: 'Growing tomatoes this season' }),
        createMockPost({ id: 'post-2', content: 'Pruning my roses today', user: { id: 'user-2', username: 'bob' } }),
      ];
      vi.mocked(fetchPosts).mockResolvedValue(posts);

      const user = userEvent.setup();
      render(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByText('Growing tomatoes this season')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/search posts/i), 'tomatoes');

      await waitFor(() => {
        expect(screen.getByText('Growing tomatoes this season')).toBeInTheDocument();
        expect(screen.queryByText('Pruning my roses today')).not.toBeInTheDocument();
      });
    });

    it('combines type filter and search filter showing only intersected results', async () => {
      const posts = [
        createMockPost({ id: 'post-1', type: PostType.SWAP, content: 'Swap my fern', user: { id: 'user-1', username: 'alice' } }),
        createMockPost({ id: 'post-2', type: PostType.UPDATE, content: 'Update on fern', user: { id: 'user-2', username: 'bob' } }),
        createMockPost({ id: 'post-3', type: PostType.SWAP, content: 'Swap my cactus', user: { id: 'user-3', username: 'carol' } }),
      ];
      vi.mocked(fetchPosts).mockResolvedValue(posts);

      const user = userEvent.setup();
      render(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByText('Swap my fern')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^swap$/i }));
      await user.type(screen.getByPlaceholderText(/search posts/i), 'fern');

      await waitFor(() => {
        expect(screen.getByText('Swap my fern')).toBeInTheDocument();
        expect(screen.queryByText('Update on fern')).not.toBeInTheDocument();
        expect(screen.queryByText('Swap my cactus')).not.toBeInTheDocument();
      });
    });
  });

  describe('Likes', () => {
    it('calls toggleLikePost with the correct post id when the like button is clicked', async () => {
      const post = createMockPost({ id: 'post-abc' });
      vi.mocked(fetchPosts).mockResolvedValue([post]);

      const user = userEvent.setup();
      render(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByText('My plant is growing well')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /like post/i }));

      expect(toggleLikePost).toHaveBeenCalledWith('post-abc');
    });
  });

  describe('Featured Plants', () => {
    it('renders plant names from fetchFeaturedPlants in the carousel', async () => {
      const plants = [
        createMockPlant({ id: 'plant-1', name: 'Boston Fern' }),
        createMockPlant({ id: 'plant-2', name: 'Spider Plant' }),
      ];
      vi.mocked(fetchFeaturedPlants).mockResolvedValue(plants);

      render(<FeedPage />);

      await waitFor(() => {
        expect(screen.getByText('Boston Fern')).toBeInTheDocument();
        expect(screen.getByText('Spider Plant')).toBeInTheDocument();
      });
    });
  });
});
