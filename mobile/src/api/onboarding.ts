import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { getApiEndpointConfig } from '../utils/apiProxySettings';
import { ApplicantQuestionnaire, OnboardingSubmissionStatus, UniversityChoiceDraft } from '../types/api';

const SUBMISSION_KEY = 'students_life_onboarding_submission';

export type StoredOnboardingSubmission = {
  public_id: string;
  access_token: string;
  kind?: 'applicant' | 'school_student';
};

export type OnboardingSubmissionPayload = {
  kind: 'applicant' | 'school_student';
  stage: 'express' | 'full';
  academic_year: number;
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string | null;
  citizenship?: string;
  payload: Partial<ApplicantQuestionnaire>;
  fcm_token?: string;
  university_choices?: Array<{ university_id: number; program_ids: number[] }>;
};

async function request<T>(path: string, init: RequestInit = {}) {
  const endpoint = await getApiEndpointConfig();
  const response = await fetch(`${endpoint.managerSlApiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(typeof data.detail === 'string' ? data.detail : 'Не удалось отправить анкету.');
    (error as any).response = { status: response.status, data };
    throw error;
  }
  return data as T;
}

export const onboardingApi = {
  async submit(payload: OnboardingSubmissionPayload) {
    const data = await request<OnboardingSubmissionStatus & { access_token: string }>('/onboarding/submissions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await onboardingSubmissionStorage.set({ public_id: data.public_id, access_token: data.access_token, kind: payload.kind });
    return data;
  },

  async resubmit(stored: StoredOnboardingSubmission, payload: OnboardingSubmissionPayload) {
    return request<OnboardingSubmissionStatus>(`/onboarding/submissions/${stored.public_id}/`, {
      method: 'PUT',
      headers: { 'X-Onboarding-Token': stored.access_token },
      body: JSON.stringify(payload),
    });
  },

  async getStatus(stored: StoredOnboardingSubmission) {
    return request<OnboardingSubmissionStatus>(`/onboarding/submissions/${stored.public_id}/`, {
      headers: { 'X-Onboarding-Token': stored.access_token },
    });
  },
};

export const onboardingSubmissionStorage = {
  async get(): Promise<StoredOnboardingSubmission | null> {
    const raw = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(SUBMISSION_KEY)
      : await SecureStore.getItemAsync(SUBMISSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredOnboardingSubmission;
    } catch {
      await this.clear();
      return null;
    }
  },

  async set(value: StoredOnboardingSubmission) {
    const raw = JSON.stringify(value);
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(SUBMISSION_KEY, raw);
      return;
    }
    await SecureStore.setItemAsync(SUBMISSION_KEY, raw);
  },

  async clear() {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(SUBMISSION_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(SUBMISSION_KEY);
  },
};

export function buildOnboardingPayload(form: Partial<ApplicantQuestionnaire>): OnboardingSubmissionPayload {
  const academicYear = Number(form.academic_year);
  const choices = (form.university_choices || []) as UniversityChoiceDraft[];
  return {
    kind: form.form_type === 'school_student' ? 'school_student' : 'applicant',
    stage: 'full',
    academic_year: academicYear,
    full_name: String(form.full_name || '').trim(),
    phone: String(form.phone || '').trim(),
    email: String(form.email || '').trim(),
    date_of_birth: form.birth_date || null,
    citizenship: String(form.citizenship || '').trim(),
    payload: {
      ...form,
      university_choices: undefined,
      family_members: undefined,
      academic_year: undefined,
      attachments: undefined,
      generated_document_url: undefined,
      document_file: undefined,
    },
    university_choices: form.form_type === 'school_student'
      ? []
      : choices.map(choice => ({
          university_id: choice.university_id,
          program_ids: choice.program_ids,
        })),
  };
}

export function buildExpressOnboardingPayload(input: {
  kind: 'applicant' | 'school_student';
  academicYear: number;
  fullName: string;
  phone: string;
  email: string;
  requestedServices: string[];
  requestText: string;
  fcmToken?: string;
}): OnboardingSubmissionPayload {
  return {
    kind: input.kind,
    stage: 'express',
    academic_year: input.academicYear,
    full_name: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim().toLowerCase(),
    payload: {
      requested_services: input.requestedServices,
      request_text: input.requestText.trim(),
    } as Partial<ApplicantQuestionnaire>,
    fcm_token: input.fcmToken,
    university_choices: [],
  };
}
