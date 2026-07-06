import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Loading } from '../components/Loading';
import { useAuthStore } from '../store/authStore';

import { ManagerLoginScreen } from '../features/auth/ManagerLoginScreen';
import { ApplicationCreateScreen } from '../features/applications/ApplicationCreateScreen';
import { MyApplicationsScreen } from '../features/applications/MyApplicationsScreen';
import { ChatListScreen } from '../features/chat/ChatListScreen';
import { ChatRoomScreen } from '../features/chat/ChatRoomScreen';
import { AdmissionInfoScreen, ToursInfoScreen, VisaInfoScreen } from '../features/info/InfoScreens';
import { MyDocumentsScreen } from '../features/documents/MyDocumentsScreen';
import { KnowledgeDetailScreen } from '../features/knowledge/KnowledgeDetailScreen';
import { KnowledgeListScreen } from '../features/knowledge/KnowledgeListScreen';
import { NewsDetailScreen } from '../features/news/NewsDetailScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { EditProfileScreen } from '../features/profile/EditProfileScreen';
import { ApplicantQuestionnaireScreen, DataConsentScreen } from '../features/questionnaire';
import { ServiceDetailScreen } from '../features/services/ServiceDetailScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { StaffScreen } from '../features/staff/StaffScreen';
import { CityDetailScreen } from '../features/universities/CityDetailScreen';
import { CountryDetailScreen } from '../features/universities/CountryDetailScreen';
import { FavoriteUniversitiesScreen } from '../features/universities/FavoriteUniversitiesScreen';
import { ProgramDetailScreen } from '../features/universities/ProgramDetailScreen';
import { UniversityDetailScreen } from '../features/universities/UniversityDetailScreen';
import { UniversityRankingsScreen } from '../features/universities/UniversityRankingsScreen';

import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const UNIVERSITY_RANKINGS_ROUTE = 'UniversityRankings' as const;

export function RootNavigator() {
  const { bootstrap, isLoading } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (isLoading) return <Loading />;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="App">
        <Stack.Screen name="App" component={AppNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: 'Услуга' }} />
        <Stack.Screen name="CountryDetail" component={CountryDetailScreen} options={{ title: 'Страна' }} />
        <Stack.Screen name="CityDetail" component={CityDetailScreen} options={{ title: 'Город' }} />
        <Stack.Screen name="UniversityDetail" component={UniversityDetailScreen} options={{ title: 'Университет' }} />
        <Stack.Screen name={UNIVERSITY_RANKINGS_ROUTE} component={UniversityRankingsScreen} options={{ title: 'Вузы 2026–2027' }} />
        <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ title: 'Программа' }} />
        <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: 'Новость' }} />
        <Stack.Screen name="KnowledgeList" component={KnowledgeListScreen} options={{ title: 'База знаний' }} />
        <Stack.Screen name="KnowledgeDetail" component={KnowledgeDetailScreen} options={{ title: 'Материал' }} />
        <Stack.Screen name="Staff" component={StaffScreen} options={{ title: 'Команда' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
        <Stack.Screen name="ManagerLogin" component={ManagerLoginScreen} options={{ title: 'Вход менеджера' }} />
        <Stack.Screen name="VisaInfo" component={VisaInfoScreen} options={{ title: 'Виза' }} />
        <Stack.Screen name="ToursInfo" component={ToursInfoScreen} options={{ title: 'Туры' }} />
        <Stack.Screen name="AdmissionInfo" component={AdmissionInfoScreen} options={{ title: 'Поступление' }} />
        <Stack.Screen name="ApplicationCreate" component={ApplicationCreateScreen} options={{ title: 'Подать заявку' }} />
        <Stack.Screen name="Chat" component={ChatListScreen} options={{ title: 'Чат с менеджером' }} />
        <Stack.Screen name="MyApplications" component={MyApplicationsScreen} options={{ title: 'Мои заявки' }} />
        <Stack.Screen name="MyDocuments" component={MyDocumentsScreen} options={{ title: 'Мои документы' }} />
        <Stack.Screen name="ApplicantQuestionnaire" component={ApplicantQuestionnaireScreen} options={{ title: 'Анкета абитуриента' }} />
        <Stack.Screen name="DataConsent" component={DataConsentScreen} options={{ title: 'Согласие на данные' }} />
        <Stack.Screen name="FavoriteUniversities" component={FavoriteUniversitiesScreen} options={{ title: 'Избранные вузы' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Уведомления' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Редактировать профиль' }} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: 'Чат' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
