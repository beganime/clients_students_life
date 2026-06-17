import React, { useMemo, useState } from 'react';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type StatusState = { type: 'success' | 'error' | 'info'; text: string } | null;

export function RegisterScreen({ navigation }: Props) {
  const registerAndLogin = useAuthStore(state => state.registerAndLogin);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const passwordValid = password.length >= 6;
  const passwordsMatch = password.length > 0 && password === passwordConfirm;

  const passwordMessage = useMemo(() => {
    if (!password && !passwordConfirm) return 'Зарегистрированные пользователи видят историю заявок и получают персональные предложения.';
    if (!passwordValid) return 'Пароль должен быть минимум 6 символов.';
    if (passwordConfirm && !passwordsMatch) return 'Пароли не совпадают.';
    if (passwordsMatch) return 'Пароль подтверждён правильно.';
    return 'Повторите пароль для проверки.';
  }, [password, passwordConfirm, passwordValid, passwordsMatch]);

  const closeAuth = () => navigation.getParent<any>()?.navigate('App');

  const handleRegister = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!firstName.trim() || !lastName.trim() || !cleanEmail || !password) {
      setStatus({ type: 'error', text: 'Заполните имя, фамилию, email и пароль.' });
      return;
    }
    if (!passwordValid) {
      setStatus({ type: 'error', text: 'Пароль должен быть минимум 6 символов.' });
      return;
    }
    if (!passwordsMatch) {
      setStatus({ type: 'error', text: 'Пароли не совпадают.' });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: 'info', text: 'Создаём аккаунт...' });
      await registerAndLogin({
        email: cleanEmail,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
        password_confirm: passwordConfirm,
        phone,
        whatsapp: phone,
        language: 'ru',
      });
      setStatus({ type: 'success', text: 'Аккаунт создан. Вы успешно вошли в систему.' });
      setTimeout(() => navigation.getParent<any>()?.navigate('App'), 500);
    } catch (error) {
      setStatus({ type: 'error', text: 'Не удалось зарегистрироваться. Проверьте данные или попробуйте другой email.' });
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
        <View style={styles.glowMint} />
        <View style={styles.iconBox}><SvgIcon name="userPlus" size={36} color={colors.white} strokeWidth={2.4} /></View>
        <Text style={styles.title}>Создайте аккаунт</Text>
        <Text style={styles.subtitle}>Так менеджеру проще отвечать, а вам — видеть историю заявок, чатов и персональные предложения.</Text>
      </View>

      <AppCard style={styles.formCard}>
        <View style={styles.nameRow}>
          <AppInput wrapperStyle={styles.nameInput} label="Имя" value={firstName} onChangeText={text => { setFirstName(text); setStatus(null); }} placeholder="Ali" />
          <AppInput wrapperStyle={styles.nameInput} label="Фамилия" value={lastName} onChangeText={text => { setLastName(text); setStatus(null); }} placeholder="Myradov" />
        </View>
        <AppInput label="Email" value={email} onChangeText={text => { setEmail(text); setStatus(null); }} autoCapitalize="none" keyboardType="email-address" placeholder="student@example.com" />
        <AppInput label="Телефон / WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+993..." />
        <AppInput
          label="Пароль"
          value={password}
          onChangeText={text => { setPassword(text); setStatus(null); }}
          secureTextEntry={!showPassword}
          placeholder="Минимум 6 символов"
          right={<Pressable onPress={() => setShowPassword(!showPassword)}><Text style={styles.toggleText}>{showPassword ? 'Скрыть' : 'Показать'}</Text></Pressable>}
        />
        <AppInput label="Повторите пароль" value={passwordConfirm} onChangeText={text => { setPasswordConfirm(text); setStatus(null); }} secureTextEntry={!showPassword} placeholder="Повторите пароль" helper={passwordMessage} />

        {status ? <StatusBox type={status.type} text={status.text} /> : null}

        <AppButton title="Создать аккаунт" onPress={handleRegister} loading={loading} />
        <Pressable style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Уже есть аккаунт? Войти</Text>
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
  screen: { backgroundColor: colors.background, paddingBottom: 36 },
  topBar: { alignItems: 'flex-end', marginBottom: spacing.md },
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
    minHeight: 270,
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
  glowMint: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.success,
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
  title: { color: colors.white, fontSize: 34, lineHeight: 39, fontWeight: typography.weights.heavy },
  subtitle: { color: 'rgba(255,255,255,0.84)', marginTop: spacing.sm, fontSize: typography.body, lineHeight: 23 },
  formCard: { padding: spacing.lg },
  nameRow: { flexDirection: 'row', gap: spacing.sm },
  nameInput: { flex: 1 },
  toggleText: { color: colors.primary, fontWeight: typography.weights.heavy },
  statusBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  statusText: { flex: 1, fontWeight: typography.weights.bold, lineHeight: 20 },
  loginLink: { marginTop: spacing.lg, alignItems: 'center' },
  loginText: { color: colors.primary, fontSize: typography.body, fontWeight: typography.weights.bold },
});
