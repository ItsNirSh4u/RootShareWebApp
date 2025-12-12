import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { tokens } = useAuthStore.getState();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { tokens, clearAuth } = useAuthStore.getState();

      if (tokens?.refreshToken) {
        try {
          const response = await axios.post(
            '/api/auth/refresh',
            {},
            {
              headers: {
                Authorization: `Bearer ${tokens.refreshToken}`,
              },
            },
          );

          const newTokens = response.data;
          useAuthStore.getState().setAuth(useAuthStore.getState().user!, newTokens);

          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          clearAuth();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearAuth();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
