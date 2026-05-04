import { API_BASE_URL } from '../constants/config';

const API_ROOT = API_BASE_URL.replace('/api/v1', '');

export function getMediaUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_ROOT}${url}`;
}