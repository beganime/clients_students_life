import { create } from 'zustand';

import { authApi } from '../api/endpoints';
import { tokenStorage } from '../api/client';
import { UserMe } from '../types/api';
import { clearLocalAvatarUri } from '../utils/localMediaCache';

type AuthState = {
  user: UserMe | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  bootstrap: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  managerLogin: (username: string, password: string) => Promise<void>;
  registerAndLogin: (payload: Parameters<typeof authApi.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  async bootstrap() {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        await clearLocalAvatarUri();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await authApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      await tokenStorage.clearTokens();
      await clearLocalAvatarUri();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  async login(username: string, password: string) {
    await authApi.login({ username, password });
    const user = await authApi.me();
    set({ user, isAuthenticated: true });
  },

  async managerLogin(username: string, password: string) {
    const response = await authApi.managerLogin({ username, password });
    const user = response.user || await authApi.me();
    set({ user, isAuthenticated: true });
  },

  async registerAndLogin(payload) {
    await authApi.register(payload);
    await authApi.login({ username: payload.email, password: payload.password });
    const user = await authApi.me();
    set({ user, isAuthenticated: true });
  },

  async logout() {
    await authApi.logout();
    await clearLocalAvatarUri();
    set({ user: null, isAuthenticated: false });
  },

  async refreshMe() {
    const user = await authApi.me();
    set({ user, isAuthenticated: true });
  },
}));
