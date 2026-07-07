import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApplicantQuestionnaire } from '../types/api';

const QUESTIONNAIRE_DRAFT_KEY = 'STUDENTS_LIFE_OFFLINE_QUESTIONNAIRE_DRAFT';

export type OfflineQuestionnaireDraft = {
  form: Partial<ApplicantQuestionnaire>;
  updated_at?: string | null;
  saved_at: string;
};

export async function loadOfflineQuestionnaireDraft() {
  const raw = await AsyncStorage.getItem(QUESTIONNAIRE_DRAFT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as OfflineQuestionnaireDraft;
  } catch {
    await AsyncStorage.removeItem(QUESTIONNAIRE_DRAFT_KEY);
    return null;
  }
}

export async function saveOfflineQuestionnaireDraft(form: Partial<ApplicantQuestionnaire>) {
  const draft: OfflineQuestionnaireDraft = {
    form,
    updated_at: form.updated_at,
    saved_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(QUESTIONNAIRE_DRAFT_KEY, JSON.stringify(draft));
  return draft;
}

export async function clearOfflineQuestionnaireDraft() {
  await AsyncStorage.removeItem(QUESTIONNAIRE_DRAFT_KEY);
}
