import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  API_BASE_URL,
  MANAGER_SL_API_BASE_URL,
  ORIGINAL_MANAGER_SL_API_URL,
  ORIGINAL_STUDENT_LIFE_API_URL,
  PROXY_MANAGER_SL_API_URL,
  PROXY_STUDENT_LIFE_API_URL,
} from '../constants/config';

const API_ENDPOINT_MODE_KEY = 'STUDENTS_LIFE_API_ENDPOINT_MODE';

export type ApiEndpointMode = 'proxy' | 'original';

export type ApiEndpointConfig = {
  mode: ApiEndpointMode;
  studentLifeApiUrl: string;
  managerSlApiUrl: string;
  studentLifeRootUrl: string;
  managerSlRootUrl: string;
};

let cachedMode: ApiEndpointMode | null = null;

function cleanBaseUrl(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function rootFromApiUrl(value: string) {
  return cleanBaseUrl(value)
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/api\/client\/v1\/?$/, '');
}

function normalizeMode(value?: string | null): ApiEndpointMode {
  return value === 'original' ? 'original' : 'proxy';
}

function configForMode(mode: ApiEndpointMode): ApiEndpointConfig {
  const studentLifeApiUrl = mode === 'original' ? ORIGINAL_STUDENT_LIFE_API_URL : PROXY_STUDENT_LIFE_API_URL;
  const managerSlApiUrl = mode === 'original' ? ORIGINAL_MANAGER_SL_API_URL : PROXY_MANAGER_SL_API_URL;

  return {
    mode,
    studentLifeApiUrl: cleanBaseUrl(studentLifeApiUrl || API_BASE_URL),
    managerSlApiUrl: cleanBaseUrl(managerSlApiUrl || MANAGER_SL_API_BASE_URL),
    studentLifeRootUrl: rootFromApiUrl(studentLifeApiUrl || API_BASE_URL),
    managerSlRootUrl: rootFromApiUrl(managerSlApiUrl || MANAGER_SL_API_BASE_URL),
  };
}

export async function getApiEndpointMode(): Promise<ApiEndpointMode> {
  if (cachedMode) return cachedMode;
  try {
    cachedMode = normalizeMode(await AsyncStorage.getItem(API_ENDPOINT_MODE_KEY));
  } catch {
    cachedMode = 'proxy';
  }
  return cachedMode;
}

export async function setApiEndpointMode(mode: ApiEndpointMode) {
  cachedMode = mode;
  await AsyncStorage.setItem(API_ENDPOINT_MODE_KEY, mode);
}

export async function getApiEndpointConfig() {
  return configForMode(await getApiEndpointMode());
}

export function getApiEndpointConfigSync() {
  return configForMode(cachedMode || 'proxy');
}

export const API_ENDPOINT_OPTIONS: Array<{
  mode: ApiEndpointMode;
  title: string;
  description: string;
}> = [
  {
    mode: 'proxy',
    title: 'Прокси students-life.ru',
    description: 'https://students-life.ru/api1/ и /api2/ — основной режим без VPN.',
  },
  {
    mode: 'original',
    title: 'Оригинальные серверы',
    description: 'https://manager-sl.ru/ и https://stud-life.com/ — использовать напрямую.',
  },
];
