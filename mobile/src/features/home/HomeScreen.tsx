import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { educationCatalogApi } from '../../api/educationCatalog';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { CTASection } from '../../components/CTASection';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { Country } from '../../types/api';

const { width } = Dimensions.get('window');
const COUNTRY_CARD_WIDTH = Math.min(width * 0.72, 290);

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const countriesQuery = useQuery({ queryKey: ['home-countries'], queryFn: () => educationCatalogApi.getCountries() });
  const countries = countriesQuery.data || [];

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero style={styles.hero}>
        <Badge label="Student’s Life" variant="mint" />
        <Text style={styles.heroTitle}>Поступление за границу начинается с выбора страны</Text>
        <Text style={styles.heroText}>Каталог стран, городов, вузов и программ загружается из актуальной базы.</Text>
        <View style={styles.heroActions}>
          <AppButton title="Посмотреть вузы" onPress={() => navigation.navigate('Universities')} />
          <AppButton title="Оставить заявку" variant="outline" onPress={() => navigation.navigate('ApplicationCreate')} />
        </View>
      </RedGradientHero>

      <View style={styles.statsRow}><StatCard value="5+" label="лет опыта" /><StatCard value="1200+" label="студентов" /><StatCard value="24/7" label="поддержка" /></View>

      <SectionHeader eyebrow="Направления" title="Страны в каталоге" description="Выберите страну, затем город, вуз и программу." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countrySlider}>
        {countries.map(country => <CountryCard key={country.id} country={country} onPress={() => navigation.navigate('CountryDetail', { id: country.id })} />)}
      </ScrollView>

      <SectionHeader eyebrow="Преимущества" title="Полное сопровождение студента" />
      <View style={styles.grid}>
        <FeatureCard icon="search" title="Подбор" text="Сравниваем страны, программы, сроки и бюджет." />
        <FeatureCard icon="document" title="Документы" text="Помогаем подготовить пакет для подачи." />
        <FeatureCard icon="visa" title="Виза" text="Объясняем этапы и контролируем сроки." />
        <FeatureCard icon="chat" title="Поддержка" text="Поддерживаем после приезда и адаптации." />
      </View>

      <SectionHeader eyebrow="Услуги" title="Быстрые действия" />
      <View style={styles.serviceGrid}>
        <QuickService icon="university" title="Вузы" onPress={() => navigation.navigate('Universities')} />
        <QuickService icon="application" title="Поступить" onPress={() => navigation.navigate('ApplicationCreate')} />
        <QuickService icon="visa" title="Виза" onPress={() => navigation.navigate('Services')} />
        <QuickService icon="mapPin" title="Туры" onPress={() => navigation.navigate('Services')} />
      </View>

      <AppCard style={styles.registerCard}><Badge label="Личный кабинет" variant="mint" icon="check" /><Text style={styles.registerTitle}>Аккаунт ускоряет оформление</Text><Text style={styles.registerText}>Сохраняйте заявки, чаты, избранные вузы и персональные предложения в одном месте.</Text></AppCard>

      <CTASection eyebrow="Связь с менеджером" title="Напишите нам — менеджер ответит" description="Расскажите, куда хотите поступить. Мы подскажем ближайшие шаги и документы." primaryText="Открыть чат" onPrimaryPress={() => navigation.navigate('Chat')} secondaryText="Оставить заявку" onSecondaryPress={() => navigation.navigate('ApplicationCreate')} />
    </Screen>
  );
}

function CountryCard({ country, onPress }: { country: Country; onPress: () => void }) { return <AnimatedPressable style={styles.countryCard} onPress={onPress}><View style={styles.countryIcon}><SvgIcon name="globe" size={24} color="#B91C1C" /></View><Text style={styles.countryName}>{country.name}</Text><Text style={styles.countryMeta}>{(country as any).cities_count || 0} городов · {(country as any).universities_count || 0} вузов</Text><Text style={styles.countryLink}>Открыть страну</Text></AnimatedPressable>; }
function StatCard({ value, label }: { value: string; label: string }) { return <AppCard style={styles.statCard}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></AppCard>; }
function FeatureCard({ icon, title, text }: { icon: SvgIconName; title: string; text: string }) { return <AppCard style={styles.featureCard}><View style={styles.featureIcon}><SvgIcon name={icon} size={22} color="#B91C1C" /></View><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureText}>{text}</Text></AppCard>; }
function QuickService({ icon, title, onPress }: { icon: SvgIconName; title: string; onPress: () => void }) { return <AnimatedPressable style={styles.quickService} onPress={onPress}><View style={styles.quickServiceIcon}><SvgIcon name={icon} size={22} color="#B91C1C" /></View><Text style={styles.quickServiceText}>{title}</Text></AnimatedPressable>; }

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FEF7F5' },
  hero: { minHeight: 360, marginBottom: spacing.lg },
  heroTitle: { color: colors.white, fontSize: 34, lineHeight: 40, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  heroText: { color: 'rgba(255,255,255,0.92)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  heroActions: { gap: spacing.sm, marginTop: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.md, borderColor: '#FFE2E2' },
  statValue: { color: '#B91C1C', fontSize: 22, fontWeight: typography.weights.heavy },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: typography.weights.bold, marginTop: 4 },
  countrySlider: { marginHorizontal: -20, paddingHorizontal: 20 },
  countryCard: { width: COUNTRY_CARD_WIDTH, minHeight: 160, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: '#FFDDDD', padding: spacing.lg, marginRight: spacing.md, ...shadows.soft },
  countryIcon: { width: 52, height: 52, borderRadius: 20, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  countryName: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  countryMeta: { color: colors.muted, marginTop: spacing.xs, fontWeight: typography.weights.bold },
  countryLink: { color: '#B91C1C', marginTop: spacing.md, fontWeight: typography.weights.heavy },
  grid: { gap: spacing.sm },
  featureCard: { minHeight: 132, borderColor: '#FFE2E2' },
  featureIcon: { width: 46, height: 46, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  featureTitle: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy },
  featureText: { color: colors.muted, lineHeight: 20, marginTop: 4, fontWeight: typography.weights.medium },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickService: { width: '48%', minHeight: 112, borderRadius: radius.xl, padding: spacing.md, backgroundColor: colors.card, borderWidth: 1, borderColor: '#FAD7D7', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  quickServiceIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  quickServiceText: { color: colors.text, fontWeight: typography.weights.heavy, textAlign: 'center' },
  registerCard: { marginTop: spacing.xl, borderColor: '#FFE2E2' },
  registerTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  registerText: { color: colors.muted, fontSize: typography.body, lineHeight: 23, marginTop: spacing.xs, fontWeight: typography.weights.medium },
});
