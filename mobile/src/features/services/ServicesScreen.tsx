import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { contentApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { CTASection } from '../../components/CTASection';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { ServiceCard } from '../../components/ServiceCard';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';

export function ServicesScreen() {
  const navigation = useNavigation<any>();

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: contentApi.getServices,
  });

  const openVisa = () => {
    const visaService = servicesQuery.data?.find(item => item.title.toLowerCase().includes('виз'));

    if (visaService) {
      navigation.navigate('ServiceDetail', { slug: visaService.slug });
      return;
    }

    Alert.alert('Услуга пока не найдена', 'Оставьте заявку, и менеджер подскажет по визовому сопровождению.');
  };

  return (
    <Screen scroll style={styles.screen}>
      <View style={[styles.hero, shadows.premium]}>
        <View style={styles.glowBlue} />
        <View style={styles.glowCoral} />
        <Text style={styles.kicker}>Student’s Life Services</Text>
        <Text style={styles.title}>Услуги, которые помогают поступить без хаоса</Text>
        <Text style={styles.description}>Поступление, визы, документы, сопровождение и консультации собраны в одном понятном сценарии.</Text>
        <View style={styles.heroActions}>
          <AppButton title="Оставить заявку" onPress={() => navigation.navigate('ApplicationCreate')} />
          <AppButton title="Посмотреть вузы" variant="outline" onPress={() => navigation.navigate('Universities')} />
        </View>
      </View>

      <SectionHeader eyebrow="Быстрый выбор" title="Основные направления" />
      <View style={styles.mainGrid}>
        <ServiceActionCard icon="university" title="Вузы" subtitle="Каталог университетов, стран и программ." onPress={() => navigation.navigate('Universities')} />
        <ServiceActionCard icon="application" title="Поступить" subtitle="Заполните заявку, менеджер свяжется с вами." onPress={() => navigation.navigate('ApplicationCreate')} />
        <ServiceActionCard icon="visa" title="Виза" subtitle="Поддержка с приглашением, документами и визой." onPress={openVisa} />
      </View>

      <AppCard style={styles.includesCard}>
        <Text style={styles.includesTitle}>Что обычно входит в поддержку</Text>
        <InfoLine icon="check" text="подбор страны, вуза и программы" />
        <InfoLine icon="document" text="проверка документов и анкеты" />
        <InfoLine icon="calendar" text="сроки, этапы и напоминания" />
        <InfoLine icon="chat" text="связь с менеджером по вопросам студента" />
      </AppCard>

      <SectionHeader eyebrow="Каталог" title="Все услуги" description="Карточки услуг выглядят как продающие блоки, но сохраняют текущую API-логику." />
      {servicesQuery.isLoading ? <LoadingSkeleton rows={3} /> : null}
      {servicesQuery.isError ? <ErrorState onAction={() => servicesQuery.refetch()} /> : null}
      {!servicesQuery.isLoading && !servicesQuery.isError ? (
        <View style={styles.servicesList}>
          {(servicesQuery.data || []).map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onPress={() => navigation.navigate('ServiceDetail', { slug: service.slug })}
              onApplyPress={() => navigation.navigate('ApplicationCreate', { serviceId: service.id })}
            />
          ))}
        </View>
      ) : null}

      <CTASection
        eyebrow="Консультация"
        title="Не знаете, с чего начать?"
        description="Оставьте заявку: менеджер объяснит документы, сроки, стоимость и ближайшие шаги."
        primaryText="Оставить заявку"
        onPrimaryPress={() => navigation.navigate('ApplicationCreate')}
        secondaryText="Открыть чат"
        onSecondaryPress={() => navigation.navigate('Chat')}
      />
    </Screen>
  );
}

function ServiceActionCard({ icon, title, subtitle, onPress }: { icon: SvgIconName; title: string; subtitle: string; onPress: () => void }) {
  return (
    <AppCard style={styles.actionCard}>
      <View style={styles.actionTop}>
        <View style={styles.actionIcon}><SvgIcon name={icon} size={26} color={colors.primary} /></View>
        <AppButton title="Перейти" variant="ghost" onPress={onPress} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionText}>{subtitle}</Text>
    </AppCard>
  );
}

function InfoLine({ icon, text }: { icon: SvgIconName; text: string }) {
  return (
    <View style={styles.infoLine}>
      <SvgIcon name={icon} size={17} color={colors.success} />
      <Text style={styles.infoLineText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  hero: {
    minHeight: 320,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryDark,
    padding: spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  glowBlue: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primary,
    top: -105,
    right: -95,
    opacity: 0.68,
  },
  glowCoral: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.accent,
    left: -90,
    bottom: -96,
    opacity: 0.24,
  },
  kicker: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: typography.tiny,
    fontWeight: typography.weights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.sm,
  },
  description: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  heroActions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  mainGrid: {
    gap: spacing.sm,
  },
  actionCard: {
    minHeight: 150,
  },
  actionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.md,
  },
  actionText: {
    color: colors.muted,
    lineHeight: 21,
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  includesCard: {
    marginTop: spacing.xl,
  },
  includesTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
    marginBottom: spacing.md,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  infoLineText: {
    flex: 1,
    color: colors.muted,
    fontWeight: typography.weights.bold,
  },
  servicesList: {
    gap: spacing.md,
  },
});
