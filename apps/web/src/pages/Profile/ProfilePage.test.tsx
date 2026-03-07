import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockUser } from '@/test/test-utils';
import { ProfilePage } from '@/pages/Profile/ProfilePage';
import { fetchUserPosts, fetchUserPlants, updateProfile } from '@/pages/Profile/profile';
import { PostType, PlantStatus } from '@rootshare/shared-types';
import type { IPostWithDetails, IPlant } from '@rootshare/shared-types';

vi.mock('@/pages/Profile/profile', () => ({
  fetchUserPosts: vi.fn(),
  fetchUserPlants: vi.fn(),
  updateProfile: vi.fn(),
  uploadProfileImage: vi.fn(),
}));

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    user: createMockUser(),
    updateUser: vi.fn(),
  })),
}));

import { useAuthStore } from '@/stores/auth.store';

const mockPost: IPostWithDetails = {
  id: 'post-1',
  userId: 'user-123',
  type: PostType.UPDATE,
  content: 'Beautiful tomato plant!',
  images: [],
  likesCount: 5,
  commentsCount: 2,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: { id: 'user-123', username: 'testuser' },
};

const mockPlant: IPlant = {
  id: 'plant-1',
  userId: 'user-123',
  name: 'Cherry Tomato',
  species: 'Solanum lycopersicum',
  status: PlantStatus.ACTIVE,
  imageUrl: '',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: createMockUser(),
      updateUser: vi.fn(),
    });
    vi.mocked(fetchUserPosts).mockResolvedValue([]);
    vi.mocked(fetchUserPlants).mockResolvedValue([]);
    vi.mocked(updateProfile).mockResolvedValue(createMockUser());
  });

  describe('Profile header', () => {
    it('renders username and email from auth store', async () => {
      render(<ProfilePage />);

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows initials avatar when no profile image is set', async () => {
      render(<ProfilePage />);

      // createMockUser() has no profileImageUrl, so initials should render
      // "testuser" is one word -> first char -> "T"
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  describe('Stats', () => {
    it('shows posts count and plants count after data loads', async () => {
      vi.mocked(fetchUserPosts).mockResolvedValue([mockPost]);
      vi.mocked(fetchUserPlants).mockResolvedValue([mockPlant]);

      render(<ProfilePage />);

      await waitFor(() => {
        // two stats each showing "1" (plus possible matches in cards)
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
      });

      // tab buttons + stat labels both say "Posts" / "Plants"
      const statLabels = screen.getAllByText(/^(Posts|Plants)$/);
      expect(statLabels.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Tabs', () => {
    it('switches to plants tab and shows plant content, then back to posts', async () => {
      vi.mocked(fetchUserPosts).mockResolvedValue([mockPost]);
      vi.mocked(fetchUserPlants).mockResolvedValue([mockPlant]);

      const user = userEvent.setup();
      render(<ProfilePage />);

      // Posts tab is active by default
      await screen.findByText('Beautiful tomato plant!');

      // Switch to Plants tab
      await user.click(screen.getByRole('button', { name: /^plants$/i }));

      await screen.findByText('Cherry Tomato');
      expect(screen.queryByText('Beautiful tomato plant!')).not.toBeInTheDocument();

      // Switch back to Posts tab
      await user.click(screen.getByRole('button', { name: /^posts$/i }));

      await screen.findByText('Beautiful tomato plant!');
      expect(screen.queryByText('Cherry Tomato')).not.toBeInTheDocument();
    });

    it('shows "No posts yet" empty state when posts array is empty', async () => {
      vi.mocked(fetchUserPosts).mockResolvedValue([]);

      render(<ProfilePage />);

      await screen.findByText('No posts yet');
    });

    it('shows "No plants yet" empty state when plants array is empty', async () => {
      vi.mocked(fetchUserPlants).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByRole('button', { name: /^plants$/i }));

      await screen.findByText('No plants yet');
    });
  });

  describe('Edit username', () => {
    it('shows input when edit button is clicked, saves and calls updateProfile', async () => {
      const updatedUser = createMockUser({ username: 'newname' });
      vi.mocked(updateProfile).mockResolvedValue(updatedUser);

      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByRole('button', { name: /edit username/i }));

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();

      await user.clear(input);
      await user.type(input, 'newname');

      await user.click(screen.getByRole('button', { name: /save username/i }));

      await waitFor(() => {
        expect(updateProfile).toHaveBeenCalledWith({ username: 'newname' });
      });
    });

    it('cancels edit and restores original username when X is clicked', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByRole('button', { name: /edit username/i }));

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'something-else');

      await user.click(screen.getByRole('button', { name: /cancel edit/i }));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  describe('Post and plant cards', () => {
    it('renders post content when posts exist', async () => {
      vi.mocked(fetchUserPosts).mockResolvedValue([mockPost]);

      render(<ProfilePage />);

      await screen.findByText('Beautiful tomato plant!');
      expect(screen.getByText('5 likes')).toBeInTheDocument();
    });

    it('renders plant name and species when plants exist', async () => {
      vi.mocked(fetchUserPlants).mockResolvedValue([mockPlant]);

      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByRole('button', { name: /^plants$/i }));

      await screen.findByText('Cherry Tomato');
      expect(screen.getByText('Solanum lycopersicum')).toBeInTheDocument();
    });
  });
});
