import { API_BASE_URL, MANAGER_SL_ROOT_URL } from '../constants/config';

const API_ROOT = API_BASE_URL.replace('/api/v1', '');

export function getMediaUrl(url?: string | null, rootUrl = API_ROOT) {
  if (!url) return null;
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;
  if (/^https?:\/\//i.test(cleanUrl)) return cleanUrl;
  if (cleanUrl.startsWith('//')) return `https:${cleanUrl}`;
  if (cleanUrl.startsWith('/')) return `${rootUrl}${cleanUrl}`;
  return `${rootUrl}/${cleanUrl}`;
}

export function getManagerMediaUrl(url?: string | null) {
  return getMediaUrl(url, MANAGER_SL_ROOT_URL);
}
