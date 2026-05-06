import Constants from 'expo-constants';

const DEFAULT_PROD_API_URL = 'http://127.0.0.1:8000/api/v1';

type ExpoExtra = {
  apiBaseUrl?: string;
};

function cleanBaseUrl(value?: string | null) {
  const url = value?.trim();
  if (!url) return null;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const expoExtra = Constants.expoConfig?.extra as ExpoExtra | undefined;

const envApiBaseUrl = cleanBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
const extraApiBaseUrl = cleanBaseUrl(expoExtra?.apiBaseUrl);

export const API_BASE_URL = envApiBaseUrl || extraApiBaseUrl || DEFAULT_PROD_API_URL;

export const APP_NAME = "Student's Life";