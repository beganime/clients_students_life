import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApplicantQuestionnaire } from '../types/api';

const QUESTIONNAIRE_DRAFT_KEY = 'STUDENTS_LIFE_OFFLINE_QUESTIONNAIRE_DRAFT';

function questionnaireDraftKey(ownerId?: string | number | null) {
  const owner = String(ownerId || 'guest').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '_');
  return `${QUESTIONNAIRE_DRAFT_KEY}:${owner || 'guest'}`;
}

export type OfflineQuestionnaireDraft = {
  form: Partial<ApplicantQuestionnaire>;
  updated_at?: string | null;
  saved_at: string;
};

export async function loadOfflineQuestionnaireDraft(ownerId?: string | number | null) {
  const key = questionnaireDraftKey(ownerId);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as OfflineQuestionnaireDraft;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function saveOfflineQuestionnaireDraft(form: Partial<ApplicantQuestionnaire>, ownerId?: string | number | null) {
  const draft: OfflineQuestionnaireDraft = {
    form,
    updated_at: form.updated_at,
    saved_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(questionnaireDraftKey(ownerId), JSON.stringify(draft));
  return draft;
}

export async function clearOfflineQuestionnaireDraft(ownerId?: string | number | null) {
  await AsyncStorage.removeItem(questionnaireDraftKey(ownerId));
}
