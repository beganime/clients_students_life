import { apiClient, tokenStorage, uploadFormData } from './client';
import {
  Application,
  ApplicationFile,
  ChatMessage,
  ChatRoom,
  City,
  ClientExam,
  Country,
  FavoriteUniversity,
  HomeContent,
  KnowledgeArticle,
  MyDocument,
  NewsPost,
  PaginatedResponse,
  Program,
  ApplicantQuestionnaire,
  QuestionnaireAttachment,
  Service,
  StaffProfile,
  University,
  UserMe,
  UserNotification,
} from '../types/api';

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user?: UserMe;
};

export type RegisterPayload = {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  city?: string;
  citizenship?: string;
  language?: string;
};

export type ApplicationCreatePayload = {
  service?: number | null;
  idempotency_key?: string;
  full_name: string;
  birth_date?: string;
  citizenship?: string;
  country?: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  email?: string;
  preferred_contact_method?: 'phone' | 'whatsapp' | 'telegram' | 'email';
  target_country?: number | null;
  target_country_name?: string;
  target_city?: number | null;
  target_city_name?: string;
  target_university?: number | null;
  target_university_name?: string;
  target_program?: number | null;
  target_program_title?: string;
  education_level?: string;
  specialty?: string;
  study_language?: string;
  start_year?: string;
  comment?: string;
};

export type UniversityFilters = {
  search?: string;
  country__slug?: string;
  city__slug?: string;
  has_dormitory?: boolean;
  scholarship_available?: boolean;
  partner_status?: boolean;
  recognized_status?: boolean;
};

export type UploadableFile = {
  uri: string;
  name?: string;
  type?: string;
  file?: Blob;
};

function inferFileType(file: { name?: string; type?: string }) {
  const explicit = String(file.type || '').trim();
  if (explicit && explicit !== 'application/octet-stream') return explicit;

  const name = String(file.name || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return explicit || 'application/octet-stream';
}

function normalizeUploadFileName(file: UploadableFile, fallbackPrefix = 'upload') {
  const rawName = String(file.name || '').trim() || `${fallbackPrefix}-${Date.now()}`;
  const safeName = rawName.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || `${fallbackPrefix}-${Date.now()}`;

  if (safeName.length <= 255) return safeName;

  const dotIndex = safeName.lastIndexOf('.');
  const extension = dotIndex > 0 ? safeName.slice(dotIndex) : '';
  const maxBaseLength = Math.max(1, 255 - extension.length);
  return `${safeName.slice(0, maxBaseLength)}${extension}`;
}

export function appendUploadFile(formData: FormData, field: string, file: UploadableFile) {
  const type = inferFileType(file);
  const name = normalizeUploadFileName(file);
  const webFile = (file as any).file;

  if (typeof Blob !== 'undefined' && webFile instanceof Blob) {
    if (typeof File !== 'undefined' && webFile instanceof File) {
      formData.append(field, webFile);
      return;
    }

    if (typeof File !== 'undefined') {
      formData.append(field, new File([webFile], name, { type }));
      return;
    }

    formData.append(field, webFile as any);
    return;
  }

  formData.append(field, {
    uri: file.uri,
    name,
    type,
  } as any);
}

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<LoginResponse>('/auth/login/', payload);
    await tokenStorage.setTokens(data.access, data.refresh);
    return data;
  },

  async managerLogin(payload: LoginPayload) {
    const { data } = await apiClient.post<LoginResponse>('/accounts/staff-login/', payload);
    await tokenStorage.setTokens(data.access, data.refresh);
    return data;
  },

  async register(payload: RegisterPayload) {
    const { data } = await apiClient.post<UserMe>('/accounts/register/', payload);
    return data;
  },

  async me() {
    const { data } = await apiClient.get<UserMe>('/accounts/me/');
    return data;
  },

  async updateMe(payload: Partial<UserMe>) {
    const { data } = await apiClient.patch<UserMe>('/accounts/me/', payload);
    return data;
  },

  async updateMeFormData(formData: FormData) {
    return uploadFormData<UserMe>('/accounts/me/', formData, 'patch');
  },

  async logout() {
    const refresh = await tokenStorage.getRefreshToken();

    try {
      await apiClient.post('/accounts/activity/', { state: 'inactive', is_online: false }).catch(() => undefined);

      if (refresh) {
        await apiClient.post('/accounts/logout/', { refresh });
      }
    } finally {
      await tokenStorage.clearTokens();
    }
  },

  async updateActivity(payload: {
    state: 'active' | 'inactive' | 'background';
    is_online?: boolean;
    device_platform?: string;
    device_id?: string;
    app_version?: string;
  }) {
    const { data } = await apiClient.post('/accounts/activity/', payload);
    return data;
  },
};

