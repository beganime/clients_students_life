import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'STUDENTS_LIFE_UNIVERSITIES_V1';

type Snapshot<T> = { savedAt: number; items: T[] };

export async function readOfflineUniversities<T>(): Promise<Snapshot<T> | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const snapshot = JSON.parse(value) as Snapshot<T>;
    return Number.isFinite(snapshot.savedAt) && Array.isArray(snapshot.items) ? snapshot : null;
  } catch {
    return null;
  }
}

export async function saveOfflineUniversities<T>(items: T[], updatedAt: number): Promise<void> {
  if (!items.length) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: updatedAt, items }));
}
