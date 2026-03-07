import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { Sidebar } from '@/components/layouts/Sidebar';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({ clearAuth: vi.fn() })),
}));

import { useAuthStore } from '@/stores/auth.store';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the navigation sidebar landmark', () => {
    render(<Sidebar isOpen={false} onToggle={vi.fn()} />);

    expect(screen.getByRole('complementary', { name: /navigation sidebar/i })).toBeInTheDocument();
  });

  it('shows "Open sidebar" label on burger button when closed', () => {
    render(<Sidebar isOpen={false} onToggle={vi.fn()} />);

    const button = screen.getByRole('button', { name: /open sidebar/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows "Close sidebar" label on burger button when open', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />);

    const button = screen.getByRole('button', { name: /close sidebar/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onToggle when the burger button is clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar isOpen={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('button', { name: /open sidebar/i }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders nav links for Home, My Garden, and Profile', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />, { initialEntries: ['/feed'] });

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my garden/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
  });

  it('calls clearAuth when the logout button is clicked', async () => {
    const clearAuth = vi.fn();
    vi.mocked(useAuthStore).mockReturnValue({ clearAuth });
    const user = userEvent.setup();
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(clearAuth).toHaveBeenCalledTimes(1);
  });

  it('navigates to /login when the logout button is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders the dark backdrop when open', () => {
    const { container } = render(<Sidebar isOpen={true} onToggle={vi.fn()} />);

    const backdrop = container.querySelector('.bg-black\\/40');
    expect(backdrop).toBeInTheDocument();
  });

  it('does not render the dark backdrop when closed', () => {
    const { container } = render(<Sidebar isOpen={false} onToggle={vi.fn()} />);

    const backdrop = container.querySelector('.bg-black\\/40');
    expect(backdrop).not.toBeInTheDocument();
  });

  it('shows nav link labels when isOpen is true', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />, { initialEntries: ['/feed'] });

    expect(screen.getByText('Home')).toBeVisible();
    expect(screen.getByText('My Garden')).toBeVisible();
    expect(screen.getByText('Profile')).toBeVisible();
  });
});
