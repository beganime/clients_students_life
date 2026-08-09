import { create } from 'zustand';

import { authApi } from '../api/endpoints';
import { tokenStorage } from '../api/client';
import { UserMe } from '../types/api';
import { clearLocalAvatarUri } from '../utils/localMediaCache';
import { onboardingSubmissionStorage } from '../api/onboarding';

async function restoreQuestionnaireAccess(user: UserMe) {
  const profile = user.profile;
  if (profile?.onboarding_public_id && profile.onboarding_access_token) {
    await onboardingSubmissionStorage.set({
      public_id: profile.onboarding_public_id,
      access_token: profile.onboarding_access_token,
      kind: profile.onboarding_kind || 'applicant',
    });
  }
}

type AuthState = {
  user: UserMe | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  bootstrap: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  managerLogin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
      await restoreQuestionnaireAccess(user);
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
    await restoreQuestionnaireAccess(user);
    set({ user, isAuthenticated: true });
  },

  async managerLogin(username: string, password: string) {
    const response = await authApi.managerLogin({ username, password });
    const user = response.user || await authApi.me();
    await restoreQuestionnaireAccess(user);
    set({ user, isAuthenticated: true });
  },

  async logout() {
    await authApi.logout();
    await clearLocalAvatarUri();
    set({ user: null, isAuthenticated: false });
  },

  async deleteAccount() {
    await authApi.deleteAccount();
    await clearLocalAvatarUri();
    set({ user: null, isAuthenticated: false });
  },

  async refreshMe() {
    const user = await authApi.me();
    await restoreQuestionnaireAccess(user);
    set({ user, isAuthenticated: true });
  },
}));
