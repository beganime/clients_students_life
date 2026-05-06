import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getMediaUrl } from '../../utils/media';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, isAuthenticated, logout } = useAuthStore();
  const avatarUrl = getMediaUrl(user?.profile?.avatar || null);

  if (!isAuthenticated || !user) {
    return (
      <Screen scroll>
        <Text style={styles.title}>Профиль</Text>

        <View style={styles.guestCard}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>Вы используете приложение без аккаунта</Text>
          <Text style={styles.guestText}>
            Можно свободно смотреть услуги, страны, университеты и новости. Чтобы подать заявку,
            писать менеджеру, сохранять вузы и отслеживать заявки — войдите или зарегистрируйтесь.
          </Text>

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
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Профиль</Text>

      <View style={styles.card}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}

        <Text style={styles.name}>
          {user.first_name} {user.last_name}
        </Text>

        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.info}>Телефон: {user.profile?.phone || 'не указан'}</Text>
        <Text style={styles.info}>WhatsApp: {user.profile?.whatsapp || 'не указан'}</Text>
        <Text style={styles.info}>Telegram: {user.profile?.telegram || 'не указан'}</Text>
        <Text style={styles.info}>Страна: {user.profile?.country || 'не указана'}</Text>
        <Text style={styles.info}>Город: {user.profile?.city || 'не указан'}</Text>
      </View>

      <View style={styles.actions}>
        <AppButton title="Редактировать профиль" onPress={() => navigation.navigate('EditProfile')} />
        <AppButton title="Уведомления" variant="secondary" onPress={() => navigation.navigate('Notifications')} />
        <AppButton title="Избранные вузы" variant="secondary" onPress={() => navigation.navigate('FavoriteUniversities')} />
        <AppButton title="Мои заявки" onPress={() => navigation.navigate('MyApplications')} />
        <AppButton title="Подать новую заявку" variant="secondary" onPress={() => navigation.navigate('ApplicationCreate')} />
        <AppButton title="Выйти" variant="outline" onPress={logout} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 18,
  },
  guestCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    alignItems: 'center',
  },
  guestIcon: {
    fontSize: 46,
    marginBottom: 12,
  },
  guestTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  guestText: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 14,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 14,
    backgroundColor: '#FDECEC',
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  email: {
    marginTop: 6,
    color: colors.secondary,
    fontWeight: '700',
  },
  info: {
    marginTop: 9,
    color: colors.muted,
  },
  actions: {
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
    width: '100%',
  },
});