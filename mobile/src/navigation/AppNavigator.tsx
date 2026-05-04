import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ServicesScreen } from '../features/services/ServicesScreen';
import { ApplicationCreateScreen } from '../features/applications/ApplicationCreateScreen';
import { ChatListScreen } from '../features/chat/ChatListScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { NewsListScreen } from '../features/news/NewsListScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { UniversitiesScreen } from '../features/universities/UniversitiesScreen';
import { colors } from '../constants/colors';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Главная' }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ title: 'Услуги' }} />
      <Tab.Screen name="Universities" component={UniversitiesScreen} options={{ title: 'Вузы' }} />
      <Tab.Screen name="ApplicationCreate" component={ApplicationCreateScreen} options={{ title: 'Заявка' }} />
      <Tab.Screen name="News" component={NewsListScreen} options={{ title: 'Новости' }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ title: 'Чат' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
    </Tab.Navigator>
  );
}