import { create } from 'zustand';

import { authApi } from '../api/endpoints';
import { tokenStorage } from '../api/client';
import { queryClient } from '../api/queryClient';
import { UserMe } from '../types/api';
import { clearLocalAvatarUri } from '../utils/localMediaCache';
import { onboardingSubmissionStorage } from '../api/onboarding';

async function restoreQuestionnaireAccess(user: UserMe) {
  const profile = user.profile;
  // The raw questionnaire token is device-only. Bind the public submission
  // reference after login, but never restore or persist the secret server-side.
  const stored = await onboardingSubmissionStorage.get();
  if (stored && (!profile?.onboarding_public_id || profile.onboarding_public_id === stored.public_id)) {
    await authApi.linkQuestionnaireAccess(stored).catch(() => undefined);
  }
}

type AuthState = {
  user: UserMe | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  bootstrap: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  activateOnboarding: (submission: { public_id: string; access_token: string }) => Promise<void>;
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

  async activateOnboarding(submission) {
    const response = await authApi.activateOnboarding(submission);
    const user = response.user || await authApi.me();
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
    queryClient.removeQueries({ queryKey: ['admission-status'] });
    await onboardingSubmissionStorage.clear();
    await clearLocalAvatarUri();
    set({ user: null, isAuthenticated: false });
  },

  async deleteAccount() {
    await authApi.deleteAccount();
    queryClient.removeQueries({ queryKey: ['admission-status'] });
    await onboardingSubmissionStorage.clear();
    await clearLocalAvatarUri();
    set({ user: null, isAuthenticated: false });
  },

  async refreshMe() {
    const user = await authApi.me();
    await restoreQuestionnaireAccess(user);
    set({ user, isAuthenticated: true });
  },
}));
