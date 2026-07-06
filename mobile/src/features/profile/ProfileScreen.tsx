import React from 'react';
import { Alert, Dimensions, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { CTASection } from '../../components/CTASection';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { PRIVACY_POLICY_URL } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { getMediaUrl } from '../../utils/media';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 18;
const QUICK_GAP = spacing.sm;
const QUICK_COLUMNS = width < 360 ? 1 : 2;
const QUICK_WIDTH = QUICK_COLUMNS === 1 ? width - SCREEN_PADDING * 2 : Math.floor((width - SCREEN_PADDING * 2 - QUICK_GAP) / 2);

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, isAuthenticated, logout } = useAuthStore();
  const avatarUrl = getMediaUrl(user?.profile?.avatar || null);
  const isManager = Boolean(user?.is_manager);

  const confirmLogout = () => {
    Alert.alert('Выйти из аккаунта?', 'Вы сможете снова войти по email и паролю.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ]);
  };

  if (!isAuthenticated || !user) {
    return (
      <Screen scroll style={styles.screen}>
        <RedGradientHero backgroundImage={bannerImages.profile} style={styles.guestHero}>
          <Text style={styles.guestTitle}>Гостевой режим</Text>
          <Text style={styles.guestText}>
            Можно смотреть услуги, страны, университеты и новости. Для заявок, чата, избранного и
            персональных предложений лучше войти или зарегистрироваться.
          </Text>
        </RedGradientHero>

        <AppCard style={styles.benefitCard}>
          <Badge label="Преимущества аккаунта" variant="mint" icon="check" />
          <Text style={styles.benefitTitle}>Регистрация экономит время</Text>
          <Text style={styles.benefitText}>
            Вы сможете видеть историю заявок, получать ответы менеджера, сохранять университеты и
            быстрее оформлять новые услуги.
          </Text>
        </AppCard>

        <View style={styles.actions}>
          <AppButton title="Войти" onPress={() => navigation.navigate('Auth', { screen: 'Login' })} />
          <AppButton title="Зарегистрироваться" variant="outline" onPress={() => navigation.navigate('Auth', { screen: 'Register' })} />
          <AppButton title="Политика конфиденциальности" variant="ghost" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
        </View>
      </Screen>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Пользователь';

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero backgroundImage={bannerImages.profile} style={styles.profileHero}>
        <View style={styles.profileTopRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <SvgIcon name="profile" size={42} color={colors.secondary} />
            </View>
          )}
          <View style={styles.profileTitleBox}>
            <Badge label={isManager ? 'Менеджер' : 'Пользователь'} variant={isManager ? 'orange' : 'blue'} icon="lock" />
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
      </RedGradientHero>

      <View style={styles.quickGrid}>
        <QuickAction icon="document" title="Мои заявки" onPress={() => navigation.navigate('MyApplications')} />
        <QuickAction icon="file" title="Мои документы" onPress={() => navigation.navigate('MyDocuments')} />
        <QuickAction icon="chat" title="Мои чаты" onPress={() => navigation.navigate('Chat')} />
        <QuickAction icon="bell" title="Уведомления" onPress={() => navigation.navigate('Notifications')} />
      </View>

      <AppCard style={styles.infoCard}>
        <Text style={styles.blockTitle}>Контактные данные</Text>
        <ProfileInfo icon="phone" label="Телефон" value={user.profile?.phone || 'не указан'} />
        <ProfileInfo icon="phone" label="WhatsApp" value={user.profile?.whatsapp || 'не указан'} />
        <ProfileInfo icon="chat" label="Telegram" value={user.profile?.telegram || 'не указан'} />
        <ProfileInfo icon="globe" label="Страна" value={user.profile?.country || 'не указана'} />
        <ProfileInfo icon="mapPin" label="Город" value={user.profile?.city || 'не указан'} />
      </AppCard>

      <AppCard style={styles.benefitCard}>
        <Badge label="Выгодно пользоваться аккаунтом" variant="mint" icon="check" />
        <Text style={styles.benefitTitle}>Ваши заявки и чаты сохраняются</Text>
        <Text style={styles.benefitText}>
          История обращений, ответы менеджера, персональные предложения и скидки будут доступны в профиле.
        </Text>
      </AppCard>

      <View style={styles.menu}>
        <ProfileMenuItem icon="edit" title="Редактировать профиль" onPress={() => navigation.navigate('EditProfile')} />
        <ProfileMenuItem icon="bell" title="Уведомления" onPress={() => navigation.navigate('Notifications')} />
        <ProfileMenuItem icon="document" title={isManager ? 'Заявки клиентов' : 'Мои заявки'} onPress={() => navigation.navigate('MyApplications')} />
        <ProfileMenuItem icon="file" title="Мои документы" onPress={() => navigation.navigate('MyDocuments')} />
        {!isManager ? <ProfileMenuItem icon="application" title="Подать новую заявку" onPress={() => navigation.navigate('ApplicationCreate')} /> : null}
        <ProfileMenuItem icon="chat" title={isManager ? 'Входящие чаты клиентов' : 'Чат с менеджером'} onPress={() => navigation.navigate('Chat')} />
        <ProfileMenuItem icon="services" title="Настройки" onPress={() => navigation.navigate('Settings')} />
        <ProfileMenuItem icon="document" title="Политика конфиденциальности" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
      </View>

      <CTASection
        eyebrow="Поддержка"
        title="Нужна помощь по заявке?"
        description="Откройте чат, и менеджер подскажет статус, документы и дальнейшие шаги."
        primaryText="Открыть чат"
        onPrimaryPress={() => navigation.navigate('Chat')}
        secondaryText="Новая заявка"
        onSecondaryPress={() => navigation.navigate('ApplicationCreate')}
      />
      <AppButton title="Выйти" variant="danger" onPress={confirmLogout} style={styles.logoutButton} />
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

function QuickAction({ icon, title, onPress }: { icon: SvgIconName; title: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.quickAction, { width: QUICK_WIDTH }]} onPress={onPress}>
      <View style={styles.quickIcon}>
        <SvgIcon name={icon} size={21} color={colors.secondary} />
      </View>
      <Text style={styles.quickText}>{title}</Text>
    </Pressable>
  );
}

