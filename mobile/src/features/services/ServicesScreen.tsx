import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { contentApi } from '../../api/endpoints';
import { bannerImages } from '../../assets/banners';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { CTASection } from '../../components/CTASection';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 18;
const CARD_GAP = spacing.sm;
const SERVICE_COLUMNS = width < 380 ? 1 : 2;
const SERVICE_CARD_WIDTH =
  SERVICE_COLUMNS === 1
    ? width - SCREEN_PADDING * 2
    : Math.floor((width - SCREEN_PADDING * 2 - CARD_GAP) / 2);

export function ServicesScreen() {
  const navigation = useNavigation<any>();

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: contentApi.getServices,
  });

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero backgroundImage={bannerImages.services} style={styles.hero}>
        <Text style={styles.kicker}>Услуги</Text>
        <Text style={styles.title}>Полный цикл поддержки студента</Text>
        <Text style={styles.description}>
          Каталог вузов, заявка на поступление, визовая поддержка и ознакомительные туры в одном
          аккуратном сценарии.
        </Text>
        <View style={styles.heroActions}>
          <AppButton title="Оставить заявку" onPress={() => navigation.navigate('ApplicationCreate')} />
          <AppButton title="Посмотреть вузы" variant="outline" onPress={() => navigation.navigate('Universities')} />
        </View>
      </RedGradientHero>

      <SectionHeader eyebrow="Быстрый выбор" title="Основные услуги" />
      <View style={styles.mainGrid}>
        <ServiceActionCard icon="university" title="Вузы" subtitle="Каталог университетов" onPress={() => navigation.navigate('Universities')} />
        <ServiceActionCard icon="application" title="Поступить" subtitle="Заявка менеджеру" onPress={() => navigation.navigate('ApplicationCreate')} />
        <ServiceActionCard icon="visa" title="Виза" subtitle="Документы и сроки" onPress={() => navigation.navigate('VisaInfo')} />
        <ServiceActionCard icon="mapPin" title="Туры" subtitle="Ознакомительные поездки" onPress={() => navigation.navigate('ToursInfo')} />
      </View>

      <AppCard style={styles.includesCard}>
        <Text style={styles.includesTitle}>Что обычно входит в сопровождение</Text>
        <InfoLine icon="check" text="подбор страны, вуза и программы" />
        <InfoLine icon="document" text="проверка документов и анкеты" />
        <InfoLine icon="calendar" text="сроки, этапы и напоминания" />
        <InfoLine icon="chat" text="связь с менеджером по вопросам студента" />
      </AppCard>

      <SectionHeader
        eyebrow="Каталог"
        title="Дополнительные услуги"
        description="Если услуга уже есть в базе, карточка откроет детальную страницу или заявку."
      />
      {servicesQuery.isLoading ? <LoadingSkeleton rows={3} height={120} /> : null}
      {servicesQuery.isError ? <ErrorState onAction={() => servicesQuery.refetch()} /> : null}
      {!servicesQuery.isLoading && !servicesQuery.isError ? (
        <View style={styles.servicesList}>
          {(servicesQuery.data || []).map(service => (
            <AppCard key={service.id} style={styles.servicePageCard}>
              <View style={styles.serviceTitleRow}>
                <View style={styles.serviceSmallIcon}>
                  <SvgIcon name="services" size={23} color={colors.secondary} />
                </View>
                <Text style={styles.serviceTitle}>{service.title}</Text>
              </View>
              <Text style={styles.serviceText} numberOfLines={3}>
                {service.short_description || "Подробнее об услуге Student's Life."}
              </Text>
              <View style={styles.serviceButtons}>
                <AppButton title="Подробнее" variant="outline" onPress={() => navigation.navigate('ServiceDetail', { slug: service.slug })} />
                <AppButton title="Заявка" variant="ghost" onPress={() => navigation.navigate('ApplicationCreate', { serviceId: service.id })} />
              </View>
            </AppCard>
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
    <AnimatedPressable style={[styles.actionCard, { width: SERVICE_CARD_WIDTH }, shadows.soft]} onPress={onPress}>
      <View style={styles.actionIcon}>
        <SvgIcon name={icon} size={27} color={colors.secondary} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionText}>{subtitle}</Text>
    </AnimatedPressable>
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
    minHeight: 280,
    marginBottom: spacing.lg,
  },
  kicker: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: typography.tiny,
    fontWeight: typography.weights.heavy,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.sm,
  },
  description: {
    color: 'rgba(255,255,255,0.92)',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  actionCard: {
    minHeight: 132,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: 'rgba(13,65,109,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  actionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
    textAlign: 'center',
  },
  actionText: {
    color: colors.muted,
    lineHeight: 19,
    marginTop: spacing.xs,
    fontSize: typography.small,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
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
  servicePageCard: {
    gap: spacing.md,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  serviceSmallIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(13,65,109,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
  },
  serviceText: {
    color: colors.muted,
    lineHeight: 21,
    marginTop: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  serviceButtons: {
    gap: spacing.sm,
  },
});
