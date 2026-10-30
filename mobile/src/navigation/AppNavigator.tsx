import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { ExpressApplicationScreen } from '../features/questionnaire/ExpressApplicationScreen';
import { ApplicantQuestionnaireScreen } from '../features/questionnaire/ApplicantQuestionnaireScreen';
import { AdmissionStatusScreen } from '../features/applications/AdmissionStatusScreen';
import { useAuthStore } from '../store/authStore';

import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function ApplyTab() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? <ApplicantQuestionnaireScreen /> : <ExpressApplicationScreen />;
}

function tabIcon(name: SvgIconName, label: string) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <View style={styles.tabContent}><SvgIcon name={name} size={focused ? 24 : 22} color={color} strokeWidth={focused ? 2.5 : 2.1} /><Text numberOfLines={2} style={[styles.tabText, { color }, focused && styles.tabTextActive]}>{label}</Text></View>
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
        <BrandLogo width={135} style={styles.logoBox} />
        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction} onPress={() => navigation.navigate('Exams')} accessibilityRole="button" accessibilityLabel="Открыть экзамены"><SvgIcon name="calendar" size={21} color={colors.secondary} /></Pressable>
          <Pressable style={styles.headerAction} onPress={() => navigation.navigate('Notifications')} accessibilityRole="button" accessibilityLabel="Открыть уведомления"><SvgIcon name="bell" size={21} color={colors.secondary} /></Pressable>
          <Pressable style={styles.headerAction} onPress={() => navigation.navigate('App', { screen: 'Profile' })} accessibilityRole="button" accessibilityLabel="Открыть профиль"><SvgIcon name="profile" size={21} color={colors.secondary} /></Pressable>
        </View>
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
            tabBarShowLabel: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.muted,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '700',
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
              ...shadows.card,
            },
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Главная', tabBarIcon: tabIcon('home', 'Главная') }} />
          <Tab.Screen name="Universities" component={UniversitiesScreen} options={{ title: 'Вузы', tabBarIcon: tabIcon('university', 'Вузы') }} />
          <Tab.Screen name="Apply" component={ApplyTab} options={{ title: 'Подать заявку', tabBarIcon: tabIcon('application', 'Подать заявку') }} />
          <Tab.Screen name="Applications" component={AdmissionStatusScreen} options={{ title: 'Мои заявки', tabBarIcon: tabIcon('document', 'Мои заявки') }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Ещё', tabBarIcon: tabIcon('menu', 'Ещё') }} />
          <Tab.Screen name="Services" component={ServicesScreen} options={{ title: 'Услуги', tabBarButton: () => null }} />
          <Tab.Screen name="News" component={NewsListScreen} options={{ title: 'Новости', tabBarButton: () => null }} />
        </Tab.Navigator>
      </View>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: { minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  tabText: { fontSize: 10, lineHeight: 12, marginTop: 3, textAlign: 'center', fontWeight: '600' },
  tabTextActive: { fontWeight: '800' },
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
    paddingRight: spacing.sm,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 4 },
  headerAction: { width: 37, height: 40, alignItems: 'center', justifyContent: 'center' },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navigatorWrap: {
    flex: 1,
  },
});
