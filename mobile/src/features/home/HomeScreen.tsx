import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { educationCatalogApi } from '../../api/educationCatalog';
import { bannerImages } from '../../assets/banners';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { BannerSlider } from '../../components/BannerSlider';
import { CachedImage } from '../../components/CachedImage';
import { CTASection } from '../../components/CTASection';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { Country } from '../../types/api';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 18;
const QUICK_GAP = spacing.sm;
const COUNTRY_CARD_WIDTH = Math.min(width - SCREEN_PADDING * 2, 420);
const QUICK_COLUMNS = width < 360 ? 1 : 2;
const QUICK_CARD_WIDTH =
  QUICK_COLUMNS === 1
    ? width - SCREEN_PADDING * 2
    : Math.floor((width - SCREEN_PADDING * 2 - QUICK_GAP) / 2);

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const countriesQuery = useQuery({
    queryKey: ['catalog', 'countries', 'home'],
    queryFn: () => educationCatalogApi.getCountries(),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
  });
  const countries = countriesQuery.data || [];

  return (
    <Screen
      scroll
      style={styles.screen}
      refreshing={countriesQuery.isRefetching}
      onRefresh={() => countriesQuery.refetch()}
    >
      <RedGradientHero backgroundImage={bannerImages.home} style={styles.hero}>
        <Text style={styles.heroTitle}>Поступление за границу начинается с понятного выбора</Text>
        <Text style={styles.heroText}>
          Сравните страны, города, вузы и программы из актуального каталога и оставьте заявку менеджеру Student's Life.
        </Text>
        <View style={styles.heroActions}>
          <AppButton title="Посмотреть вузы" onPress={() => navigation.navigate('Universities')} />
          <AppButton
            title="Список вузов 2026–2027"
            variant="secondary"
            onPress={() => navigation.navigate('UniversityRankings')}
          />
          <AppButton
            title="Оставить заявку"
            variant="outline"
            onPress={() => navigation.navigate('ApplicationCreate')}
          />
        </View>
      </RedGradientHero>

      <View style={styles.statsRow}>
        <StatCard value="5+" label="лет опыта" />
        <StatCard value="1200+" label="студентов" />
        <StatCard value="24/7" label="поддержка" />
      </View>

      {isAuthenticated ? (
        <>
          <AppCard style={styles.documentsCard}>
            <View style={styles.documentsIcon}>
              <SvgIcon name="file" size={23} color={colors.secondary} />
            </View>
            <View style={styles.documentsTextBox}>
              <Text style={styles.documentsTitle}>Мои документы</Text>
              <Text style={styles.documentsText}>Загрузите документы для проверки менеджером</Text>
            </View>
            <AppButton
              title="Открыть документы"
              onPress={() => navigation.navigate('MyDocuments')}
              style={styles.documentsButton}
            />
          </AppCard>
          <AppCard style={styles.documentsCard}>
            <View style={styles.documentsIcon}>
              <SvgIcon name="application" size={23} color={colors.secondary} />
            </View>
            <View style={styles.documentsTextBox}>
              <Text style={styles.documentsTitle}>Анкета абитуриента</Text>
              <Text style={styles.documentsText}>Заполните данные для подготовки документов</Text>
            </View>
            <AppButton
              title="Открыть анкету"
              variant="outline"
              onPress={() => navigation.navigate('ApplicantQuestionnaire')}
              style={styles.documentsButton}
            />
          </AppCard>
        </>
      ) : null}

      <AppCard style={styles.schoolCard}>
        <View style={styles.documentsIcon}>
          <SvgIcon name="application" size={23} color={colors.secondary} />
        </View>
        <View style={styles.documentsTextBox}>
          <Text style={styles.documentsTitle}>Ещё учишься в школе?</Text>
          <Text style={styles.documentsText}>
            Ты можешь заранее оставить заявку на поступление. Мы подскажем, какие документы подготовить и когда лучше начать процесс.
          </Text>
        </View>
        <AppButton
          title="Оставить заявку заранее"
          variant="outline"
          onPress={() => navigation.navigate('ApplicantQuestionnaire', { formType: 'school_student' })}
          style={styles.documentsButton}
        />
      </AppCard>

      <SectionHeader
        eyebrow="Каталог"
        title="Страны для обучения"
        description="Откройте страну, чтобы увидеть города, вузы и доступные программы."
      />

      {countriesQuery.isLoading ? <LoadingSkeleton rows={2} height={190} /> : null}
      {countriesQuery.isError ? <ErrorState onAction={() => countriesQuery.refetch()} /> : null}
      {!countriesQuery.isLoading && !countriesQuery.isError && !countries.length ? (
        <EmptyState
          title="Страны пока не загрузились"
          description="Попробуйте обновить каталог или вернитесь немного позже."
          actionText="Обновить"
          onAction={() => countriesQuery.refetch()}
        />
      ) : null}
      {countries.length ? (
        <BannerSlider
          data={countries.slice(0, 6)}
          itemWidth={COUNTRY_CARD_WIDTH}
          itemSpacing={16}
          renderItem={country => (
            <CountryBanner
              country={country}
              onPress={() => navigation.navigate('CountryDetail', { id: country.id })}
            />
          )}
        />
      ) : null}

      <SectionHeader eyebrow="Поддержка" title="Полное сопровождение студента" />
      <View style={styles.grid}>
        <FeatureCard
          icon="search"
          title="Подбор"
          text="Сравниваем страны, программы, сроки и бюджет без лишней путаницы."
        />
        <FeatureCard
          icon="document"
          title="Документы"
          text="Помогаем подготовить пакет для поступления и отправки в университет."
        />
        <FeatureCard icon="visa" title="Виза" text="Объясняем этапы, сроки и список документов." />
        <FeatureCard
          icon="chat"
          title="Связь"
          text="В личном кабинете доступны заявки, история обращений и чат."
        />
      </View>

      <SectionHeader eyebrow="Быстрые действия" title="Что нужно студенту" />
      <View style={styles.serviceGrid}>
        <QuickService icon="university" title="Вузы" onPress={() => navigation.navigate('Universities')} />
        <QuickService
          icon="document"
          title="Список вузов 2026–2027"
          onPress={() => navigation.navigate('UniversityRankings')}
        />
        <QuickService
          icon="application"
          title="Поступить"
          onPress={() => navigation.navigate('AdmissionInfo')}
        />
        <QuickService icon="visa" title="Виза" onPress={() => navigation.navigate('VisaInfo')} />
        <QuickService icon="mapPin" title="Туры" onPress={() => navigation.navigate('ToursInfo')} />
      </View>

      <AppCard style={styles.registerCard}>
        <Badge label="Личный кабинет" variant="mint" icon="check" />
        <Text style={styles.registerTitle}>Аккаунт ускоряет оформление</Text>
        <Text style={styles.registerText}>
          Зарегистрированные клиенты видят историю заявок, чаты, персональные предложения и скидки
          в одном месте.
        </Text>
      </AppCard>

      <CTASection
        eyebrow="Связь с менеджером"
        title="Напишите нам, если нужна консультация"
        description="Расскажите, куда хотите поступить. Менеджер подскажет ближайшие шаги и документы."
        primaryText="Открыть чат"
        onPrimaryPress={() => navigation.navigate('Chat')}
        secondaryText="Оставить заявку"
        onSecondaryPress={() => navigation.navigate('ApplicationCreate')}
      />
    </Screen>
  );
}

