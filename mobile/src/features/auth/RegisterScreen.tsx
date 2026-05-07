import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors } from '../../constants/colors';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type StatusState = {
  type: 'success' | 'error' | 'info';
  text: string;
} | null;

export function RegisterScreen({ navigation }: Props) {
  const registerAndLogin = useAuthStore(state => state.registerAndLogin);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const passwordValid = password.length >= 6;
  const passwordsMatch = password.length > 0 && password === passwordConfirm;

  const passwordMessage = useMemo(() => {
    if (!password && !passwordConfirm) return null;
    if (!passwordValid) return 'Пароль должен быть минимум 6 символов.';
    if (passwordConfirm && !passwordsMatch) return 'Пароли не совпадают.';
    if (passwordsMatch) return 'Пароль подтверждён правильно.';
    return null;
  }, [password, passwordConfirm, passwordValid, passwordsMatch]);

  const closeAuth = () => {
    navigation.getParent<any>()?.navigate('App');
  };

  const handleRegister = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!firstName.trim() || !lastName.trim() || !cleanEmail || !password) {
      setStatus({
        type: 'error',
        text: 'Заполните имя, фамилию, email и пароль.',
      });
      return;
    }

    if (!passwordValid) {
      setStatus({
        type: 'error',
        text: 'Пароль должен быть минимум 6 символов.',
      });
      return;
    }

    if (!passwordsMatch) {
      setStatus({
        type: 'error',
        text: 'Пароли не совпадают.',
      });
      return;
    }

    try {
      setLoading(true);
      setStatus({
        type: 'info',
        text: 'Создаём аккаунт...',
      });

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

      setStatus({
        type: 'success',
        text: 'Аккаунт создан. Вы успешно вошли в систему.',
      });

      setTimeout(() => {
        navigation.getParent<any>()?.navigate('App');
      }, 700);
    } catch (error) {
      setStatus({
        type: 'error',
        text: 'Не удалось зарегистрироваться. Проверьте данные или попробуйте другой email.',
      });
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

      <View style={styles.heroCard}>
        <View style={styles.glowRed} />
        <View style={styles.glowBlue} />

        <View style={styles.iconBox}>
          <SvgIcon name="userPlus" size={36} color={colors.white} strokeWidth={2.4} />
        </View>

        <Text style={styles.title}>Регистрация</Text>
        <Text style={styles.subtitle}>
          Создайте аккаунт, чтобы отслеживать заявки и общаться с менеджером.
        </Text>
      </View>

      <View style={styles.formCard}>
        <AppInput
          label="Имя"
          value={firstName}
          onChangeText={text => {
            setFirstName(text);
            setStatus(null);
          }}
          placeholder="Ali"
        />

        <AppInput
          label="Фамилия"
          value={lastName}
          onChangeText={text => {
            setLastName(text);
            setStatus(null);
          }}
          placeholder="Myradov"
        />

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
          label="Телефон / WhatsApp"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+993..."
        />

        <AppInput
          label="Пароль"
          value={password}
          onChangeText={text => {
            setPassword(text);
            setStatus(null);
          }}
          secureTextEntry
          placeholder="Минимум 6 символов"
        />

        <AppInput
          label="Повторите пароль"
          value={passwordConfirm}
          onChangeText={text => {
            setPasswordConfirm(text);
            setStatus(null);
          }}
          secureTextEntry
          placeholder="Повторите пароль"
        />

        {passwordMessage ? (
          <View style={[styles.passwordHint, passwordsMatch ? styles.hintSuccess : styles.hintError]}>
            <SvgIcon
              name={passwordsMatch ? 'check' : 'warning'}
              size={16}
              color={passwordsMatch ? colors.success : colors.danger}
            />
            <Text style={[styles.passwordHintText, passwordsMatch ? styles.hintSuccessText : styles.hintErrorText]}>
              {passwordMessage}
            </Text>
          </View>
        ) : null}

        {status ? (
          <View
            style={[
              styles.statusBox,
              status.type === 'success' && styles.statusSuccess,
              status.type === 'error' && styles.statusError,
              status.type === 'info' && styles.statusInfo,
            ]}
          >
            <SvgIcon
              name={status.type === 'success' ? 'check' : status.type === 'error' ? 'warning' : 'lock'}
              size={18}
              color={
                status.type === 'success'
                  ? colors.success
                  : status.type === 'error'
                    ? colors.danger
                    : colors.secondary
              }
            />
            <Text
              style={[
                styles.statusText,
                status.type === 'success' && styles.statusSuccessText,
                status.type === 'error' && styles.statusErrorText,
                status.type === 'info' && styles.statusInfoText,
              ]}
            >
              {status.text}
            </Text>
          </View>
        ) : null}

        <AppButton title="Создать аккаунт" onPress={handleRegister} loading={loading} />

        <Pressable style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Уже есть аккаунт? Войти</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F4F7FB',
    paddingBottom: 36,
  },
  topBar: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
  },
  heroCard: {
    minHeight: 230,
    borderRadius: 30,
    padding: 22,
    backgroundColor: '#101828',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 18,
  },
  glowRed: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: colors.primary,
    top: -75,
    right: -70,
    opacity: 0.7,
  },
  glowBlue: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.secondary,
    bottom: -90,
    left: -70,
    opacity: 0.65,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginBottom: 16,
  },
  title: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.86)',
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  passwordHint: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: -4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  hintSuccess: {
    backgroundColor: 'rgba(18,183,106,0.08)',
    borderColor: 'rgba(18,183,106,0.2)',
  },
  hintError: {
    backgroundColor: 'rgba(240,68,56,0.08)',
    borderColor: 'rgba(240,68,56,0.2)',
  },
  passwordHintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  hintSuccessText: {
    color: colors.success,
  },
  hintErrorText: {
    color: colors.danger,
  },
  statusBox: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: 'rgba(18,183,106,0.08)',
    borderColor: 'rgba(18,183,106,0.2)',
  },
  statusError: {
    backgroundColor: 'rgba(240,68,56,0.08)',
    borderColor: 'rgba(240,68,56,0.2)',
  },
  statusInfo: {
    backgroundColor: 'rgba(21,101,192,0.08)',
    borderColor: 'rgba(21,101,192,0.2)',
  },
  statusText: {
    flex: 1,
    fontWeight: '800',
    lineHeight: 20,
  },
  statusSuccessText: {
    color: colors.success,
  },
  statusErrorText: {
    color: colors.danger,
  },
  statusInfoText: {
    color: colors.secondary,
  },
  loginLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  loginText: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '800',
  },
});