import api from './api';
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
