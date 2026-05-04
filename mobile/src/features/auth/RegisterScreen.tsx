import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';

export function RegisterScreen() {
  const registerAndLogin = useAuthStore(state => state.registerAndLogin);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Ошибка', 'Заполните имя, фамилию, email и пароль');
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    try {
      setLoading(true);
      await registerAndLogin({
        email: email.trim().toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirm: passwordConfirm,
        phone,
        whatsapp: phone,
        language: 'ru',
      });
    } catch (error) {
      Alert.alert('Ошибка регистрации', 'Проверьте данные или попробуйте другой email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>Регистрация</Text>
      <Text style={styles.subtitle}>Создайте аккаунт, чтобы отслеживать заявки и общаться с менеджером.</Text>

      <AppInput label="Имя" value={firstName} onChangeText={setFirstName} placeholder="Ali" />
      <AppInput label="Фамилия" value={lastName} onChangeText={setLastName} placeholder="Myradov" />
      <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="student@example.com" />
      <AppInput label="Телефон / WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+993..." />
      <AppInput label="Пароль" value={password} onChangeText={setPassword} secureTextEntry />
      <AppInput label="Повторите пароль" value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry />

      <AppButton title="Создать аккаунт" onPress={handleRegister} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 30,
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 26,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});