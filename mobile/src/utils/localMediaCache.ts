import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { UploadableFile } from '../api/endpoints';

const LOCAL_AVATAR_URI_KEY = 'STUDENTS_LIFE_LOCAL_AVATAR_URI';
const MEDIA_CACHE_INDEX_KEY = 'STUDENTS_LIFE_MEDIA_CACHE_INDEX';
const PENDING_DOCUMENT_UPLOADS_KEY = 'STUDENTS_LIFE_PENDING_DOCUMENT_UPLOADS';

const ROOT_DIR = `${FileSystem.documentDirectory || ''}students-life-cache/`;

type CacheNamespace = 'avatars' | 'documents' | 'catalog' | 'questionnaire' | 'chat' | 'media';

type PendingDocumentUpload = {
  documentTypeId: number;
  file: UploadableFile;
  savedAt: string;
};

function canUseFileSystem() {
  return Platform.OS !== 'web' && Boolean(FileSystem.documentDirectory);
}

function hashValue(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function getExtension(input?: string | null, mimeType?: string | null) {
  const cleanInput = String(input || '').split('?')[0].split('#')[0];
  const extensionMatch = cleanInput.match(/\.([a-zA-Z0-9]{2,5})$/);
  if (extensionMatch) return extensionMatch[1].toLowerCase();

  if (mimeType?.includes('/')) {
    const mimeExtension = mimeType.split('/').pop()?.replace('jpeg', 'jpg');
    if (mimeExtension) return mimeExtension.toLowerCase();
  }

  return 'bin';
}

async function ensureDirectory(namespace: CacheNamespace) {
  if (!canUseFileSystem()) return null;

  const namespaceDir = `${ROOT_DIR}${namespace}/`;
  await FileSystem.makeDirectoryAsync(namespaceDir, { intermediates: true }).catch(() => undefined);
  return namespaceDir;
}

async function readIndex(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(MEDIA_CACHE_INDEX_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeIndex(index: Record<string, string>) {
  await AsyncStorage.setItem(MEDIA_CACHE_INDEX_KEY, JSON.stringify(index));
}

async function rememberCachedUri(sourceUri: string, cachedUri: string) {
  if (!sourceUri || !cachedUri || sourceUri === cachedUri) return;
  const index = await readIndex();
  index[sourceUri] = cachedUri;
  await writeIndex(index);
}

export async function getCachedMediaUri(sourceUri?: string | null) {
  if (!sourceUri) return null;

  const index = await readIndex();
  const cachedUri = index[sourceUri];
  if (!cachedUri || !canUseFileSystem()) return cachedUri || sourceUri;

  const info = await FileSystem.getInfoAsync(cachedUri).catch(() => null);
  return info?.exists ? cachedUri : sourceUri;
}

export async function cacheRemoteMedia(sourceUri?: string | null, namespace: CacheNamespace = 'media') {
  if (!sourceUri) return null;
  if (!canUseFileSystem() || !/^https?:\/\//i.test(sourceUri)) return sourceUri;

  const existing = await getCachedMediaUri(sourceUri);
  if (existing && existing !== sourceUri) return existing;

  const namespaceDir = await ensureDirectory(namespace);
  if (!namespaceDir) return sourceUri;

  const extension = getExtension(sourceUri);
  const destination = `${namespaceDir}${hashValue(sourceUri)}.${extension}`;
  const info = await FileSystem.getInfoAsync(destination).catch(() => null);

  if (!info?.exists) {
    await FileSystem.downloadAsync(sourceUri, destination);
  }

  await rememberCachedUri(sourceUri, destination);
  return destination;
}

export async function cacheRemoteMediaBatch(sourceUris: Array<string | null | undefined>, namespace: CacheNamespace = 'media') {
  const uniqueUris = Array.from(new Set(sourceUris.filter(Boolean) as string[]));
  const chunks: string[][] = [];

  for (let index = 0; index < uniqueUris.length; index += 8) {
    chunks.push(uniqueUris.slice(index, index + 8));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map(uri => cacheRemoteMedia(uri, namespace).catch(() => undefined)));
  }
}

export async function cacheLocalUploadFile(file: UploadableFile, namespace: CacheNamespace = 'documents') {
  if (!file.uri || !canUseFileSystem()) return file;

  const namespaceDir = await ensureDirectory(namespace);
  if (!namespaceDir) return file;

  const extension = getExtension(file.name || file.uri, file.type);
  const nameHash = hashValue(`${file.uri}-${file.name || ''}-${Date.now()}`);
  const destination = `${namespaceDir}${nameHash}.${extension}`;

  try {
    await FileSystem.copyAsync({ from: file.uri, to: destination });
    await rememberCachedUri(file.uri, destination);
    return { ...file, uri: destination };
  } catch {
    return file;
  }
}

export async function saveLocalAvatarUri(uri: string) {
  if (!uri) return;
  await AsyncStorage.setItem(LOCAL_AVATAR_URI_KEY, uri);
}

export async function saveLocalAvatarFile(file: UploadableFile) {
  const cachedFile = await cacheLocalUploadFile(file, 'avatars');
  await saveLocalAvatarUri(cachedFile.uri);
  return cachedFile;
}

export async function getLocalAvatarUri() {
  return AsyncStorage.getItem(LOCAL_AVATAR_URI_KEY);
}

export async function clearLocalAvatarUri() {
  await AsyncStorage.removeItem(LOCAL_AVATAR_URI_KEY);
}

export async function savePendingDocumentUpload(documentTypeId: number, file: UploadableFile) {
  const cachedFile = await cacheLocalUploadFile(file, 'documents');
  const pending = await getPendingDocumentUploads();
  pending[documentTypeId] = {
    documentTypeId,
    file: cachedFile,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(PENDING_DOCUMENT_UPLOADS_KEY, JSON.stringify(pending));
  return cachedFile;
}

export async function getPendingDocumentUploads() {
  try {
    const raw = await AsyncStorage.getItem(PENDING_DOCUMENT_UPLOADS_KEY);
    return raw ? (JSON.parse(raw) as Record<number, PendingDocumentUpload>) : {};
  } catch {
    return {};
  }
}

export async function removePendingDocumentUpload(documentTypeId: number) {
  const pending = await getPendingDocumentUploads();
  delete pending[documentTypeId];
  await AsyncStorage.setItem(PENDING_DOCUMENT_UPLOADS_KEY, JSON.stringify(pending));
}
