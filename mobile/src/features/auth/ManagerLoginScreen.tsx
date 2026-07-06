import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { colors, spacing, typography } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ManagerLogin'>;

export function ManagerLoginScreen({ navigation }: Props) {
  const managerLogin = useAuthStore(state => state.managerLogin);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('Введите логин и пароль сотрудника.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await managerLogin(cleanUsername, password);
      navigation.navigate('App', { screen: 'Profile' });
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, 'Не удалось войти как сотрудник. Проверьте логин, пароль и профиль Staff в админке.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero backgroundImage={bannerImages.profile} style={styles.hero}>
        <Text style={styles.title}>Вход сотрудника</Text>
        <Text style={styles.subtitle}>
          Используйте локальный аккаунт Student's Life. Доступ откроется, если к пользователю привязан активный профиль Staff в админке.
        </Text>
      </RedGradientHero>

      <AppCard style={styles.card}>
        <AppInput
          label="Логин или email"
          value={username}
          onChangeText={text => {
            setUsername(text);
            setError(null);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="manager@example.com"
        />
        <AppInput
          label="Пароль"
          value={password}
          onChangeText={text => {
            setPassword(text);
            setError(null);
          }}
          secureTextEntry
          placeholder="Пароль сотрудника"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <AppButton title="Войти как сотрудник" onPress={handleLogin} loading={loading} />
          <AppButton title="Назад к настройкам" variant="outline" onPress={() => navigation.goBack()} disabled={loading} />
        </View>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 238, marginBottom: spacing.lg },
  title: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: typography.weights.heavy,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  card: { marginBottom: spacing.lg },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  error: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
});
