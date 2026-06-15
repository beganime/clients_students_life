import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { Screen } from '../../components/Screen';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors } from '../../constants/colors';
import { PRIVACY_POLICY_URL } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { getMediaUrl } from '../../utils/media';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, isAuthenticated, logout } = useAuthStore();
  const avatarUrl = getMediaUrl(user?.profile?.avatar || null);

  if (!isAuthenticated || !user) {
    return (
      <Screen scroll style={styles.screen}>
        <View style={styles.guestHero}>
          <View style={styles.glowRed} />
          <View style={styles.glowBlue} />

          <View style={styles.guestIconBox}>
            <SvgIcon name="profile" size={40} color={colors.white} />
          </View>

          <Text style={styles.guestTitle}>Гостевой режим</Text>
          <Text style={styles.guestText}>
            Можно свободно смотреть услуги, страны, университеты и новости. Чтобы подать заявку,
            писать менеджеру, сохранять вузы и отслеживать заявки — войдите или зарегистрируйтесь.
          </Text>
        </View>

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
          <AppButton
            title="Политика конфиденциальности"
            variant="outline"
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.profileHero}>
        <View style={styles.profileGlow} />

        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <SvgIcon name="profile" size={44} color={colors.primary} />
          </View>
        )}

        <Text style={styles.name}>
          {user.first_name} {user.last_name}
        </Text>

        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.infoCard}>
        <ProfileInfo icon="lock" label="Role" value={user.role || 'user'} />
        <ProfileInfo icon="phone" label="Телефон" value={user.profile?.phone || 'не указан'} />
        <ProfileInfo icon="phone" label="WhatsApp" value={user.profile?.whatsapp || 'не указан'} />
        <ProfileInfo icon="chat" label="Telegram" value={user.profile?.telegram || 'не указан'} />
        <ProfileInfo icon="globe" label="Страна" value={user.profile?.country || 'не указана'} />
        <ProfileInfo icon="mapPin" label="Город" value={user.profile?.city || 'не указан'} />
      </View>

      <View style={styles.menu}>
        <ProfileMenuItem
          icon="edit"
          title="Редактировать профиль"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <ProfileMenuItem
          icon="bell"
          title="Уведомления"
          onPress={() => navigation.navigate('Notifications')}
        />
        <ProfileMenuItem
          icon="heart"
          title="Избранные вузы"
          onPress={() => navigation.navigate('FavoriteUniversities')}
        />
        <ProfileMenuItem
          icon="document"
          title="Мои заявки"
          onPress={() => navigation.navigate('MyApplications')}
        />
        <ProfileMenuItem
          icon="application"
          title="Подать новую заявку"
          onPress={() => navigation.navigate('ApplicationCreate')}
        />
        <ProfileMenuItem
          icon="chat"
          title="Чат с менеджером"
          onPress={() => navigation.navigate('Chat')}
        />

        <ProfileMenuItem
          icon="document"
          title="Политика конфиденциальности"
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
        />

        <Pressable
          style={[styles.menuItem, styles.logoutItem]}
          onPress={logout}
        >
          <View style={[styles.menuIconBox, styles.logoutIconBox]}>
            <SvgIcon name="logout" size={21} color={colors.danger} />
          </View>
          <Text style={[styles.menuTitle, styles.logoutText]}>Выйти</Text>
          <SvgIcon name="chevronRight" size={19} color={colors.danger} />
        </Pressable>
      </View>
    </Screen>
  );
}

function ProfileInfo({ icon, label, value }: { icon: SvgIconName; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <SvgIcon name={icon} size={18} color={colors.secondary} />
      </View>

      <View style={styles.infoTextBox}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ProfileMenuItem({
  icon,
  title,
  onPress,
}: {
  icon: SvgIconName;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconBox}>
        <SvgIcon name={icon} size={21} color={colors.primary} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <SvgIcon name="chevronRight" size={19} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    paddingBottom: 42,
    backgroundColor: '#F4F7FB',
  },
  guestHero: {
    minHeight: 320,
    borderRadius: 34,
    padding: 22,
    backgroundColor: '#101828',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowColor: '#101828',
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  glowRed: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary,
    top: -90,
    right: -80,
    opacity: 0.7,
  },
  glowBlue: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.secondary,
    bottom: -105,
    left: -85,
    opacity: 0.72,
  },
  guestIconBox: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginBottom: 16,
  },
  guestTitle: {
    color: colors.white,
    fontSize: 31,
    fontWeight: '900',
  },
  guestText: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  profileHero: {
    borderRadius: 34,
    padding: 22,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#101828',
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 13 },
    elevation: 6,
  },
  profileGlow: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(229,57,53,0.1)',
    top: -115,
    right: -80,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    marginBottom: 14,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    marginBottom: 14,
    backgroundColor: 'rgba(229,57,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  email: {
    marginTop: 6,
    color: colors.secondary,
    fontWeight: '800',
  },
  infoCard: {
    borderRadius: 26,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
  },
  infoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(21,101,192,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  infoValue: {
    color: colors.text,
    marginTop: 2,
    fontWeight: '900',
  },
  actions: {
    gap: 12,
    marginTop: 18,
  },
  menu: {
    gap: 10,
  },
  menuItem: {
    minHeight: 64,
    borderRadius: 22,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(229,57,53,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  logoutItem: {
    borderColor: 'rgba(240,68,56,0.18)',
    backgroundColor: 'rgba(240,68,56,0.06)',
  },
  logoutIconBox: {
    backgroundColor: 'rgba(240,68,56,0.1)',
  },
  logoutText: {
    color: colors.danger,
  },
});
