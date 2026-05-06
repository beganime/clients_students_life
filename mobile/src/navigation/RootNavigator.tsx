import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Loading } from '../components/Loading';
import { useAuthStore } from '../store/authStore';

import { ApplicationCreateScreen } from '../features/applications/ApplicationCreateScreen';
import { MyApplicationsScreen } from '../features/applications/MyApplicationsScreen';
import { ChatRoomScreen } from '../features/chat/ChatRoomScreen';
import { KnowledgeDetailScreen } from '../features/knowledge/KnowledgeDetailScreen';
import { KnowledgeListScreen } from '../features/knowledge/KnowledgeListScreen';
import { NewsDetailScreen } from '../features/news/NewsDetailScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { EditProfileScreen } from '../features/profile/EditProfileScreen';
import { ServiceDetailScreen } from '../features/services/ServiceDetailScreen';
import { StaffScreen } from '../features/staff/StaffScreen';
import { FavoriteUniversitiesScreen } from '../features/universities/FavoriteUniversitiesScreen';
import { UniversityDetailScreen } from '../features/universities/UniversityDetailScreen';

import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { bootstrap, isLoading } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="App">
        <Stack.Screen
          name="App"
          component={AppNavigator}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ServiceDetail"
          component={ServiceDetailScreen}
          options={{ title: 'Услуга' }}
        />

        <Stack.Screen
          name="UniversityDetail"
          component={UniversityDetailScreen}
          options={{ title: 'Университет' }}
        />

        <Stack.Screen
          name="NewsDetail"
          component={NewsDetailScreen}
          options={{ title: 'Новость' }}
        />

        <Stack.Screen
          name="KnowledgeList"
          component={KnowledgeListScreen}
          options={{ title: 'База знаний' }}
        />

        <Stack.Screen
          name="KnowledgeDetail"
          component={KnowledgeDetailScreen}
          options={{ title: 'Материал' }}
        />

        <Stack.Screen
          name="Staff"
          component={StaffScreen}
          options={{ title: 'Команда' }}
        />

        <Stack.Screen
          name="ApplicationCreate"
          component={ApplicationCreateScreen}
          options={{ title: 'Подать заявку' }}
        />

        <Stack.Screen
          name="MyApplications"
          component={MyApplicationsScreen}
          options={{ title: 'Мои заявки' }}
        />

        <Stack.Screen
          name="FavoriteUniversities"
          component={FavoriteUniversitiesScreen}
          options={{ title: 'Избранные вузы' }}
        />

        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ title: 'Уведомления' }}
        />

        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ title: 'Редактировать профиль' }}
        />

        <Stack.Screen
          name="ChatRoom"
          component={ChatRoomScreen}
          options={{ title: 'Чат' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}