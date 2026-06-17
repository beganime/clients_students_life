import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ApplicationCreateScreen } from '../features/applications/ApplicationCreateScreen';
import { ChatListScreen } from '../features/chat/ChatListScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { NewsListScreen } from '../features/news/NewsListScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { ServicesScreen } from '../features/services/ServicesScreen';
import { UniversitiesScreen } from '../features/universities/UniversitiesScreen';
import { colors, shadows } from '../constants/colors';
import { SvgIcon, SvgIconName } from '../components/SvgIcon';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function tabIcon(name: SvgIconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <SvgIcon name={name} size={focused ? 25 : 22} color={color} strokeWidth={focused ? 2.7 : 2.1} />
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedLight,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          marginTop: 1,
        },
        tabBarItemStyle: {
          borderRadius: 18,
        },
        tabBarStyle: {
          height: 78,
          paddingBottom: 10,
          paddingTop: 8,
          paddingHorizontal: 6,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: 'rgba(255,255,255,0.97)',
          ...shadows.soft,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Главная', tabBarIcon: tabIcon('home') }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ title: 'Услуги', tabBarIcon: tabIcon('services') }} />
      <Tab.Screen name="Universities" component={UniversitiesScreen} options={{ title: 'Вузы', tabBarIcon: tabIcon('university') }} />
      <Tab.Screen name="ApplicationCreate" component={ApplicationCreateScreen} options={{ title: 'Заявка', tabBarIcon: tabIcon('application') }} />
      <Tab.Screen name="News" component={NewsListScreen} options={{ title: 'Новости', tabBarIcon: tabIcon('news') }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ title: 'Чат', tabBarIcon: tabIcon('chat') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль', tabBarIcon: tabIcon('profile') }} />
    </Tab.Navigator>
  );
}
