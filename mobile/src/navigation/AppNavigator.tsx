import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SideMenu } from '../components/SideMenu';
import { SvgIcon, SvgIconName } from '../components/SvgIcon';
import { BrandLogo } from '../components/BrandLogo';
import { colors, shadows, spacing } from '../constants/colors';
import { HomeScreen } from '../features/home/HomeScreen';
import { NewsListScreen } from '../features/news/NewsListScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { ServicesScreen } from '../features/services/ServicesScreen';
import { UniversitiesScreen } from '../features/universities/UniversitiesScreen';

import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function tabIcon(name: SvgIconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <SvgIcon name={name} size={focused ? 25 : 22} color={color} strokeWidth={focused ? 2.7 : 2.1} />
  );
}

export function AppNavigator() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.safeArea}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            minHeight: insets.top + 66,
          },
          shadows.soft,
        ]}
      >
        <BrandLogo width={174} style={styles.logoBox} />
        <Pressable
          style={styles.menuButton}
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Открыть меню"
        >
          <SvgIcon name="menu" size={24} color={colors.primary} strokeWidth={2.6} />
        </Pressable>
      </View>

      <View style={styles.navigatorWrap}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.muted,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '900',
              marginTop: 1,
            },
            tabBarItemStyle: {
              borderRadius: 12,
            },
            tabBarStyle: {
              height: 66 + Math.max(insets.bottom, 8),
              paddingBottom: Math.max(insets.bottom, 8),
              paddingTop: 8,
              paddingHorizontal: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: 'rgba(255,255,255,0.98)',
              ...shadows.soft,
            },
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Главная', tabBarIcon: tabIcon('home') }} />
          <Tab.Screen name="Services" component={ServicesScreen} options={{ title: 'Услуги', tabBarIcon: tabIcon('services') }} />
          <Tab.Screen name="Universities" component={UniversitiesScreen} options={{ title: 'Вузы', tabBarIcon: tabIcon('university') }} />
          <Tab.Screen name="News" component={NewsListScreen} options={{ title: 'Новости', tabBarIcon: tabIcon('news') }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль', tabBarIcon: tabIcon('profile') }} />
        </Tab.Navigator>
      </View>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoBox: {
    flex: 1,
    paddingRight: spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navigatorWrap: {
    flex: 1,
  },
});
