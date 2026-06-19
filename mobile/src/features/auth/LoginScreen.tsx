import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { BrandLogo } from '../../components/BrandLogo';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type StatusState = { type: 'success' | 'error' | 'info'; text: string } | null;

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore(state => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const closeAuth = () => navigation.getParent<any>()?.navigate('App');

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setStatus({ type: 'error', text: 'Введите email и пароль.' });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: 'error', text: 'Пароль должен быть минимум 6 символов.' });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: 'info', text: 'Проверяем данные...' });
      await login(cleanEmail, password);
      setStatus({ type: 'success', text: 'Вы успешно вошли в систему.' });
      setTimeout(() => navigation.getParent<any>()?.navigate('App'), 400);
    } catch (error) {
      setStatus({ type: 'error', text: 'Не удалось войти. Проверьте email и пароль.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.closeButton} onPress={closeAuth}>
          <SvgIcon name="close" size={22} color={colors.text} />
        </Pressable>
      </View>

      <RedGradientHero backgroundImage={bannerImages.profile} style={styles.heroCard}>
        <View style={styles.logoPill}>
          <BrandLogo width={168} />
        </View>
        <Text style={styles.title}>Вход в Student's Life</Text>
        <Text style={styles.subtitle}>
          Войдите, чтобы сохранять заявки, писать менеджеру и быстрее оформлять новые услуги.
        </Text>
      </RedGradientHero>

      <AppCard style={styles.formCard}>
        <AppInput
          label="Email"
          value={email}
          onChangeText={text => {
            setEmail(text);
            setStatus(null);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="student@example.com"
        />
        <AppInput
          label="Пароль"
          value={password}
          onChangeText={text => {
            setPassword(text);
            setStatus(null);
          }}
          secureTextEntry={!showPassword}
          placeholder="Введите пароль"
          right={
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.toggleText}>{showPassword ? 'Скрыть' : 'Показать'}</Text>
            </Pressable>
          }
        />
        {status ? <StatusBox type={status.type} text={status.text} /> : null}
        <AppButton title="Войти" onPress={handleLogin} loading={loading} />
        <Pressable style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>Нет аккаунта? Зарегистрироваться</Text>
        </Pressable>
      </AppCard>
    </Screen>
  );
}

function StatusBox({ type, text }: { type: 'success' | 'error' | 'info'; text: string }) {
  const icon = type === 'success' ? 'check' : type === 'error' ? 'warning' : 'lock';
  const color = type === 'success' ? colors.success : type === 'error' ? colors.danger : colors.secondary;
  return (
    <View style={[styles.statusBox, { borderColor: `${color}33`, backgroundColor: `${color}12` }]}>
      <SvgIcon name={icon} size={18} color={color} />
      <Text style={[styles.statusText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, paddingBottom: 36 },
  topBar: { alignItems: 'flex-end', marginBottom: spacing.md },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroCard: { minHeight: 270, marginBottom: spacing.lg },
  logoPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    marginBottom: spacing.lg,
  },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy },
  subtitle: { color: 'rgba(255,255,255,0.92)', marginTop: spacing.sm, fontSize: typography.body, lineHeight: 23 },
  formCard: { padding: spacing.lg },
  toggleText: { color: colors.secondary, fontWeight: typography.weights.heavy },
  statusBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1 },
  statusText: { flex: 1, fontWeight: typography.weights.bold, lineHeight: 20 },
  registerLink: { marginTop: spacing.lg, alignItems: 'center' },
  registerText: { color: colors.secondary, fontSize: typography.body, fontWeight: typography.weights.bold },
});
