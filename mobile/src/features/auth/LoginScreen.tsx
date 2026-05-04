import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore(state => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Введите email и пароль');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim().toLowerCase(), password);
    } catch (error) {
      Alert.alert('Ошибка входа', 'Проверьте email и пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Вход</Text>
        <Text style={styles.subtitle}>Войдите, чтобы подать заявку и писать менеджеру.</Text>
      </View>

      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="student@example.com"
      />

      <AppInput
        label="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Введите пароль"
      />

      <AppButton title="Войти" onPress={handleLogin} loading={loading} />

      <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerText}>Нет аккаунта? Зарегистрироваться</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 40,
    marginBottom: 28,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  registerLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  registerText: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '700',
  },
});