function ProfileMenuItem({ icon, title, onPress }: { icon: SvgIconName; title: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconBox}>
        <SvgIcon name={icon} size={21} color={colors.secondary} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <SvgIcon name="chevronRight" size={19} color={colors.mutedLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  guestHero: { minHeight: 310, marginBottom: spacing.lg },
  guestTitle: { color: colors.white, fontSize: 32, fontWeight: typography.weights.heavy },
  guestText: { marginTop: spacing.sm, color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, fontWeight: typography.weights.medium },
  profileHero: { minHeight: 230, marginBottom: spacing.lg },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileTitleBox: { flex: 1 },
  avatar: { width: 86, height: 86, borderRadius: radius.lg, backgroundColor: colors.border },
  avatarPlaceholder: { width: 86, height: 86, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.42)' },
  name: { color: colors.white, fontSize: typography.title, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  email: { marginTop: 4, color: 'rgba(255,255,255,0.9)', fontWeight: typography.weights.bold },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: QUICK_GAP, marginBottom: spacing.lg },
  quickAction: { minHeight: 112, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-between', ...shadows.soft },
  quickIcon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: 'rgba(13,65,109,0.08)', alignItems: 'center', justifyContent: 'center' },
  quickText: { color: colors.text, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  infoCard: { marginBottom: spacing.lg },
  blockTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  infoIconBox: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: 'rgba(13,65,109,0.08)', alignItems: 'center', justifyContent: 'center' },
  infoTextBox: { flex: 1 },
  infoLabel: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold },
  infoValue: { color: colors.text, marginTop: 2, fontWeight: typography.weights.heavy },
  benefitCard: { marginBottom: spacing.lg },
  benefitTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  benefitText: { color: colors.muted, lineHeight: 22, marginTop: spacing.xs, fontWeight: typography.weights.medium },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  menu: { gap: spacing.sm },
  menuItem: { minHeight: 62, borderRadius: radius.lg, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...shadows.soft },
  menuIconBox: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: 'rgba(13,65,109,0.08)', alignItems: 'center', justifyContent: 'center' },
  menuTitle: { flex: 1, color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy },
  logoutButton: { marginTop: spacing.lg },
});
