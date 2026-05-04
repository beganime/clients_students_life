import { AxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Произошла ошибка. Попробуйте ещё раз.') {
  const axiosError = error as AxiosError<any>;

  if (axiosError?.response?.data) {
    const data = axiosError.response.data;

    if (typeof data === 'string') return data;
    if (data.detail) return String(data.detail);

    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const value = data[firstKey];
      if (Array.isArray(value)) return `${firstKey}: ${value.join(', ')}`;
      return `${firstKey}: ${String(value)}`;
    }
  }

  if (axiosError?.message === 'Network Error') {
    return 'Нет соединения с сервером. Проверьте интернет или API URL.';
  }

  return fallback;
}