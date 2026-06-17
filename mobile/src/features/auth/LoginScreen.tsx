import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
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

      <View style={[styles.heroCard, shadows.premium]}>
        <View style={styles.glowBlue} />
        <View style={styles.glowCoral} />
        <View style={styles.iconBox}><SvgIcon name="profile" size={34} color={colors.white} strokeWidth={2.4} /></View>
        <Text style={styles.title}>Вход в Student’s Life</Text>
        <Text style={styles.subtitle}>Войдите, чтобы сохранять заявки, писать менеджеру и быстрее оформлять новые услуги.</Text>
      </View>

      <AppCard style={styles.formCard}>
        <AppInput label="Email" value={email} onChangeText={text => { setEmail(text); setStatus(null); }} autoCapitalize="none" keyboardType="email-address" placeholder="student@example.com" />
        <AppInput
          label="Пароль"
          value={password}
          onChangeText={text => { setPassword(text); setStatus(null); }}
          secureTextEntry={!showPassword}
          placeholder="Введите пароль"
          right={<Pressable onPress={() => setShowPassword(!showPassword)}><Text style={styles.toggleText}>{showPassword ? 'Скрыть' : 'Показать'}</Text></Pressable>}
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
  const color = type === 'success' ? colors.success : type === 'error' ? colors.danger : colors.primary;
  return (
    <View style={[styles.statusBox, { borderColor: `${color}33`, backgroundColor: `${color}12` }]}>
      <SvgIcon name={icon} size={18} color={color} />
      <Text style={[styles.statusText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    paddingBottom: 36,
  },
  topBar: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroCard: {
    minHeight: 260,
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.primaryDark,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: spacing.lg,
  },
  glowBlue: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: colors.primary,
    top: -80,
    right: -70,
    opacity: 0.68,
  },
  glowCoral: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    bottom: -90,
    left: -70,
    opacity: 0.24,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: typography.weights.heavy,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.84)',
    marginTop: spacing.sm,
    fontSize: typography.body,
    lineHeight: 23,
  },
  formCard: {
    padding: spacing.lg,
  },
  toggleText: {
    color: colors.primary,
    fontWeight: typography.weights.heavy,
  },
  statusBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  statusText: {
    flex: 1,
    fontWeight: typography.weights.bold,
    lineHeight: 20,
  },
  registerLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  registerText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: typography.weights.bold,
  },
});
