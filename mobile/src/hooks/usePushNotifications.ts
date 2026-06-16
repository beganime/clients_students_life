import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { notificationsApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';

const USE_NATIVE_DEVICE_TOKEN = true;

function deviceLabel() {
  return Device.modelName || Device.modelId || '';
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    let cancelled = false;

    async function register() {
      try {
        if (!isAuthenticated) return;
        if (Platform.OS === 'web') return;
        if (!Device.isDevice) return;

        const existing = await Notifications.getPermissionsAsync();
        let finalStatus = existing.status;

        if (existing.status !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          finalStatus = requested.status;
        }

        if (finalStatus !== 'granted') return;
        if (cancelled) return;

        const tokenData = USE_NATIVE_DEVICE_TOKEN
          ? await Notifications.getDevicePushTokenAsync()
          : await Notifications.getExpoPushTokenAsync();

        const token = String(tokenData.data);

        if (!token || cancelled) return;

        await notificationsApi.saveDeviceToken({
          token,
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown',
          device_id: deviceLabel(),
        });
      } catch {
        // Push registration must not interrupt the main app flow.
      }
    }

    register();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);
}
