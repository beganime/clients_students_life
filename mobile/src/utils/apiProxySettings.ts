import {
  API_BASE_URL,
  MANAGER_SL_API_BASE_URL,
} from '../constants/config';

export type ApiEndpointMode = 'proxy';

export type ApiEndpointConfig = {
  mode: ApiEndpointMode;
  studentLifeApiUrl: string;
  managerSlApiUrl: string;
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
  return {
    mode: 'proxy',
    studentLifeApiUrl: cleanBaseUrl(API_BASE_URL),
    managerSlApiUrl: cleanBaseUrl(MANAGER_SL_API_BASE_URL),
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
