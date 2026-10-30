import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { notificationsApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';


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

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Students Life', importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;
  if (requestPermission && existing.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }
  if (finalStatus !== 'granted') return '';

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (Platform.OS === 'ios' && !projectId) return '';
  const tokenData = Platform.OS === 'ios'
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getDevicePushTokenAsync();
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