export const commonApi = {
  async getHomeContent() {
    const { data } = await apiClient.get<HomeContent>('/common/home/');
    return data;
  },
};

export const contentApi = {
  async getServices() {
    const { data } = await apiClient.get<PaginatedResponse<Service>>('/services/');
    return data.results;
  },

  async toggleFavoriteUniversity(slug: string) {
    const { data } = await apiClient.post<{ is_favorite: boolean }>(`/universities/${slug}/toggle_favorite/`);
    return data;
  },

  async getFavoriteUniversities() {
    const { data } = await apiClient.get<PaginatedResponse<FavoriteUniversity>>('/universities/favorites/');
    return data.results;
  },

  async getService(slug: string) {
    const { data } = await apiClient.get<Service>(`/services/${slug}/`);
    return data;
  },

  async getCountries() {
    const { data } = await apiClient.get<PaginatedResponse<Country>>('/locations/countries/');
    return data.results;
  },

  async getCities(params?: Record<string, string | number>) {
    const { data } = await apiClient.get<PaginatedResponse<City>>('/locations/cities/', { params });
    return data.results;
  },

  async getUniversities(params?: UniversityFilters) {
    const { data } = await apiClient.get<PaginatedResponse<University>>('/universities/', { params });
    return data.results;
  },

  async getUniversity(slug: string) {
    const { data } = await apiClient.get<University>(`/universities/${slug}/`);
    return data;
  },

  async getPrograms(params?: Record<string, string | number>) {
    const { data } = await apiClient.get<PaginatedResponse<Program>>('/universities/programs/', { params });
    return data.results;
  },

  async getNews() {
    const { data } = await apiClient.get<PaginatedResponse<NewsPost>>('/news/');
    return data.results;
  },

  async getNewsPost(slug: string) {
    const { data } = await apiClient.get<NewsPost>(`/news/${slug}/`);
    return data;
  },

  async getKnowledge() {
    const { data } = await apiClient.get<PaginatedResponse<KnowledgeArticle>>('/knowledge/');
    return data.results;
  },

  async getKnowledgeArticle(slug: string) {
    const { data } = await apiClient.get<KnowledgeArticle>(`/knowledge/${slug}/`);
    return data;
  },

  async getStaff() {
    const { data } = await apiClient.get<PaginatedResponse<StaffProfile>>('/staff/');
    return data.results;
  },
};

