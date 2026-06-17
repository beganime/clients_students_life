import React, { useMemo } from 'react';
import { Dimensions, Linking, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { commonApi, contentApi } from '../../api/endpoints';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { BannerSlider } from '../../components/BannerSlider';
import { CTASection } from '../../components/CTASection';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { StepperBlock } from '../../components/StepperBlock';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { HomeBanner, OfficeContact } from '../../types/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 40, 760);

const fallbackHeroBanners: HomeBanner[] = [
  {
    id: -1,
    slot: 'hero',
    title: 'Создай своё будущее',
    subtitle: 'Student’s Life',
    description: 'Поступление, виза, жильё и сопровождение студентов в России, Европе и Азии.',
    badge: 'Международное образование',
    cta_text: 'Подать заявку',
    cta_type: 'application',
  },
  {
    id: -2,
    slot: 'hero',
    title: 'Каталог вузов, стран и программ',
    subtitle: 'Подбор под цель студента',
    description: 'Смотрите направления, стоимость, языки обучения, общежитие и партнёрские университеты.',
    badge: 'Каталог',
    cta_text: 'Посмотреть вузы',
    cta_type: 'universities',
  },
];

const fallbackDirections = ['Россия', 'Турция', 'Китай', 'Беларусь', 'Кипр', 'Европа'];

const workSteps = [
  { title: 'Консультация', description: 'Уточняем цель, страну, бюджет и сроки.' },
  { title: 'Подбор программы', description: 'Предлагаем подходящие университеты и направления.' },
  { title: 'Документы', description: 'Проверяем анкету, переводы и пакет для подачи.' },
  { title: 'Приглашение', description: 'Сопровождаем до получения официального приглашения.' },
  { title: 'Виза', description: 'Помогаем пройти визовый этап без лишней путаницы.' },
  { title: 'Приезд и адаптация', description: 'Поддерживаем с жильём, связью и первыми шагами.' },
];

export function HomeScreen() {
  const navigation = useNavigation<any>();

  const homeQuery = useQuery({ queryKey: ['home-content'], queryFn: commonApi.getHomeContent, retry: 1 });
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: contentApi.getServices });
  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: contentApi.getCountries });

  const heroBanners = useMemo(() => {
    const items = homeQuery.data?.hero_banners?.filter(Boolean) || [];
    return items.length ? items.slice(0, 3) : fallbackHeroBanners;
  }, [homeQuery.data]);

  const services = servicesQuery.data || [];
  const contacts = homeQuery.data?.contacts || [];

  const openBanner = (banner: HomeBanner) => {
    if (banner.cta_type === 'application') navigation.navigate('ApplicationCreate');
    if (banner.cta_type === 'universities') navigation.navigate('Universities');
    if (banner.cta_type === 'service') banner.linked_service_slug ? navigation.navigate('ServiceDetail', { slug: banner.linked_service_slug }) : navigation.navigate('Services');
    if (banner.cta_type === 'university') banner.linked_university_slug ? navigation.navigate('UniversityDetail', { slug: banner.linked_university_slug }) : navigation.navigate('Universities');
    if (banner.cta_type === 'news') banner.linked_news_slug ? navigation.navigate('NewsDetail', { slug: banner.linked_news_slug }) : navigation.navigate('News');
    if (banner.cta_type === 'url' && banner.cta_url) Linking.openURL(banner.cta_url);
  };

  return (
    <Screen scroll style={styles.screen}>
      <BannerSlider
        data={heroBanners}
        itemWidth={CARD_WIDTH}
        showArrows={false}
        renderItem={item => <PremiumHero banner={item} onPress={() => openBanner(item)} onUniversitiesPress={() => navigation.navigate('Universities')} />}
      />

      <View style={styles.statsRow}>
        <StatCard value="5+" label="лет опыта" />
        <StatCard value="1200+" label="студентов" />
        <StatCard value="24/7" label="поддержка" />
      </View>

      <SectionHeader eyebrow="Преимущества" title="Полное сопровождение студента" />
      <View style={styles.grid}>
        <FeatureCard icon="search" title="Подбор университета" text="Сравниваем страны, программы, сроки и бюджет." />
        <FeatureCard icon="document" title="Документы и заявка" text="Помогаем подготовить пакет для подачи." />
        <FeatureCard icon="visa" title="Виза и приглашение" text="Объясняем этапы и контролируем сроки." />
        <FeatureCard icon="chat" title="После приезда" text="Поддерживаем с адаптацией и вопросами." />
      </View>

      <SectionHeader eyebrow="Направления" title="Популярные страны" />
      <View style={styles.directionRow}>
        {(countriesQuery.data?.length ? countriesQuery.data.slice(0, 6).map(item => item.name) : fallbackDirections).map(name => (
          <AnimatedPressable key={name} style={styles.directionPill} onPress={() => navigation.navigate('Universities')}>
            <SvgIcon name="globe" size={15} color="#B91C1C" />
            <Text style={styles.directionText}>{name}</Text>
          </AnimatedPressable>
        ))}
      </View>

      <SectionHeader eyebrow="Процесс" title="Как мы работаем" description="Понятный путь от первой консультации до приезда студента." />
      <StepperBlock steps={workSteps} />

      <SectionHeader eyebrow="Услуги" title="Комплексная поддержка" />
      <View style={styles.serviceGrid}>
        <QuickService icon="university" title="Вузы" onPress={() => navigation.navigate('Universities')} />
        <QuickService icon="application" title="Поступить" onPress={() => navigation.navigate('ApplicationCreate')} />
        <QuickService icon="visa" title="Виза" onPress={() => navigation.navigate('Services')} />
        <QuickService icon="mapPin" title="Туры" onPress={() => navigation.navigate('Services')} />
      </View>
      {services.slice(0, 3).map(service => (
        <AnimatedPressable key={service.id} style={styles.inlineService} onPress={() => navigation.navigate('ServiceDetail', { slug: service.slug })}>
          <Text style={styles.inlineServiceTitle}>{service.title}</Text>
          <Text style={styles.inlineServiceText} numberOfLines={2}>{service.short_description || 'Подробнее об услуге'}</Text>
        </AnimatedPressable>
      ))}

      <AppCard style={styles.registerCard}>
        <Badge label="Выгодно зарегистрироваться" variant="mint" icon="check" />
        <Text style={styles.registerTitle}>Аккаунт ускоряет оформление</Text>
        <Text style={styles.registerText}>Зарегистрированный пользователь может сохранять заявки, получать ответы менеджера, видеть историю обращений, получать персональные предложения и быстрее оформлять новые услуги.</Text>
      </AppCard>

      <CTASection
        eyebrow="Связь с менеджером"
        title="Напишите нам — менеджер ответит"
        description="Расскажите, куда хотите поступить. Мы подскажем ближайшие шаги и документы."
        primaryText="Открыть чат"
        onPrimaryPress={() => navigation.navigate('Chat')}
        secondaryText="Оставить заявку"
        onSecondaryPress={() => navigation.navigate('ApplicationCreate')}
      />

      <SectionHeader eyebrow="Контакты" title="Офисы и связь" />
      <ContactsBlock contacts={contacts} />
    </Screen>
  );
}

