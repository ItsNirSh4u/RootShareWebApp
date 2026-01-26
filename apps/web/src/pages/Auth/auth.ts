import api from '@/lib/api';
import { IAuthResponse, IUserLogin, IUserRegistration } from '@rootshare/shared-types';

export interface AuthError {
  message: string;
  statusCode?: number;
}

export async function loginUser(credentials: IUserLogin): Promise<IAuthResponse> {
  const response = await api.post<IAuthResponse>('/auth/login', credentials);
  return response.data;
}

export async function registerUser(data: IUserRegistration): Promise<IAuthResponse> {
  const response = await api.post<IAuthResponse>('/auth/register', data);
  return response.data;
}

export async function initiateGoogleAuth(): Promise<void> {
  // Redirect to the backend Google OAuth endpoint
  window.location.href = '/api/auth/google';
}

export async function handleGoogleCallback(code: string): Promise<IAuthResponse> {
  const response = await api.get<IAuthResponse>('/auth/google/callback', {
    params: { code },
  });
  return response.data;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const axiosError = error as { response?: { data?: { message?: string }; status?: number } };

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    if (axiosError.response?.status === 401) {
      return 'Invalid email or password';
    }

    if (axiosError.response?.status === 409) {
      return 'An account with this email already exists';
    }

    if (axiosError.response?.status === 400) {
      return 'Please check your input and try again';
    }
  }

  return 'Something went wrong. Please try again.';
}

import {
  MAXIMUM_USERNAME_LENGTH,
  MINIMUM_PASSWORD_LENGTH,
  MINIMUM_USERNAME_LENGTH,
} from '@/config/constants';

export const validateUsername = (
  username: string,
  validationLevel: 'REGISTER' | 'LOGIN',
): string | undefined => {
  if (!username.trim()) {
    return 'Username is required';
  }

  if (validationLevel === 'REGISTER') {
    if (username.length < MINIMUM_USERNAME_LENGTH) {
      return `Username must be at least ${MINIMUM_USERNAME_LENGTH} characters`;
    }
    if (username.length > MAXIMUM_USERNAME_LENGTH) {
      return `Username must be less than ${MAXIMUM_USERNAME_LENGTH} characters`;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
  }
};

export const validateEmail = (
  email: string,
  validationLevel: 'REGISTER' | 'LOGIN',
): string | undefined => {
  if (!email.trim()) {
    return 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return validationLevel === 'REGISTER'
      ? 'Please enter a valid email address'
      : 'Invalid email format';
  }
};

export const validatePassword = (
  password: string,
  validationLevel: 'REGISTER' | 'LOGIN',
): string | undefined => {
  if (!password.trim()) {
    return 'Password is required';
  }
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters`;
  }
  if (validationLevel === 'REGISTER') {
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
  }
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string,
): string | undefined => {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
};
