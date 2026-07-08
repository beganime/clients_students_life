import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_AVATAR_URI_KEY = 'STUDENTS_LIFE_LOCAL_AVATAR_URI';

export async function saveLocalAvatarUri(uri: string) {
  if (!uri) return;
  await AsyncStorage.setItem(LOCAL_AVATAR_URI_KEY, uri);
}

export async function getLocalAvatarUri() {
  return AsyncStorage.getItem(LOCAL_AVATAR_URI_KEY);
}

export async function clearLocalAvatarUri() {
  await AsyncStorage.removeItem(LOCAL_AVATAR_URI_KEY);
}
