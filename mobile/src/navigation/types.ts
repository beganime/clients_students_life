import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: {
    slId?: string;
    password?: string;
    fromApprovedOnboarding?: boolean;
  } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Services: undefined;
  Universities: { country?: string | number; city?: string | number } | undefined;
  News: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  App: NavigatorScreenParams<MainTabParamList> | undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Onboarding: undefined;

  ServiceDetail: { slug: string };
  CountryDetail: { id: number | string };
  CityDetail: { id: number | string; countryId?: number | string };
  UniversityDetail: { id: number | string };
  UniversityRankings: undefined;
  ProgramDetail: { id: number | string };
  NewsDetail: { slug: string };
  KnowledgeList: undefined;
  KnowledgeDetail: { slug: string };
  Staff: undefined;
  Settings: undefined;
  VisaInfo: undefined;
  ToursInfo: undefined;
  AdmissionInfo: undefined;

  MyApplications: undefined;
  MyDocuments: undefined;
  ApplicantQuestionnaire: {
    formType?: 'school_student' | 'applicant';
    universityId?: number;
    programId?: number;
  } | undefined;
  ExpressApplication: {
    kind?: 'school_student' | 'applicant';
  } | undefined;
  DataConsent: undefined;
  FavoriteUniversities: undefined;
  Notifications: undefined;
  Chat: undefined;
  ChatRoom: { id: number | string };

  EditProfile: undefined;
};
