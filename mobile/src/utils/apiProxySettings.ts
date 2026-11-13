import {
  API_BASE_URL,
  API_FALLBACK_URL,
  MANAGER_SL_API_BASE_URL,
  MANAGER_SL_API_FALLBACK_URL,
} from '../constants/config';

export type ApiEndpointMode = 'proxy';

export type ApiEndpointConfig = {
  mode: ApiEndpointMode;
  studentLifeApiUrl: string;
  studentLifeApiUrls: string[];
  managerSlApiUrl: string;
  managerSlApiUrls: string[];
  studentLifeRootUrl: string;
  managerSlRootUrl: string;
};

function cleanBaseUrl(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function rootFromApiUrl(value: string) {
  return cleanBaseUrl(value)
    .replace(/\/api\/v1\/?$/, '')
    .replace(/\/api\/client\/v1\/?$/, '');
}

function proxyConfig(): ApiEndpointConfig {
  const studentLifeApiUrls = Array.from(new Set([API_BASE_URL, API_FALLBACK_URL].map(cleanBaseUrl)));
  const managerSlApiUrls = Array.from(new Set([MANAGER_SL_API_BASE_URL, MANAGER_SL_API_FALLBACK_URL].map(cleanBaseUrl)));
  return {
    mode: 'proxy',
    studentLifeApiUrl: studentLifeApiUrls[0],
    studentLifeApiUrls,
    managerSlApiUrl: managerSlApiUrls[0],
    managerSlApiUrls,
    studentLifeRootUrl: rootFromApiUrl(API_BASE_URL),
    managerSlRootUrl: rootFromApiUrl(MANAGER_SL_API_BASE_URL),
  };
}

export async function getApiEndpointMode(): Promise<ApiEndpointMode> {
  return 'proxy';
}

export async function setApiEndpointMode(_mode: ApiEndpointMode) {
  return;
}

export async function getApiEndpointConfig() {
  return proxyConfig();
}

export function getApiEndpointConfigSync() {
  return proxyConfig();
}
