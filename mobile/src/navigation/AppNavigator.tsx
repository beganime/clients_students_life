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

function tabLabel(label: string, icon: string) {
  return `${icon} ${label}`;
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '900',
        },
        tabBarStyle: {
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          paddingHorizontal: 6,
          borderTopWidth: 1,
          borderTopColor: 'rgba(234,236,240,0.9)',
          backgroundColor: 'rgba(255,255,255,0.94)',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: tabLabel('Главная', '🏠') }}
      />

      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{ title: tabLabel('Услуги', '✨') }}
      />

      <Tab.Screen
        name="Universities"
        component={UniversitiesScreen}
        options={{ title: tabLabel('Вузы', '🎓') }}
      />

      <Tab.Screen
        name="ApplicationCreate"
        component={ApplicationCreateScreen}
        options={{ title: tabLabel('Заявка', '📝') }}
      />

      <Tab.Screen
        name="News"
        component={NewsListScreen}
        options={{ title: tabLabel('Новости', '📰') }}
      />

      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{ title: tabLabel('Чат', '💬') }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: tabLabel('Профиль', '👤') }}
      />
    </Tab.Navigator>
  );
}