import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from './AppButton';
import { Screen } from './Screen';
import { SvgIcon } from './SvgIcon';
import { colors } from '../constants/colors';

type Props = {
  title?: string;
  description?: string;
};

export function LoginRequired({
  title = 'Нужен вход в аккаунт',
  description = 'Эта функция доступна только после регистрации или входа. Смотреть услуги, вузы и новости можно без аккаунта.',
}: Props) {
  const navigation = useNavigation<any>();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <SvgIcon name="lock" size={36} color={colors.primary} strokeWidth={2.5} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.actions}>
            <AppButton
              title="Войти"
              onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
            />

            <AppButton
              title="Зарегистрироваться"
              variant="outline"
              onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,57,53,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.16)',
    marginBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 22,
  },
});