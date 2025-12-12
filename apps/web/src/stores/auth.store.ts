import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser, IAuthTokens } from '@rootshare/shared-types';

interface AuthState {
  user: IUser | null;
  tokens: IAuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: IUser, tokens: IAuthTokens) => void;
  clearAuth: () => void;
  updateUser: (user: IUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true }),
      clearAuth: () => set({ user: null, tokens: null, isAuthenticated: false }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'rootshare-auth',
    },
  ),
);
