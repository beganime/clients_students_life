import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../features/home/HomeScreen';
import { NewsListScreen } from '../features/news/NewsListScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { ServicesScreen } from '../features/services/ServicesScreen';
import { UniversitiesScreen } from '../features/universities/UniversitiesScreen';
import { colors } from '../constants/colors';
import { SvgIcon, SvgIconName } from '../components/SvgIcon';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function tabIcon(name: SvgIconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <SvgIcon name={name} size={focused ? 25 : 23} color={color} strokeWidth={focused ? 2.5 : 2} />
  );
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
          marginTop: 2,
        },
        tabBarStyle: {
          height: 74,
          paddingBottom: 10,
          paddingTop: 9,
          paddingHorizontal: 8,
          borderTopWidth: 1,
          borderTopColor: 'rgba(234,236,240,0.9)',
          backgroundColor: 'rgba(255,255,255,0.96)',
          shadowColor: '#101828',
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -8 },
          elevation: 12,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Главная',
          tabBarIcon: tabIcon('home'),
        }}
      />

      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{
          title: 'Услуги',
          tabBarIcon: tabIcon('services'),
        }}
      />

      <Tab.Screen
        name="Universities"
        component={UniversitiesScreen}
        options={{
          title: 'Вузы',
          tabBarIcon: tabIcon('university'),
        }}
      />

      <Tab.Screen
        name="News"
        component={NewsListScreen}
        options={{
          title: 'Новости',
          tabBarIcon: tabIcon('news'),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Профиль',
          tabBarIcon: tabIcon('profile'),
        }}
      />
    </Tab.Navigator>
  );
}