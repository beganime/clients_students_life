import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { QUERY_CACHE_STORAGE_KEY, queryClient } from '../../api/queryClient';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import {
  APP_NAME,
  APP_VERSION,
  MANAGER_SL_API_BASE_URL,
  PRIVACY_POLICY_URL,
} from '../../constants/config';
import { colors, radius, spacing, typography } from '../../constants/colors';

export function SettingsScreen() {
  const [clearing, setClearing] = useState(false);

  const clearCatalogCache = async () => {
    try {
      setClearing(true);
      queryClient.removeQueries({ queryKey: ['catalog'] });
      await AsyncStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
      Alert.alert('Кэш очищен', 'Каталог обновится при следующем открытии экранов.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero style={styles.hero}>
        <Badge label="Настройки" variant="mint" icon="check" />
        <Text style={styles.title}>Управление приложением</Text>
        <Text style={styles.subtitle}>Кэш, язык, тема и полезные ссылки в одном месте.</Text>
      </RedGradientHero>

      <SettingsBlock
        icon="file"
        title="Хранилище"
        text="Можно безопасно очистить кэш каталога. Токены входа и профиль пользователя не удаляются."
      >
        <AppButton
          title="Очистить кэш каталога"
          variant="outline"
          onPress={clearCatalogCache}
          loading={clearing}
        />
      </SettingsBlock>

      <SettingsBlock
        icon="language"
        title="Язык"
        text="Сейчас доступен русский язык. Интерфейс подготовлен к добавлению других языков."
      >
        <Badge label="Русский" variant="neutral" icon="check" />
      </SettingsBlock>

      <SettingsBlock
        icon="services"
        title="Тема"
        text="Сейчас используется светлая тема. Структура настроек готова к будущей тёмной теме."
      >
        <Badge label="Светлая" variant="neutral" icon="check" />
      </SettingsBlock>

      <SettingsBlock icon="lock" title="Конфиденциальность" text="Политика описывает регистрацию, заявки, чат, push-уведомления и улучшение сервиса.">
        <AppButton title="Открыть политику" variant="outline" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
      </SettingsBlock>

      <AppCard style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>{APP_NAME}</Text>
        <Text style={styles.aboutText}>Версия {APP_VERSION}</Text>
        <Text style={styles.aboutText}>Каталог: {MANAGER_SL_API_BASE_URL}</Text>
      </AppCard>
    </Screen>
  );
}

function SettingsBlock({
  icon,
  title,
  text,
  children,
}: {
  icon: SvgIconName;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <AppCard style={styles.block}>
      <View style={styles.blockHeader}>
        <View style={styles.iconBox}>
          <SvgIcon name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.blockTextBox}>
          <Text style={styles.blockTitle}>{title}</Text>
          <Text style={styles.blockText}>{text}</Text>
        </View>
      </View>
      {children ? <View style={styles.blockAction}>{children}</View> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 230, marginBottom: spacing.lg },
  title: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.md,
  },
  subtitle: { color: 'rgba(255,255,255,0.92)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  block: { marginBottom: spacing.md },
  blockHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockTextBox: { flex: 1 },
  blockTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  blockText: { color: colors.muted, lineHeight: 22, marginTop: 4, fontWeight: typography.weights.medium },
  blockAction: { marginTop: spacing.lg },
  aboutCard: { marginTop: spacing.md },
  aboutTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  aboutText: { color: colors.muted, lineHeight: 22, marginTop: spacing.xs, fontWeight: typography.weights.medium },
});
