export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Service = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  description_markdown?: string;
  icon?: string | null;
  cover_image?: string | null;
  required_documents?: string;
  estimated_time?: string;
  button_text?: string;
};

export type Country = {
  id: number;
  name: string;
  slug: string;
  flag?: string | null;
  cover_image?: string | null;
  short_description?: string;
  description_markdown?: string;
  cities_count?: number;
  universities_count?: number;
  visa_info?: string;
  work_info?: string;
  average_tuition?: string;
  average_living_cost?: string;
};

export type City = {
  id: number;
  country: number;
  country_name: string;
  country_slug: string;
  name: string;
  slug: string;
  image?: string | null;
  cover_image?: string | null;
  description_markdown?: string;
  universities_count?: number;
};

export type Program = {
  id: number;
  university: number;
  university_name?: string;
  country_name?: string;
  city_name?: string;
  title: string;
  level: string;
  faculty?: string;
  specialty?: string;
  language?: string;
  duration?: string;
  tuition_fee?: string | null;
  currency?: string;
  application_deadline?: string;
  start_date?: string;
  description_markdown?: string;
  intakes?: Array<Record<string, any>>;
  fees?: Array<Record<string, any>>;
  university_logo?: string | null;
  university_cover?: string | null;
  required_documents?: string;
  requirements?: string;
};

export type University = {
  id: number;
  name: string;
  slug: string;
  country?: number | null;
  country_name?: string;
  country_slug?: string;
  city?: number | null;
  city_name?: string;
  city_slug?: string;
  logo?: string | null;
  cover_image?: string | null;
  description_markdown?: string;
  university_type?: string;
  partner_status?: boolean;
  recognized_status?: boolean;
  official_website?: string;
  languages?: string;
  education_levels?: string;
  has_dormitory?: boolean;
  dormitory_cost?: string;
  scholarship_available?: boolean;
  tuition_from?: string;
  application_deadline?: string;
  required_documents?: string;
  admission_requirements?: string;
  invitation_info?: string;
  dormitory_info?: string;
  expenses_info?: string;
  public_contacts?: string;
  contacts?: string;
  contact_people?: unknown[];
  programs_count?: number;
  programs?: Program[];
  is_favorite?: boolean;
};

export type NewsPost = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  content_markdown?: string;
  cover_image?: string | null;
  category_title?: string;
  author_name?: string;
  author_avatar?: string | null;
  is_important?: boolean;
  published_at?: string;
};

export type KnowledgeArticle = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  content_markdown?: string;
  cover_image?: string | null;
  category_title?: string;
  author_name?: string;
  author_avatar?: string | null;
  tags?: string;
  published_at?: string;
};

export type StaffProfile = {
  id: number;
  full_name: string;
  position?: string;
  avatar?: string | null;
  bio?: string;
  languages?: string;
  specialization?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  show_contacts?: boolean;
};

export type Application = {
  id: number;
  application_number: string;
  service?: number | null;
  service_title?: string;
  status: string;
  manager_sl_application_id?: string;
  manager_sl_sync_status?: 'pending' | 'synced' | 'failed';
  manager_sl_sync_error?: string;
  assigned_manager_name?: string;
  full_name: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  email?: string;
  country?: string;
  city?: string;
  target_country?: number | null;
  target_country_name?: string;
  target_city?: number | null;
  target_city_name?: string;
  target_university?: number | null;
  target_university_name?: string;
  target_program?: number | null;
  target_program_title?: string;
  comment?: string;
  created_at: string;
  updated_at?: string;
};

export type ApplicationFile = {
  id: number;
  application: number;
  file: string;
  file_type: string;
  original_name: string;
  created_at: string;
};

export type ChatRoom = {
  id: number;
  user?: number;
  user_name?: string;
  user_email?: string;
  user_activity?: UserActivity | null;
  application?: number | null;
  application_number?: string;
  status: string;
  assigned_manager?: StaffProfile | null;
  last_message?: ChatMessage | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
};

export type MyDocumentStatus = 'not_uploaded' | 'pending' | 'approved' | 'rejected';

export type MyDocument = {
  id: number;
  document_id?: number | null;
  title: string;
  description?: string;
  is_required: boolean;
  status: MyDocumentStatus;
  file?: string | null;
  original_name?: string;
  admin_comment?: string;
  uploaded_at?: string | null;
  reviewed_at?: string | null;
  updated_at?: string | null;
};

