import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeScreen } from '../features/home/HomeScreen';
import { NewsListScreen } from '../features/news/NewsListScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { ServicesScreen } from '../features/services/ServicesScreen';
import { UniversitiesScreen } from '../features/universities/UniversitiesScreen';
import { APP_NAME } from '../constants/config';
import { colors, shadows, spacing, typography } from '../constants/colors';
import { SideMenu } from '../components/SideMenu';
import { SvgIcon, SvgIconName } from '../components/SvgIcon';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function tabIcon(name: SvgIconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <SvgIcon name={name} size={focused ? 25 : 22} color={color} strokeWidth={focused ? 2.7 : 2.1} />
  );
}

export function AppNavigator() {
  const navigation = useNavigation<any>();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.header, shadows.soft]}>
        <View>
          <Text style={styles.logo}>{APP_NAME}</Text>
          <Text style={styles.logoSub}>International Education</Text>
        </View>
        <Pressable style={styles.menuButton} onPress={() => setMenuOpen(true)}>
          <Text style={styles.menuText}>☰</Text>
        </Pressable>
      </View>

      <View style={styles.navigatorWrap}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#B91C1C',
            tabBarInactiveTintColor: colors.muted,
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
              paddingHorizontal: 10,
              borderTopWidth: 1,
              borderTopColor: '#FAD7D7',
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF7F5',
  },
  header: {
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#FFDDDD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: '#B91C1C',
    fontSize: 22,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.4,
  },
  logoSub: {
    color: colors.muted,
    fontSize: typography.tiny,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFDADA',
  },
  menuText: {
    color: '#B91C1C',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: typography.weights.heavy,
  },
  navigatorWrap: {
    flex: 1,
  },
});
