import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  return (
    <Screen style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logo}>Student’s Life</Text>
        <Text style={styles.badge}>International Education</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Поступление за рубеж стало проще</Text>
        <Text style={styles.description}>
          Подберите университет, подайте заявку, получите консультацию и сопровождайте процесс поступления прямо в приложении.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton title="Войти" onPress={() => navigation.navigate('Auth')} />
        <AppButton title="Продолжить" variant="outline" onPress={() => navigation.navigate('Auth')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoBox: {
    marginTop: 40,
  },
  logo: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '900',
  },
  badge: {
    marginTop: 8,
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    gap: 14,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
  },
  description: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
});