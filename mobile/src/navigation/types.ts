export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Services: undefined;
  Universities: undefined;
  ApplicationCreate: undefined;
  News: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  App: undefined;
  ServiceDetail: { slug: string };
  UniversityDetail: { slug: string };
  NewsDetail: { slug: string };
  KnowledgeList: undefined;
  KnowledgeDetail: { slug: string };
  Staff: undefined;
  MyApplications: undefined;
  FavoriteUniversities: undefined;
  Notifications: undefined;
  ChatRoom: { id: number };
  ApplicationCreate: undefined;
  EditProfile: undefined;
};