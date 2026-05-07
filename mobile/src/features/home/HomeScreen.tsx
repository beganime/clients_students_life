import React, { useMemo } from 'react';
import {
  Dimensions,
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { commonApi, contentApi } from '../../api/endpoints';
import { BannerSlider } from '../../components/BannerSlider';
import { Screen } from '../../components/Screen';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors } from '../../constants/colors';
import { HomeBanner, OfficeContact } from '../../types/api';
import { getMediaUrl } from '../../utils/media';

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
    background_gradient: '#E53935,#1565C0',
    is_dark: true,
  },
  {
    id: -2,
    slot: 'hero',
    title: 'Поступление в университеты',
    subtitle: 'Подкурс, бакалавриат, магистратура',
    description: 'Подбираем вуз, готовим документы и сопровождаем студента до результата.',
    badge: 'Admissions',
    cta_text: 'Смотреть вузы',
    cta_type: 'universities',
    background_gradient: '#1565C0,#0D47A1',
    is_dark: true,
  },
  {
    id: -3,
    slot: 'hero',
    title: 'Виза и сопровождение',
    subtitle: 'От приглашения до приезда',
    description: 'Помогаем с приглашением, визой, билетами, жильём и адаптацией.',
    badge: 'Visa support',
    cta_text: 'Услуги',
    cta_type: 'service',
    background_gradient: '#B71C1C,#E53935',
    is_dark: true,
  },
];

const fallbackNewsBanners: HomeBanner[] = [
  {
    id: -10,
    slot: 'news',
    title: 'Скоро старт приёма документов',
    subtitle: 'Подготовьте заявку заранее',
    description: 'Оставьте заявку, чтобы менеджер проверил документы и подобрал подходящие варианты.',
    badge: 'Важно',
    cta_text: 'Начать',
    cta_type: 'application',
    background_gradient: '#101828,#1565C0',
    is_dark: true,
  },
];

export function HomeScreen() {
  const navigation = useNavigation<any>();

  const homeQuery = useQuery({
    queryKey: ['home-content'],
    queryFn: commonApi.getHomeContent,
    retry: 1,
  });

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: contentApi.getServices,
  });

  const countriesQuery = useQuery({
    queryKey: ['countries'],
    queryFn: contentApi.getCountries,
  });

  const heroBanners = useMemo(() => {
    const items = homeQuery.data?.hero_banners?.filter(Boolean) || [];
    return items.length ? items.slice(0, 3) : fallbackHeroBanners;
  }, [homeQuery.data]);

  const newsBanners = useMemo(() => {
    const items = homeQuery.data?.news_banners?.filter(Boolean) || [];
    return items.length ? items.slice(0, 3) : fallbackNewsBanners;
  }, [homeQuery.data]);

  const contacts = homeQuery.data?.contacts || [];

  const handleBannerPress = (banner: HomeBanner) => {
    switch (banner.cta_type) {
      case 'application':
        navigation.navigate('ApplicationCreate');
        break;
      case 'universities':
        navigation.navigate('Universities');
        break;
      case 'news':
        if (banner.linked_news_slug) {
          navigation.navigate('NewsDetail', { slug: banner.linked_news_slug });
        } else {
          navigation.navigate('News');
        }
        break;
      case 'service':
        if (banner.linked_service_slug) {
          navigation.navigate('ServiceDetail', { slug: banner.linked_service_slug });
        } else {
          navigation.navigate('Services');
        }
        break;
      case 'university':
        if (banner.linked_university_slug) {
          navigation.navigate('UniversityDetail', { slug: banner.linked_university_slug });
        } else {
          navigation.navigate('Universities');
        }
        break;
      case 'url':
        if (banner.cta_url) {
          Linking.openURL(banner.cta_url);
        }
        break;
      default:
        break;
    }
  };

  const openVisa = () => {
    const visaService = servicesQuery.data?.find(item =>
      item.title.toLowerCase().includes('виз'),
    );

    if (visaService) {
      navigation.navigate('ServiceDetail', { slug: visaService.slug });
      return;
    }

    navigation.navigate('Services');
  };

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.logo}>Student’s Life</Text>
          <Text style={styles.logoSubtitle}>International Education</Text>
        </View>

        <Pressable style={styles.topButton} onPress={() => navigation.navigate('Profile')}>
          <SvgIcon name="profile" size={18} color={colors.text} />
          <Text style={styles.topButtonText}>Профиль</Text>
        </Pressable>
      </View>

      <BannerSlider
        data={heroBanners}
        itemWidth={CARD_WIDTH}
        renderItem={item => <HeroBanner banner={item} onPress={() => handleBannerPress(item)} />}
      />

      <View style={styles.infoGrid}>
        <GlassInfoCard title="14+" text="стран для поступления" />
        <GlassInfoCard title="1500+" text="студентов получили помощь" />
        <GlassInfoCard title="24/7" text="поддержка на этапах" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionKicker}>Услуги</Text>
        <Text style={styles.sectionTitle}>Комплексная поддержка</Text>
      </View>

      <View style={styles.quickGrid}>
        <QuickActionCard
          iconName="university"
          title="Вузы"
          text="Каталог университетов и программ"
          onPress={() => navigation.navigate('Universities')}
        />

        <QuickActionCard
          iconName="application"
          title="Поступить"
          text="Оставить заявку менеджеру"
          onPress={() => navigation.navigate('ApplicationCreate')}
        />

        <QuickActionCard
          iconName="visa"
          title="Виза"
          text="Поддержка по приглашению и визе"
          onPress={openVisa}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionKicker}>Направления</Text>
        <Text style={styles.sectionTitle}>Популярные страны</Text>
      </View>

      <View style={styles.countryRow}>
        {(countriesQuery.data || []).slice(0, 6).map(country => (
          <Pressable
            key={country.id}
            style={styles.countryPill}
            onPress={() => navigation.navigate('Universities', { country: country.slug })}
          >
            <SvgIcon name="globe" size={16} color={colors.secondary} />
            <Text style={styles.countryText}>{country.name}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionKicker}>Новости и акции</Text>
        <Text style={styles.sectionTitle}>Актуальное</Text>
      </View>

      <BannerSlider
        data={newsBanners}
        itemWidth={CARD_WIDTH}
        intervalMs={5200}
        renderItem={item => <SmallBanner banner={item} onPress={() => handleBannerPress(item)} />}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionKicker}>Контакты</Text>
        <Text style={styles.sectionTitle}>Мы рядом с вами</Text>
      </View>

      <ContactsBlock contacts={contacts} socials={homeQuery.data?.socials} />
    </Screen>
  );
}

