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
  const baseUrl = getWebSocketBaseUrl();
  return new WebSocket(`${baseUrl}/ws/chats/${roomId}/?token=${token}`);
}