export type ChatAttachment = {
  id: number;
  url?: string | null;
  original_name?: string;
  content_type?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  created_at: string;
};

export type ChatMessage = {
  id: number;
  room: number;
  sender_user?: number | null;
  sender_user_name?: string;
  sender_staff?: StaffProfile | null;
  sender_role?: 'user' | 'manager';
  sender_display_name?: string;
  message_type: 'text' | 'image' | 'file';
  text?: string;
  file?: string | null;
  attachments?: ChatAttachment[];
  is_mine?: boolean;
  is_read: boolean;
  created_at: string;
};

export type UserProfile = {
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  country?: string;
  city?: string;
  citizenship?: string;
  avatar?: string | null;
  language?: string;
};

export type UserActivity = {
  is_online: boolean;
  last_seen?: string | null;
  last_active_at?: string | null;
  device_platform?: string;
  app_version?: string;
  updated_at?: string;
};

export type UserMe = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'manager';
  is_manager: boolean;
  profile?: UserProfile;
  activity?: UserActivity | null;
};

export type FavoriteUniversity = {
  id: number;
  university: number;
  university_detail: University;
  created_at: string;
};

export type UserNotification = {
  id: number;
  title: string;
  body: string;
  notification_type?: string;
  related_object_type?: string;
  related_object_id?: number | null;
  is_read: boolean;
  created_at: string;
};

export type QuestionnaireAttachment = {
  id: number;
  file?: string | null;
  original_name?: string;
  file_type?: string;
  created_at: string;
};

export type ApplicantQuestionnaire = {
  id: number;
  status: 'draft' | 'submitted' | 'updated';
  full_name?: string;
  birth_date?: string | null;
  gender?: 'male' | 'female' | '';
  citizenship?: string;
  marital_status?: string;
  face_photo?: string | null;
  residence_country?: string;
  residence_region?: string;
  residence_city?: string;
  residence_street?: string;
  residence_house?: string;
  residence_postal_code?: string;
  passport_number?: string;
  passport_issued_by?: string;
  passport_issue_date?: string | null;
  passport_expiry_date?: string | null;
  phone?: string;
  email?: string;
  extra_phone?: string;
  imo?: string;
  telegram?: string;
  preferred_contact_method?: string;
  parent_full_name?: string;
  parent_relation?: string;
  parent_contacts?: string;
  parent_workplace?: string;
  family_members?: string;
  education_level?: string;
  school_class?: string;
  school_name?: string;
  school_country?: string;
  school_city?: string;
  graduation_year?: string;
  education_status?: string;
  achievements?: string[];
  languages?: Array<{ language: string; level: string }>;
  desired_program?: string;
  admission_goal?: string;
  desired_city?: string;
  desired_country?: string;
  desired_language?: string;
  desired_education_level?: string;
  admission_urgency?: string;
  help_needed?: string[];
  has_visa?: string;
  visa_country?: string;
  visa_city?: string;
  visa_valid_until?: string | null;
  has_international_passport?: string;
  hobbies?: string;
  applicant_comment?: string;
  referral_source?: string;
  data_processing_consent?: boolean;
  submitted_at?: string | null;
  attachments?: QuestionnaireAttachment[];
  generated_document_url?: string;
  updated_at?: string;
};

export type HomeBanner = {
  id: number;
  slot: 'hero' | 'news';
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  image?: string | null;
  cta_text?: string;
  cta_type:
    | 'none'
    | 'url'
    | 'application'
    | 'universities'
    | 'news'
    | 'service'
    | 'university';
  cta_url?: string;
  linked_news_slug?: string;
  linked_service_slug?: string;
  linked_university_slug?: string;
  background_gradient?: string;
  is_dark?: boolean;
  sort_order?: number;
};

export type OfficeContact = {
  id: number;
  country?: string;
  city: string;
  office_name?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  email?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
  map_url?: string;
  work_hours?: string;
  note?: string;
  sort_order?: number;
};

export type HomeContent = {
  hero_banners: HomeBanner[];
  news_banners: HomeBanner[];
  contacts: OfficeContact[];
  socials: {
    instagram?: string;
    tiktok?: string;
    telegram?: string;
    website?: string;
    main_email?: string;
    partners_email?: string;
    universities_email?: string;
  };
};
