import React from 'react';
import { Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { APP_NAME, APP_VERSION, COMPANY_APPS_URL, OFFICIAL_SITE_URL, PRIVACY_POLICY_URL } from '../constants/config';
import { colors, shadows, spacing, typography } from '../constants/colors';
import { SvgIcon, SvgIconName } from './SvgIcon';

type Props = {
  visible: boolean;
  onClose: () => void;
  navigation: any;
};

export function SideMenu({ visible, onClose, navigation }: Props) {
  const navigate = (route: string, params?: object) => {
    onClose();
    navigation.navigate(route, params);
  };

  const openUrl = async (url: string) => {
    onClose();
    if (!url) {
      Alert.alert('Ссылка появится позже', 'Этот раздел можно подключить после публикации приложения.');
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.panel, shadows.premium]}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.logo}>{APP_NAME}</Text>
              <Text style={styles.logoSub}>Меню приложения</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть меню">
              <SvgIcon name="close" size={22} color={colors.primary} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={styles.menuList}>
            <MenuItem icon="chat" title="Чат" onPress={() => navigate('Chat')} />
            <MenuItem icon="application" title="Мои заявки" onPress={() => navigate('MyApplications')} />
            <MenuItem icon="university" title="Каталог вузов" onPress={() => navigate('App', { screen: 'Universities' })} />
            <MenuItem icon="application" title="Поступление" onPress={() => navigate('AdmissionInfo')} />
            <MenuItem icon="visa" title="Виза" onPress={() => navigate('VisaInfo')} />
            <MenuItem icon="mapPin" title="Туры" onPress={() => navigate('ToursInfo')} />
            <MenuItem icon="bell" title="Уведомления" onPress={() => navigate('Notifications')} />
            <MenuItem icon="heart" title="Избранные вузы" onPress={() => navigate('FavoriteUniversities')} />
            <MenuItem icon="globe" title="Открыть сайт" onPress={() => openUrl(OFFICIAL_SITE_URL)} />
            <MenuItem icon="services" title="Настройки" onPress={() => navigate('Settings')} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerApp}>{APP_NAME}</Text>
            <Text style={styles.version}>Версия {APP_VERSION}</Text>
            <Pressable onPress={() => openUrl(PRIVACY_POLICY_URL)}>
              <Text style={styles.footerLink}>Политика конфиденциальности</Text>
            </Pressable>
            <Pressable onPress={() => openUrl(COMPANY_APPS_URL)}>
              <Text style={styles.footerLink}>Ещё приложения компании</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MenuItem({ icon, title, onPress }: { icon: SvgIconName; title: string; onPress: () => void }) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <View style={styles.itemIcon}>
        <SvgIcon name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.itemText}>{title}</Text>
      <SvgIcon name="chevronRight" size={18} color={colors.mutedLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  panel: {
    width: 312,
    height: '100%',
    backgroundColor: colors.white,
    paddingTop: 26,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  logo: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: typography.weights.heavy,
  },
  logoSub: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: typography.weights.bold,
    marginTop: 3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuList: {
    gap: spacing.xs,
  },
  item: {
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: typography.weights.bold,
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  footerApp: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
  },
  version: {
    color: colors.mutedLight,
    fontSize: typography.small,
    fontWeight: typography.weights.bold,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: typography.weights.heavy,
  },
});