export const applicationsApi = {
  async createApplication(payload: ApplicationCreatePayload) {
    const idempotencyKey = payload.idempotency_key;
    const { data } = await apiClient.post<Application>('/applications/', payload, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
    return data;
  },

  async getMyApplications() {
    const { data } = await apiClient.get<PaginatedResponse<Application>>('/applications/my/');
    return data.results;
  },

  async getApplication(id: number) {
    const { data } = await apiClient.get<Application>(`/applications/${id}/`);
    return data;
  },

  async uploadFile(applicationId: number, file: UploadableFile, fileType = 'other') {
    const formData = new FormData();

    formData.append('file_type', fileType);
    appendUploadFile(formData, 'file', file);

    return uploadFormData<ApplicationFile>(`/applications/${applicationId}/upload_file/`, formData);
  },
};

export const documentsApi = {
  async getMyDocuments() {
    const { data } = await apiClient.get<MyDocument[]>('/documents/my-documents/');
    return data;
  },

  async uploadMyDocument(documentTypeId: number, file: UploadableFile) {
    const formData = new FormData();
    appendUploadFile(formData, 'file', file);

    return uploadFormData<MyDocument>(`/documents/my-documents/${documentTypeId}/upload/`, formData);
  },
};

export const questionnaireApi = {
  async getMyQuestionnaire() {
    const { data } = await apiClient.get<ApplicantQuestionnaire>('/questionnaire/my-application-form/');
    return data;
  },

  async saveMyQuestionnaire(payload: Partial<ApplicantQuestionnaire> | FormData) {
    if (payload instanceof FormData) {
      return uploadFormData<ApplicantQuestionnaire>('/questionnaire/my-application-form/', payload, 'patch');
    }
    const { data } = await apiClient.patch<ApplicantQuestionnaire>('/questionnaire/my-application-form/', payload);
    return data;
  },

  async saveMyQuestionnaireDraft(payload: Partial<ApplicantQuestionnaire> | FormData) {
    if (payload instanceof FormData) {
      return uploadFormData<ApplicantQuestionnaire>('/questionnaire/my-application-form/draft/', payload, 'patch');
    }
    const { data } = await apiClient.patch<ApplicantQuestionnaire>('/questionnaire/my-application-form/draft/', payload);
    return data;
  },

  async submitMyQuestionnaire(payload: Partial<ApplicantQuestionnaire> | FormData) {
    if (payload instanceof FormData) {
      return uploadFormData<ApplicantQuestionnaire>('/questionnaire/my-application-form/submit/', payload);
    }
    const { data } = await apiClient.post<ApplicantQuestionnaire>('/questionnaire/my-application-form/submit/', payload);
    return data;
  },

  async regenerateMyQuestionnaireDocument() {
    const { data } = await apiClient.post<ApplicantQuestionnaire>('/questionnaire/my-application-form/regenerate-document/');
    return data;
  },

  async uploadAttachment(file: UploadableFile) {
    const formData = new FormData();
    appendUploadFile(formData, 'file', file);
    return uploadFormData<QuestionnaireAttachment>('/questionnaire/my/attachments/', formData);
  },
};

export const chatApi = {
  async getRooms() {
    const { data } = await apiClient.get<PaginatedResponse<ChatRoom>>('/chat/');
    return data.results;
  },

  async createRoom(application?: number | null) {
    const { data } = await apiClient.post<ChatRoom>('/chat/', { application });
    return data;
  },

  async getMessages(roomId: number) {
    const { data } = await apiClient.get<PaginatedResponse<ChatMessage>>(`/chat/${roomId}/messages/`);
    return data.results;
  },

  async sendMessage(roomId: number, text: string) {
    const { data } = await apiClient.post<ChatMessage>(`/chat/${roomId}/send_message/`, {
      text,
    });
    return data;
  },

  async sendImage(roomId: number, file: UploadableFile, text = '') {
    const formData = new FormData();
    if (text.trim()) {
      formData.append('text', text.trim());
    }
    appendUploadFile(formData, 'image', file);

    return uploadFormData<ChatMessage>(`/chat/${roomId}/send_message/`, formData);
  },

  async sendFile(roomId: number, file: UploadableFile, text = '') {
    const formData = new FormData();
    if (text.trim()) {
      formData.append('text', text.trim());
    }
    appendUploadFile(formData, 'file', file);

    return uploadFormData<ChatMessage>(`/chat/${roomId}/send_message/`, formData);
  },

  async markRead(roomId: number) {
    const { data } = await apiClient.post(`/chat/${roomId}/mark_read/`);
    return data;
  },
};

export const notificationsApi = {
  async saveDeviceToken(payload: { token: string; platform: 'ios' | 'android' | 'web' | 'unknown'; device_id?: string }) {
    const { data } = await apiClient.post('/notifications/device-tokens/', payload);
    return data;
  },

  async getMyNotifications() {
    const { data } = await apiClient.get<PaginatedResponse<UserNotification>>('/notifications/my/');
    return data.results;
  },

  async getMyExams() {
    const { data } = await apiClient.get<ClientExam[]>('/notifications/my-exams/');
    return data;
  },

  async acknowledgeExam(id: number) {
    const { data } = await apiClient.post<ClientExam>(`/notifications/my-exams/${id}/acknowledge/`);
    return data;
  },

  async markNotificationRead(id: number) {
    const { data } = await apiClient.post(`/notifications/my/${id}/mark_read/`);
    return data;
  },

  async markAllNotificationsRead() {
    const { data } = await apiClient.post('/notifications/my/mark_all_read/');
    return data;
  },
};
