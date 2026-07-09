import { API_BASE_URL, MANAGER_SL_ROOT_URL } from '../constants/config';
import { getApiEndpointConfigSync } from './apiProxySettings';

const API_ROOT = API_BASE_URL.replace('/api/v1', '');

export function getMediaUrl(url?: string | null, rootUrl = API_ROOT) {
  if (!url) return null;
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;
  if (/^https?:\/\//i.test(cleanUrl)) return cleanUrl;
  if (cleanUrl.startsWith('//')) return `https:${cleanUrl}`;
  const endpointConfig = getApiEndpointConfigSync();
  const resolvedRoot = rootUrl === API_ROOT ? endpointConfig.studentLifeRootUrl || rootUrl : rootUrl;
  if (cleanUrl.startsWith('/')) return `${resolvedRoot}${cleanUrl}`;
  return `${resolvedRoot}/${cleanUrl}`;
}

export function getManagerMediaUrl(url?: string | null) {
  return getMediaUrl(url, getApiEndpointConfigSync().managerSlRootUrl || MANAGER_SL_ROOT_URL);
}
