import { API_BASE_URL } from '../constants/config';
import { tokenStorage } from './client';

function getWebSocketBaseUrl() {
  return API_BASE_URL
    .replace('/api/v1', '')
    .replace('http://', 'ws://')
    .replace('https://', 'wss://');
}

export async function createChatSocket(roomId: number) {
  const token = await tokenStorage.getAccessToken();

  if (!token) {
    throw new Error('Access token is missing. User must be authenticated before opening chat socket.');
  }

  const baseUrl = getWebSocketBaseUrl();
  const encodedToken = encodeURIComponent(token);

  return new WebSocket(`${baseUrl}/ws/chats/${roomId}/?token=${encodedToken}`);
}