function PremiumHero({ banner, onPress, onUniversitiesPress }: { banner: HomeBanner; onPress: () => void; onUniversitiesPress: () => void }) {
  return (
    <View style={styles.heroWrap}>
      <RedGradientHero style={styles.hero}>
        <View style={styles.heroGlass}>
          {banner.badge ? <Badge label={banner.badge} variant="mint" /> : null}
          {banner.subtitle ? <Text style={styles.heroSubtitle}>{banner.subtitle}</Text> : null}
          <Text style={styles.heroTitle}>{banner.title}</Text>
          {banner.description ? <Text style={styles.heroDescription}>{banner.description}</Text> : null}
          <View style={styles.heroActions}>
            <AppButton title={banner.cta_text || 'Оставить заявку'} onPress={onPress} />
            <AppButton title="Посмотреть вузы" variant="outline" onPress={onUniversitiesPress} />
          </View>
        </View>
      </RedGradientHero>
    </View>
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
        <SvgIcon name={icon} size={22} color="#B91C1C" />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </AppCard>
  );
}

function QuickService({ icon, title, onPress }: { icon: SvgIconName; title: string; onPress: () => void }) {
  return (
    <AnimatedPressable style={styles.quickService} onPress={onPress}>
      <View style={styles.quickServiceIcon}>
        <SvgIcon name={icon} size={22} color="#B91C1C" />
      </View>
      <Text style={styles.quickServiceText}>{title}</Text>
    </AnimatedPressable>
  );
}

function ContactsBlock({ contacts }: { contacts: OfficeContact[] }) {
  if (!contacts.length) {
    return (
      <AppCard>
        <Text style={styles.contactTitle}>Контакты скоро появятся</Text>
        <Text style={styles.contactText}>Добавьте офисы, телефоны и соцсети через админ-панель.</Text>
      </AppCard>
    );
  }

  return (
    <View style={styles.contactsList}>
      {contacts.slice(0, 4).map(contact => (
        <AppCard key={contact.id}>
          <Text style={styles.contactTitle}>{contact.city}{contact.country ? `, ${contact.country}` : ''}</Text>
          {contact.office_name ? <Text style={styles.contactName}>{contact.office_name}</Text> : null}
          {contact.phone ? <Text style={styles.contactText}>Телефон: {contact.phone}</Text> : null}
          {contact.whatsapp ? <Text style={styles.contactText}>WhatsApp: {contact.whatsapp}</Text> : null}
          {contact.email ? <Text style={styles.contactText}>Email: {contact.email}</Text> : null}
        </AppCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FEF7F5',
  },
  heroWrap: {
    width: CARD_WIDTH,
    marginRight: spacing.md,
  },
  hero: {
    minHeight: 360,
  },
  heroGlass: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: typography.small,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.xs,
  },
  heroDescription: {
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderColor: '#FFE2E2',
  },
  statValue: {
    color: '#B91C1C',
    fontSize: 22,
    fontWeight: typography.weights.heavy,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: typography.weights.bold,
    marginTop: 4,
  },
  grid: {
    gap: spacing.sm,
  },
  featureCard: {
    minHeight: 132,
    borderColor: '#FFE2E2',
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weights.heavy,
  },
  featureText: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: 4,
    fontWeight: typography.weights.medium,
  },
  directionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  directionPill: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#FFE0E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  directionText: {
    color: colors.text,
    fontWeight: typography.weights.heavy,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickService: {
    width: '48%',
    minHeight: 112,
    borderRadius: radius.xl,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#FAD7D7',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  quickServiceIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickServiceText: {
    color: colors.text,
    fontWeight: typography.weights.heavy,
    textAlign: 'center',
  },
  inlineService: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#FFDDDD',
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  inlineServiceTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weights.heavy,
  },
  inlineServiceText: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: 5,
  },
  registerCard: {
    marginTop: spacing.xl,
    borderColor: '#FFE2E2',
  },
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
  contactsList: {
    gap: spacing.sm,
  },
  contactTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
  },
  contactName: {
    color: '#B91C1C',
    fontWeight: typography.weights.heavy,
    marginTop: 4,
  },
  contactText: {
    color: colors.muted,
    lineHeight: 21,
    marginTop: 5,
  },
});
