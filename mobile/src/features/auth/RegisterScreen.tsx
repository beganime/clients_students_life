import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';
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
      await registerAndLogin({ email: cleanEmail, first_name: firstName.trim(), last_name: lastName.trim(), password, password_confirm: passwordConfirm, phone, whatsapp: phone, language: 'ru' });
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

      <RedGradientHero backgroundImage={bannerImages.profile} style={styles.heroCard}>
        <Text style={styles.title}>Создайте аккаунт</Text>
        <Text style={styles.subtitle}>
          Так менеджеру проще отвечать, а вам — видеть историю заявок, чатов и персональные предложения.
        </Text>
      </RedGradientHero>

      <AppCard style={styles.formCard}>
        <View style={styles.nameRow}>
          <AppInput wrapperStyle={styles.nameInput} label="Имя" value={firstName} onChangeText={text => { setFirstName(text); setStatus(null); }} placeholder="Ali" />
          <AppInput wrapperStyle={styles.nameInput} label="Фамилия" value={lastName} onChangeText={text => { setLastName(text); setStatus(null); }} placeholder="Myradov" />
        </View>
        <AppInput label="Email" value={email} onChangeText={text => { setEmail(text); setStatus(null); }} autoCapitalize="none" keyboardType="email-address" placeholder="student@example.com" />
        <AppInput label="Телефон / WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+993..." />
        <AppInput label="Пароль" value={password} onChangeText={text => { setPassword(text); setStatus(null); }} secureTextEntry={!showPassword} placeholder="Минимум 6 символов" right={<Pressable onPress={() => setShowPassword(!showPassword)}><Text style={styles.toggleText}>{showPassword ? 'Скрыть' : 'Показать'}</Text></Pressable>} />
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
  closeButton: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  heroCard: { minHeight: 270, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy },
  subtitle: { color: 'rgba(255,255,255,0.92)', marginTop: spacing.sm, fontSize: typography.body, lineHeight: 23 },
  formCard: { padding: spacing.lg },
  nameRow: { flexDirection: 'row', gap: spacing.sm },
  nameInput: { flex: 1 },
  toggleText: { color: colors.secondary, fontWeight: typography.weights.heavy },
  statusBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1 },
  statusText: { flex: 1, fontWeight: typography.weights.bold, lineHeight: 20 },
  loginLink: { marginTop: spacing.lg, alignItems: 'center' },
  loginText: { color: colors.secondary, fontSize: typography.body, fontWeight: typography.weights.bold },
});
