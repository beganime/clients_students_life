import { apiClient, tokenStorage } from './client';
import {
  Application,
  ApplicationFile,
  ChatMessage,
  ChatRoom,
  City,
  Country,
  FavoriteUniversity,
  HomeContent,
  KnowledgeArticle,
  NewsPost,
  PaginatedResponse,
  Program,
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

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<LoginResponse>('/auth/login/', payload);
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
    const { data } = await apiClient.patch<UserMe>('/accounts/me/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
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

  async uploadFile(applicationId: number, file: { uri: string; name: string; type: string }, fileType = 'other') {
    const formData = new FormData();

    formData.append('file_type', fileType);
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const { data } = await apiClient.post<ApplicationFile>(
      `/applications/${applicationId}/upload_file/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return data;
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
      message_type: 'text',
      text,
    });
    return data;
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

  async markNotificationRead(id: number) {
    const { data } = await apiClient.post(`/notifications/my/${id}/mark_read/`);
    return data;
  },

  async markAllNotificationsRead() {
    const { data } = await apiClient.post('/notifications/my/mark_all_read/');
    return data;
  },
};