function CountryBanner({ country, onPress }: { country: Country; onPress: () => void }) {
  const imageUrl = country.cover_image || country.flag;

  return (
    <AnimatedPressable style={styles.countryCard} onPress={onPress}>
      {imageUrl ? <CachedImage uri={imageUrl} style={styles.countryImage} resizeMode="cover" /> : null}
      <View style={styles.countryShade} />
      <View style={styles.countryContent}>
        <View style={styles.countryIcon}>
          {country.flag ? (
            <CachedImage uri={country.flag} style={styles.flagImage} resizeMode="cover" />
          ) : (
            <SvgIcon name="globe" size={22} color={colors.primary} />
          )}
        </View>
        <Text style={styles.countryName}>{country.name}</Text>
        <Text style={styles.countryMeta}>
          {country.cities_count || 0} городов · {country.universities_count || 0} вузов
        </Text>
        <Text style={styles.countryLink}>Открыть страну</Text>
      </View>
    </AnimatedPressable>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <AppCard style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </AppCard>
  );
}

function FeatureCard({ icon, title, text }: { icon: SvgIconName; title: string; text: string }) {
  return (
    <AppCard style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <SvgIcon name={icon} size={22} color={colors.secondary} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </AppCard>
  );
}

function QuickService({ icon, title, onPress }: { icon: SvgIconName; title: string; onPress: () => void }) {
  return (
    <AnimatedPressable style={[styles.quickService, { width: QUICK_CARD_WIDTH }]} onPress={onPress}>
      <View style={styles.quickServiceIcon}>
        <SvgIcon name={icon} size={22} color={colors.secondary} />
      </View>
      <Text style={styles.quickServiceText}>{title}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 350, marginBottom: spacing.lg },
  heroTitle: {
    color: colors.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.lg,
  },
  heroText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  heroActions: { gap: spacing.sm, marginTop: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.md },
  statValue: { color: colors.secondary, fontSize: 22, fontWeight: typography.weights.heavy },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: typography.weights.bold, marginTop: 4 },
  documentsCard: {
    marginBottom: spacing.lg,
    borderColor: 'rgba(13,65,109,0.14)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  schoolCard: {
    marginBottom: spacing.lg,
    borderColor: 'rgba(184,32,26,0.16)',
    backgroundColor: colors.card,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  documentsIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(13,65,109,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentsTextBox: { flex: 1, minWidth: 0 },
  documentsTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  documentsText: { color: colors.muted, lineHeight: 20, marginTop: 3, fontWeight: typography.weights.medium },
  documentsButton: { width: '100%' },
  countryCard: {
    width: COUNTRY_CARD_WIDTH,
    minHeight: 190,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
    overflow: 'hidden',
    ...shadows.card,
  },
  countryImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  countryShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(76,17,17,0.48)' },
  countryContent: { flex: 1, padding: spacing.lg, justifyContent: 'flex-end' },
  countryIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  flagImage: { width: '100%', height: '100%' },
  countryName: { color: colors.white, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  countryMeta: { color: 'rgba(255,255,255,0.88)', marginTop: spacing.xs, fontWeight: typography.weights.bold },
  countryLink: { color: colors.white, marginTop: spacing.md, fontWeight: typography.weights.heavy },
  grid: { gap: spacing.sm },
  featureCard: { minHeight: 126 },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(13,65,109,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy },
  featureText: { color: colors.muted, lineHeight: 20, marginTop: 4, fontWeight: typography.weights.medium },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: QUICK_GAP },
  quickService: {
    minHeight: 124,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  quickServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(13,65,109,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickServiceText: { color: colors.text, fontWeight: typography.weights.heavy, textAlign: 'center' },
  registerCard: { marginTop: spacing.xl },
  registerTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.md,
  },
  registerText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },
});
