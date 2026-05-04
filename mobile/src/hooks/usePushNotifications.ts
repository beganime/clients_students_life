import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { notificationsApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';

const USE_NATIVE_DEVICE_TOKEN = true;

export function usePushNotifications() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    async function register() {
      try {
        if (!Device.isDevice) return;

        const existing = await Notifications.getPermissionsAsync();
        let finalStatus = existing.status;

        if (existing.status !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          finalStatus = requested.status;
        }

        if (finalStatus !== 'granted') return;

        const tokenData = USE_NATIVE_DEVICE_TOKEN
          ? await Notifications.getDevicePushTokenAsync()
          : await Notifications.getExpoPushTokenAsync();

        const token = String(tokenData.data);

        await notificationsApi.saveDeviceToken({
          token,
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown',
          device_id: Device.osInternalBuildId || Device.modelId || '',
        });
      } catch (error) {
        console.log('Push registration error', error);
      }
    }

    register();
  }, [isAuthenticated]);
}