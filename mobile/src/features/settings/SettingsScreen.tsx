import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { QUERY_CACHE_STORAGE_KEY, queryClient } from '../../api/queryClient';
import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import {
  ORIGINAL_MANAGER_SL_API_URL,
  ORIGINAL_STUDENT_LIFE_API_URL,
  PROXY_MANAGER_SL_API_URL,
  PROXY_STUDENT_LIFE_API_URL,
  APP_NAME,
  APP_VERSION,
  PRIVACY_POLICY_URL,
} from '../../constants/config';
import { colors, radius, spacing, typography } from '../../constants/colors';
import {
  API_ENDPOINT_OPTIONS,
  ApiEndpointMode,
  getApiEndpointMode,
  setApiEndpointMode,
} from '../../utils/apiProxySettings';

export function SettingsScreen() {
  const [clearing, setClearing] = useState(false);
  const [endpointMode, setEndpointMode] = useState<ApiEndpointMode>('proxy');

  useEffect(() => {
    getApiEndpointMode().then(setEndpointMode).catch(() => setEndpointMode('proxy'));
  }, []);

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

  const changeEndpointMode = async (mode: ApiEndpointMode) => {
    if (mode === endpointMode) return;
    await setApiEndpointMode(mode);
    setEndpointMode(mode);
    queryClient.clear();
    await AsyncStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
    Alert.alert(
      'Источник API изменён',
      mode === 'proxy'
        ? 'Теперь приложение использует прокси students-life.ru без VPN.'
        : 'Теперь приложение использует оригинальные серверы напрямую.',
    );
  };

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero backgroundImage={bannerImages.settings} style={styles.hero}>
        <Text style={styles.title}>Настройки приложения</Text>
        <Text style={styles.subtitle}>Кэш, язык, тема и полезные ссылки в одном месте.</Text>
      </RedGradientHero>

      <SettingsBlock
        icon="services"
        title="Источник API"
        text="По умолчанию используется прокси students-life.ru, чтобы приложение работало без VPN. При необходимости можно переключиться на оригинальные серверы."
      >
        <View style={styles.endpointOptions}>
          {API_ENDPOINT_OPTIONS.map(option => {
            const selected = endpointMode === option.mode;
            return (
              <Pressable
                key={option.mode}
                onPress={() => changeEndpointMode(option.mode)}
                style={[styles.endpointOption, selected && styles.endpointOptionSelected]}
              >
                <View style={styles.endpointOptionHeader}>
                  <Text style={[styles.endpointTitle, selected && styles.endpointTitleSelected]}>{option.title}</Text>
                  {selected ? <Badge label="Активно" variant="mint" icon="check" /> : null}
                </View>
                <Text style={styles.endpointDescription}>{option.description}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.endpointUrls}>
          <Text style={styles.endpointUrl}>Manager SL proxy: {PROXY_MANAGER_SL_API_URL}</Text>
          <Text style={styles.endpointUrl}>Student’s Life proxy: {PROXY_STUDENT_LIFE_API_URL}</Text>
          <Text style={styles.endpointUrl}>Manager SL original: {ORIGINAL_MANAGER_SL_API_URL}</Text>
          <Text style={styles.endpointUrl}>Student’s Life original: {ORIGINAL_STUDENT_LIFE_API_URL}</Text>
        </View>
      </SettingsBlock>

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

      <SettingsBlock
        icon="lock"
        title="Конфиденциальность"
        text="Политика описывает регистрацию, заявки, чат, push-уведомления и улучшение сервиса."
      >
        <AppButton title="Открыть политику" variant="outline" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
      </SettingsBlock>

      <AppCard style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>{APP_NAME}</Text>
        <Text style={styles.aboutText}>Версия {APP_VERSION}</Text>
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
          <SvgIcon name={icon} size={22} color={colors.secondary} />
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
  hero: { minHeight: 250, marginBottom: spacing.lg },
  title: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: typography.weights.heavy,
  },
  subtitle: { color: 'rgba(255,255,255,0.92)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  block: { marginBottom: spacing.md },
  blockHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(13,65,109,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockTextBox: { flex: 1 },
  blockTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  blockText: { color: colors.muted, lineHeight: 22, marginTop: 4, fontWeight: typography.weights.medium },
  blockAction: { marginTop: spacing.lg },
  endpointOptions: { gap: spacing.sm },
  endpointOption: {
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.1)',
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  endpointOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(184,32,26,0.06)',
  },
  endpointOptionHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endpointTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weights.heavy,
  },
  endpointTitleSelected: { color: colors.primary },
  endpointDescription: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  endpointUrls: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,23,42,0.08)',
    paddingTop: spacing.sm,
    gap: 4,
  },
  endpointUrl: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: typography.weights.medium,
  },
  aboutCard: { marginTop: spacing.md },
  aboutTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  aboutText: { color: colors.muted, lineHeight: 22, marginTop: spacing.xs, fontWeight: typography.weights.medium },
});