function HeroBanner({ banner, onPress }: { banner: HomeBanner; onPress: () => void }) {
  const imageUrl = getMediaUrl(banner.image || null);
  const gradient = banner.background_gradient || '#E53935,#1565C0';
  const [firstColor, secondColor] = gradient.split(',');

  const content = (
    <View style={[styles.heroCard, { backgroundColor: firstColor || colors.primary }]}>
      <View style={[styles.heroGlow, { backgroundColor: secondColor || colors.secondary }]} />

      <View style={styles.glassLayer}>
        {banner.badge ? <Text style={styles.badge}>{banner.badge}</Text> : null}
        {banner.subtitle ? <Text style={styles.heroSubtitle}>{banner.subtitle}</Text> : null}
        <Text style={styles.heroTitle}>{banner.title}</Text>
        {banner.description ? <Text style={styles.heroDescription}>{banner.description}</Text> : null}

        {banner.cta_type !== 'none' ? (
          <Pressable style={styles.heroCta} onPress={onPress}>
            <Text style={styles.heroCtaText}>{banner.cta_text || 'Подробнее'}</Text>
            <SvgIcon name="chevronRight" size={18} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  if (imageUrl) {
    return (
      <Pressable onPress={onPress} style={styles.bannerWrapper}>
        <ImageBackground source={{ uri: imageUrl }} imageStyle={styles.heroImage} style={styles.imageHeroCard}>
          <View style={styles.imageOverlay}>{content}</View>
        </ImageBackground>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.bannerWrapper}>
      {content}
    </Pressable>
  );
}

function SmallBanner({ banner, onPress }: { banner: HomeBanner; onPress: () => void }) {
  const gradient = banner.background_gradient || '#101828,#1565C0';
  const [firstColor, secondColor] = gradient.split(',');

  return (
    <Pressable
      style={[styles.smallBanner, { backgroundColor: firstColor || colors.text }]}
      onPress={onPress}
    >
      <View style={[styles.smallGlow, { backgroundColor: secondColor || colors.secondary }]} />

      <View style={styles.smallGlass}>
        {banner.badge ? <Text style={styles.smallBadge}>{banner.badge}</Text> : null}
        <Text style={styles.smallTitle}>{banner.title}</Text>
        {banner.description ? <Text style={styles.smallText}>{banner.description}</Text> : null}

        {banner.cta_type !== 'none' ? (
          <View style={styles.smallLinkRow}>
            <Text style={styles.smallLink}>{banner.cta_text || 'Подробнее'}</Text>
            <SvgIcon name="chevronRight" size={17} color={colors.white} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function GlassInfoCard({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoNumber}>{title}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function QuickActionCard({
  iconName,
  title,
  text,
  onPress,
}: {
  iconName: SvgIconName;
  title: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickCard} onPress={onPress}>
      <View style={styles.quickIconBox}>
        <SvgIcon name={iconName} size={28} color={colors.primary} />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickText}>{text}</Text>
    </Pressable>
  );
}

function ContactsBlock({
  contacts,
  socials,
}: {
  contacts: OfficeContact[];
  socials?: {
    instagram?: string;
    tiktok?: string;
    telegram?: string;
    website?: string;
    main_email?: string;
    partners_email?: string;
    universities_email?: string;
  };
}) {
  const hasSocials = Boolean(
    socials?.instagram ||
    socials?.tiktok ||
    socials?.telegram ||
    socials?.website ||
    socials?.main_email ||
    socials?.partners_email ||
    socials?.universities_email,
  );

  return (
    <View style={styles.contactsBox}>
      {contacts.length ? (
        contacts.map(contact => (
          <View key={contact.id} style={styles.contactCard}>
            <Text style={styles.contactCity}>
              {contact.city}
              {contact.country ? `, ${contact.country}` : ''}
            </Text>

            {contact.office_name ? <Text style={styles.contactName}>{contact.office_name}</Text> : null}

            {contact.address ? <ContactLine icon="mapPin" text={contact.address} /> : null}
            {contact.phone ? <ContactLine icon="phone" text={contact.phone} /> : null}
            {contact.whatsapp ? <ContactLine icon="phone" text={`WhatsApp: ${contact.whatsapp}`} /> : null}
            {contact.telegram ? <ContactLine icon="chat" text={`Telegram: ${contact.telegram}`} /> : null}
            {contact.email ? <ContactLine icon="mail" text={contact.email} /> : null}
            {contact.work_hours ? <ContactLine icon="clock" text={contact.work_hours} /> : null}
          </View>
        ))
      ) : (
        <View style={styles.contactCard}>
          <Text style={styles.contactCity}>Контакты скоро появятся</Text>
          <Text style={styles.contactLineText}>
            Добавьте офисы, телефоны, почты и соцсети через админ-панель.
          </Text>
        </View>
      )}

      {hasSocials ? (
        <View style={styles.socialCard}>
          <Text style={styles.socialTitle}>Соцсети и почты</Text>

          {socials?.main_email ? <ContactLine icon="mail" text={`Главная почта: ${socials.main_email}`} /> : null}
          {socials?.partners_email ? <ContactLine icon="mail" text={`Партнёрам: ${socials.partners_email}`} /> : null}
          {socials?.universities_email ? <ContactLine icon="mail" text={`Вузам: ${socials.universities_email}`} /> : null}
          {socials?.instagram ? <ContactLine icon="globe" text={`Instagram: ${socials.instagram}`} /> : null}
          {socials?.tiktok ? <ContactLine icon="globe" text={`TikTok: ${socials.tiktok}`} /> : null}
          {socials?.telegram ? <ContactLine icon="chat" text={`Telegram: ${socials.telegram}`} /> : null}
          {socials?.website ? <ContactLine icon="globe" text={`Сайт: ${socials.website}`} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function ContactLine({ icon, text }: { icon: SvgIconName; text: string }) {
  return (
    <View style={styles.contactLine}>
      <SvgIcon name={icon} size={16} color={colors.secondary} />
      <Text style={styles.contactLineText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    paddingBottom: 44,
    backgroundColor: '#F4F7FB',
  },
  topBar: {
    marginTop: 8,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  logoSubtitle: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  topButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
  },
  topButtonText: {
    color: colors.text,
    fontWeight: '900',
  },
  bannerWrapper: {
    width: CARD_WIDTH,
    paddingRight: 14,
  },
  heroCard: {
    minHeight: 330,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'flex-end',
    shadowColor: '#101828',
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  imageHeroCard: {
    minHeight: 330,
    borderRadius: 30,
    overflow: 'hidden',
  },
  heroImage: {
    borderRadius: 30,
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16,24,40,0.25)',
  },
  heroGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -70,
    top: -70,
    opacity: 0.75,
  },
  glassLayer: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    color: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '900',
    fontSize: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  heroCta: {
    alignSelf: 'flex-start',
    marginTop: 18,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroCtaText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  infoCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  infoNumber: {
    color: colors.primary,
    fontSize: 23,
    fontWeight: '900',
  },
  infoText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionKicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    marginTop: 3,
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
  },
  quickGrid: {
    gap: 12,
    marginBottom: 28,
  },
  quickCard: {
    minHeight: 122,
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  quickIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(229,57,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  quickText: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: 6,
  },
  countryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(21,101,192,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(21,101,192,0.18)',
  },
  countryText: {
    color: colors.secondary,
    fontWeight: '900',
  },
  smallBanner: {
    width: CARD_WIDTH - 14,
    minHeight: 205,
    borderRadius: 28,
    marginRight: 14,
    padding: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowColor: '#101828',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  smallGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -60,
    top: -80,
    opacity: 0.7,
  },
  smallGlass: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  smallBadge: {
    alignSelf: 'flex-start',
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  smallTitle: {
    color: colors.white,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
  },
  smallText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  smallLinkRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallLink: {
    color: colors.white,
    fontWeight: '900',
  },
  contactsBox: {
    gap: 12,
  },
  contactCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  contactCity: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  contactName: {
    color: colors.secondary,
    fontWeight: '900',
    marginTop: 4,
    marginBottom: 8,
  },
  contactLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  contactLineText: {
    flex: 1,
    color: colors.muted,
    lineHeight: 21,
    fontWeight: '600',
  },
  socialCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(229,57,53,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.18)',
  },
  socialTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
});