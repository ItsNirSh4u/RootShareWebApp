import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockAuthResponse } from '@/test/test-utils';
import { RegisterPage } from '@/pages/Auth/Register/RegisterPage';
import * as authLib from '@/pages/Auth/auth';
import { useAuthStore } from '@/stores/auth.store';

vi.mock('@/pages/Auth/auth', async () => {
  const actual = await vi.importActual('@/pages/Auth/auth');
  return {
    ...actual,
    registerUser: vi.fn(),
    initiateGoogleAuth: vi.fn(),
    getAuthErrorMessage: vi.fn((_error) => 'An error occurred'),
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false });
  });

  describe('Rendering', () => {
    it('should render registration form with all elements', () => {
      render(<RegisterPage />);

      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
      expect(screen.getByText(/join the community of urban gardeners/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should have correct link to login page', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /sign in/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Username Validation', () => {
    it('should show error when username is empty', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });

    it('should show error when username is too short', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'ab');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
      });
    });

    it('should show error when username contains invalid characters', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'user@name!');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Username can only contain letters, numbers, and underscores'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Email Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'validuser');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should not call registerUser with invalid email', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'validuser');
      await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(authLib.registerUser).not.toHaveBeenCalled();
    });
  });

  describe('Password Validation', () => {
    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'validuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'validuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'Short1');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('should show error when password lacks required characters', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'validuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'alllowercase');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Password must contain at least one uppercase letter'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Confirm Password Validation', () => {
    it('should show error when confirm password is empty', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'validuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'validuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass456');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('Field Error Clearing', () => {
    it('should clear username error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/username/i), 't');

      await waitFor(() => {
        expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
      });
    });

    it('should clear email error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'validuser');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email address/i), 't');

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call registerUser with correct data', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = createMockAuthResponse();
      vi.mocked(authLib.registerUser).mockResolvedValueOnce(mockAuthResponse);

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(authLib.registerUser).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'ValidPass123',
        });
      });
    });

    it('should navigate to feed on successful registration', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = createMockAuthResponse();
      vi.mocked(authLib.registerUser).mockResolvedValueOnce(mockAuthResponse);

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/feed', { replace: true });
      });
    });

    it('should update auth store on successful registration', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = createMockAuthResponse();
      vi.mocked(authLib.registerUser).mockResolvedValueOnce(mockAuthResponse);

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(mockAuthResponse.user);
      });
    });

    it('should show error message on registration failure', async () => {
      const user = userEvent.setup();
      vi.mocked(authLib.registerUser).mockRejectedValueOnce(new Error('Registration failed'));
      vi.mocked(authLib.getAuthErrorMessage).mockReturnValueOnce(
        'An account with this email already exists',
      );

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.type(screen.getByLabelText('Password'), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'An account with this email already exists',
        );
      });
    });

    it('should not call registerUser if validation fails', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(authLib.registerUser).not.toHaveBeenCalled();
    });
  });

  describe('Google OAuth', () => {
    it('should call initiateGoogleAuth when Google button is clicked', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.click(screen.getByRole('button', { name: /continue with google/i }));

      expect(authLib.initiateGoogleAuth).toHaveBeenCalled();
    });

    it('should show error if Google auth fails', async () => {
      const user = userEvent.setup();
      vi.mocked(authLib.initiateGoogleAuth).mockRejectedValueOnce(new Error('Google auth failed'));
      vi.mocked(authLib.getAuthErrorMessage).mockReturnValueOnce('Google authentication failed');

      render(<RegisterPage />);

      await user.click(screen.getByRole('button', { name: /continue with google/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Google authentication failed');
      });
    });
  });
});
