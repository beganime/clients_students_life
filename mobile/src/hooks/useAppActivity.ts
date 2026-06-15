import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

import { authApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';

function appVersion() {
  return Constants.expoConfig?.version || Constants.nativeAppVersion || '';
}

function deviceLabel() {
  return Device.modelName || Device.modelId || '';
}

export function useAppActivity() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function sendActivity(state: 'active' | 'inactive' | 'background') {
      if (cancelled) return;
      try {
        await authApi.updateActivity({
          state,
          is_online: state === 'active',
          device_platform: Platform.OS,
          device_id: deviceLabel(),
          app_version: appVersion(),
        });
      } catch {
        // Activity pings should never interrupt the user flow.
      }
    }

    function handleStateChange(nextState: AppStateStatus) {
      if (nextState === 'active') {
        sendActivity('active');
        return;
      }
      sendActivity(nextState === 'background' ? 'background' : 'inactive');
    }

    sendActivity(AppState.currentState === 'active' ? 'active' : 'inactive');
    const subscription = AppState.addEventListener('change', handleStateChange);

    return () => {
      cancelled = true;
      subscription.remove();
      authApi.updateActivity({ state: 'inactive', is_online: false }).catch(() => undefined);
    };
  }, [isAuthenticated]);
}
