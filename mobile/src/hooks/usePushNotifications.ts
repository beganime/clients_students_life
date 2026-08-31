import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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

export async function getDevicePushToken(requestPermission = true): Promise<string> {
  if (Platform.OS === 'web' || !Device.isDevice) return '';

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;
  if (requestPermission && existing.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }
  if (finalStatus !== 'granted') return '';

  const tokenData = USE_NATIVE_DEVICE_TOKEN
    ? await Notifications.getDevicePushTokenAsync()
    : await Notifications.getExpoPushTokenAsync();
  return String(tokenData.data || '');
}

export function usePushNotifications() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    async function register() {
      try {
        if (!isAuthenticated) return;
        const token = await getDevicePushToken(true);

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

  useEffect(() => {
    const refreshClientData = () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['my-application-history'] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    };
    const received = Notifications.addNotificationReceivedListener(refreshClientData);
    const opened = Notifications.addNotificationResponseReceivedListener(refreshClientData);
    return () => {
      received.remove();
      opened.remove();
    };
  }, [queryClient]);
}
