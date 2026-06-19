import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';

import { educationCatalogApi } from '../../api/educationCatalog';
import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type R = RouteProp<RootStackParamList, 'CityDetail'>;

export function CityDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<any>();
  const id = route.params.id;

  const cityQuery = useQuery({
    queryKey: ['catalog', 'city', id],
    queryFn: () => educationCatalogApi.getCity(id),
    staleTime: 1000 * 60 * 30,
  });
  const universitiesQuery = useQuery({
    queryKey: ['catalog', 'universities', { city: id }],
    queryFn: () => educationCatalogApi.getUniversities({ city: id }),
    staleTime: 1000 * 60 * 30,
  });

  const refetchAll = () => {
    cityQuery.refetch();
    universitiesQuery.refetch();
  };

  if (cityQuery.isLoading) return <Loading />;
  if (cityQuery.isError || !cityQuery.data) {
    return (
      <Screen scroll style={styles.screen}>
        <ErrorState onAction={() => cityQuery.refetch()} />
      </Screen>
    );
  }

  const city = cityQuery.data;
  const universities = universitiesQuery.data || [];
  const imageUrl = city.cover_image || city.image;

  return (
    <Screen
      scroll
      style={styles.screen}
      refreshing={cityQuery.isRefetching || universitiesQuery.isRefetching}
      onRefresh={refetchAll}
    >
      <RedGradientHero backgroundImage={bannerImages.city} style={styles.hero}>
        <Text style={styles.kicker}>Город</Text>
        <Text style={styles.title}>{city.name}</Text>
        <Text style={styles.subtitle}>{city.country_name || 'Страна уточняется'}</Text>
      </RedGradientHero>

      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" /> : null}

      <AppButton
        title="Все вузы города"
        onPress={() => navigation.navigate('App', { screen: 'Universities', params: { country: city.country, city: id } })}
        style={styles.primaryAction}
      />

      {city.description_markdown ? (
        <AppCard style={styles.markdownBox}>
          <Text style={styles.sectionTitle}>О городе</Text>
          <Markdown>{city.description_markdown}</Markdown>
        </AppCard>
      ) : null}

      <SectionHeader eyebrow="Вузы" title="Университеты города" />
      {universitiesQuery.isError ? <ErrorState onAction={() => universitiesQuery.refetch()} /> : null}
      {!universitiesQuery.isLoading && !universitiesQuery.isError && !universities.length ? (
        <EmptyState title="Вузов пока нет" description="Попробуйте обновить каталог." />
      ) : null}
      <View style={styles.list}>
        {universities.map(university => (
          <AppCard key={university.id} style={styles.card}>
            <View style={styles.cardRow}>
              {university.logo || university.cover_image ? (
                <Image source={{ uri: university.logo || university.cover_image || '' }} style={styles.logo} resizeMode="cover" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <SvgIcon name="university" size={24} color={colors.primary} />
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{university.name}</Text>
                <Text style={styles.cardText}>{university.languages || 'Языки уточняются'}</Text>
              </View>
            </View>
            <AppButton
              title="Открыть вуз"
              variant="outline"
              onPress={() => navigation.navigate('UniversityDetail', { id: university.id })}
            />
          </AppCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 230, marginBottom: spacing.lg },
  kicker: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: typography.tiny,
    fontWeight: typography.weights.heavy,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.sm,
  },
  subtitle: { color: 'rgba(255,255,255,0.92)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  coverImage: { width: '100%', height: 180, borderRadius: radius.lg, marginBottom: spacing.lg },
  primaryAction: { marginBottom: spacing.lg },
  markdownBox: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.md },
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  cardRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  logo: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surface },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  cardText: { color: colors.muted, lineHeight: 21, marginTop: spacing.xs },
});
