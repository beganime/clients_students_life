import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
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
  ProgramDetail: { id: number | string };
  NewsDetail: { slug: string };
  KnowledgeList: undefined;
  KnowledgeDetail: { slug: string };
  Staff: undefined;

  MyApplications: undefined;
  FavoriteUniversities: undefined;
  Notifications: undefined;
  Chat: undefined;
  ChatRoom: { id: number };

  ApplicationCreate:
    | {
        serviceId?: number;
        universityId?: number;
        programId?: number;
      }
    | undefined;

  EditProfile: undefined;
};
