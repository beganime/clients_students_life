import Constants from 'expo-constants';

const DEFAULT_PROD_API_URL = 'https://stud-life.com/api/v1';
const DEFAULT_MANAGER_SL_API_URL = 'https://manager-sl.ru/api/client/v1';

export const OFFICIAL_SITE_URL = 'https://students-life.ru';
export const COMPANY_APPS_URL = '';

type ExpoExtra = {
  apiBaseUrl?: string;
  managerSlApiBaseUrl?: string;
};

function cleanBaseUrl(value?: string | null) {
  const url = value?.trim();
  if (!url) return null;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const expoExtra = Constants.expoConfig?.extra as ExpoExtra | undefined;

const envApiBaseUrl = cleanBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
const extraApiBaseUrl = cleanBaseUrl(expoExtra?.apiBaseUrl);
const envManagerSlApiBaseUrl = cleanBaseUrl(process.env.EXPO_PUBLIC_MANAGER_SL_API_BASE_URL);
const extraManagerSlApiBaseUrl = cleanBaseUrl(expoExtra?.managerSlApiBaseUrl);

export const API_BASE_URL = envApiBaseUrl || extraApiBaseUrl || DEFAULT_PROD_API_URL;
export const API_ROOT_URL = API_BASE_URL.replace('/api/v1', '');
export const MANAGER_SL_API_BASE_URL =
  envManagerSlApiBaseUrl || extraManagerSlApiBaseUrl || DEFAULT_MANAGER_SL_API_URL;
export const MANAGER_SL_ROOT_URL = MANAGER_SL_API_BASE_URL.replace(/\/api\/client\/v1\/?$/, '');
export const PRIVACY_POLICY_URL = `${API_ROOT_URL}/privacy-policy/`;

export const APP_NAME = "Student's Life";
export const APP_VERSION = Constants.expoConfig?.version || '1.0.3';
