import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createMockAuthResponse } from '../test/test-utils';
import { LoginPage } from './LoginPage';
import * as authLib from '../lib/auth';
import { useAuthStore } from '../stores/auth.store';

// Mock the auth library
vi.mock('../lib/auth', () => ({
  loginUser: vi.fn(),
  initiateGoogleAuth: vi.fn(),
  getAuthErrorMessage: vi.fn((_error) => 'An error occurred'),
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false });
  });

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      render(<LoginPage />);

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
    });

    it('should have correct link to register page', () => {
      render(<LoginPage />);

      const registerLink = screen.getByRole('link', { name: /create one/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should not call loginUser with invalid email', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Login should not be called because email validation should fail
      expect(authLib.loginUser).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), '12345');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    it('should clear email error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email address/i), 't');

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });

    it('should clear password error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/password/i), 'p');

      await waitFor(() => {
        expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call loginUser with correct credentials', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = createMockAuthResponse();
      vi.mocked(authLib.loginUser).mockResolvedValueOnce(mockAuthResponse);

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(authLib.loginUser).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should navigate to feed on successful login', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = createMockAuthResponse();
      vi.mocked(authLib.loginUser).mockResolvedValueOnce(mockAuthResponse);

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/feed', { replace: true });
      });
    });

    it('should update auth store on successful login', async () => {
      const user = userEvent.setup();
      const mockAuthResponse = createMockAuthResponse();
      vi.mocked(authLib.loginUser).mockResolvedValueOnce(mockAuthResponse);

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(mockAuthResponse.user);
      });
    });

    it('should show error message on login failure', async () => {
      const user = userEvent.setup();
      vi.mocked(authLib.loginUser).mockRejectedValueOnce(new Error('Login failed'));
      vi.mocked(authLib.getAuthErrorMessage).mockReturnValueOnce('Invalid email or password');

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password');
      });
    });

    it('should not call loginUser if validation fails', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(authLib.loginUser).not.toHaveBeenCalled();
    });
  });

  describe('Google OAuth', () => {
    it('should call initiateGoogleAuth when Google button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.click(screen.getByRole('button', { name: /continue with google/i }));

      expect(authLib.initiateGoogleAuth).toHaveBeenCalled();
    });

    it('should show error if Google auth fails', async () => {
      const user = userEvent.setup();
      vi.mocked(authLib.initiateGoogleAuth).mockRejectedValueOnce(new Error('Google auth failed'));
      vi.mocked(authLib.getAuthErrorMessage).mockReturnValueOnce('Google authentication failed');

      render(<LoginPage />);

      await user.click(screen.getByRole('button', { name: /continue with google/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Google authentication failed');
      });
    });
  });

  describe('Loading States', () => {
    it('should disable inputs during email login submission', async () => {
      const user = userEvent.setup();
      vi.mocked(authLib.loginUser).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
    });

    it('should disable sign in button during Google auth', async () => {
      const user = userEvent.setup();
      vi.mocked(authLib.initiateGoogleAuth).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<LoginPage />);

      await user.click(screen.getByRole('button', { name: /continue with google/i }));

      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
    });
  });
});
