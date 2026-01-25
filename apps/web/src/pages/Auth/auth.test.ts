import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loginUser,
  registerUser,
  initiateGoogleAuth,
  getAuthErrorMessage,
} from '@/pages/Auth/auth';
import api from '@/lib/api';

// Mock the api module
vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('auth lib', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should call api.post with correct endpoint and credentials', async () => {
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@example.com' },
          tokens: { accessToken: 'access', refreshToken: 'refresh' },
        },
      };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password123' };
      const result = await loginUser(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate API errors', async () => {
      const error = new Error('Login failed');
      vi.mocked(api.post).mockRejectedValueOnce(error);

      const credentials = { email: 'test@example.com', password: 'wrong' };

      await expect(loginUser(credentials)).rejects.toThrow('Login failed');
    });
  });

  describe('registerUser', () => {
    it('should call api.post with correct endpoint and data', async () => {
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@example.com', username: 'testuser' },
          tokens: { accessToken: 'access', refreshToken: 'refresh' },
        },
      };
      vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

      const registrationData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'ValidPass123',
      };
      const result = await registerUser(registrationData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', registrationData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate API errors', async () => {
      const error = new Error('Registration failed');
      vi.mocked(api.post).mockRejectedValueOnce(error);

      const registrationData = {
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'ValidPass123',
      };

      await expect(registerUser(registrationData)).rejects.toThrow('Registration failed');
    });
  });

  describe('initiateGoogleAuth', () => {
    it('should redirect to Google OAuth endpoint', async () => {
      await initiateGoogleAuth();

      expect(window.location.href).toBe('/api/auth/google');
    });
  });

  describe('getAuthErrorMessage', () => {
    it('should return message from response data', () => {
      const error = {
        response: {
          data: { message: 'Custom error message' },
          status: 400,
        },
      };

      expect(getAuthErrorMessage(error)).toBe('Custom error message');
    });

    it('should return "Invalid email or password" for 401 status', () => {
      const error = {
        response: {
          status: 401,
        },
      };

      expect(getAuthErrorMessage(error)).toBe('Invalid email or password');
    });

    it('should return "An account with this email already exists" for 409 status', () => {
      const error = {
        response: {
          status: 409,
        },
      };

      expect(getAuthErrorMessage(error)).toBe('An account with this email already exists');
    });

    it('should return "Please check your input and try again" for 400 status', () => {
      const error = {
        response: {
          status: 400,
        },
      };

      expect(getAuthErrorMessage(error)).toBe('Please check your input and try again');
    });

    it('should return generic message for unknown errors', () => {
      expect(getAuthErrorMessage(null)).toBe('Something went wrong. Please try again.');
      expect(getAuthErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
      expect(getAuthErrorMessage('string error')).toBe('Something went wrong. Please try again.');
    });

    it('should prefer response message over status-based message', () => {
      const error = {
        response: {
          data: { message: 'Specific error from server' },
          status: 401,
        },
      };

      expect(getAuthErrorMessage(error)).toBe('Specific error from server');
    });
  });
});
