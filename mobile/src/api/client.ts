import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { API_BASE_URL } from '../constants/config';

const ACCESS_TOKEN_KEY = 'students_life_access_token';
const REFRESH_TOKEN_KEY = 'students_life_refresh_token';

const memoryStorage: Record<string, string | undefined> = {};

async function getStoredItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) || memoryStorage[key] || null;
    } catch {
      return memoryStorage[key] || null;
    }
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    memoryStorage[key] = value;

    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // localStorage may be unavailable in private mode.
    }

    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredItem(key: string) {
  if (Platform.OS === 'web') {
    delete memoryStorage[key];

    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // localStorage may be unavailable in private mode.
    }

    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  async getAccessToken() {
    return getStoredItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken() {
    return getStoredItem(REFRESH_TOKEN_KEY);
  },

  async setTokens(access: string, refresh: string) {
    await setStoredItem(ACCESS_TOKEN_KEY, access);
    await setStoredItem(REFRESH_TOKEN_KEY, refresh);
  },

  async setAccessToken(access: string) {
    await setStoredItem(ACCESS_TOKEN_KEY, access);
  },

  async clearTokens() {
    await deleteStoredItem(ACCESS_TOKEN_KEY);
    await deleteStoredItem(REFRESH_TOKEN_KEY);
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'X-Device-Platform': Platform.OS,
  },
});

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(item => {
    if (error) {
      item.reject(error);
      return;
    }

    if (token) {
      item.resolve(token);
    }
  });

  failedQueue = [];
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch(queueError => Promise.reject(queueError));
    }

    isRefreshing = true;

    try {
      const refresh = await tokenStorage.getRefreshToken();

      if (!refresh) {
        await tokenStorage.clearTokens();
        return Promise.reject(error);
      }

      const { data } = await axios.post<{ access: string; refresh?: string }>(
        `${API_BASE_URL}/auth/refresh/`,
        { refresh },
        {
          timeout: 20000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const newAccess = data.access;
      const newRefresh = data.refresh || refresh;

      await tokenStorage.setTokens(newAccess, newRefresh);
      processQueue(null, newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await tokenStorage.clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);