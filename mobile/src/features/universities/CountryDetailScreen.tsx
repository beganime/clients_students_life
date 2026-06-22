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

type R = RouteProp<RootStackParamList, 'CountryDetail'>;

export function CountryDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<any>();
  const id = route.params.id;

  const countryQuery = useQuery({
    queryKey: ['catalog', 'country', id],
    queryFn: () => educationCatalogApi.getCountry(id),
    staleTime: 1000 * 60 * 30,
  });
  const citiesQuery = useQuery({
    queryKey: ['catalog', 'cities', { country: id }],
    queryFn: () => educationCatalogApi.getCities({ country: id }),
    staleTime: 1000 * 60 * 30,
  });
  const universitiesQuery = useQuery({
    queryKey: ['catalog', 'universities', { country: id }],
    queryFn: () => educationCatalogApi.getUniversities({ country: id }),
    staleTime: 1000 * 60 * 30,
  });

  const refetchAll = () => {
    countryQuery.refetch();
    citiesQuery.refetch();
    universitiesQuery.refetch();
  };

  if (countryQuery.isLoading) return <Loading />;
  if (countryQuery.isError || !countryQuery.data) {
    return (
      <Screen scroll style={styles.screen}>
        <ErrorState onAction={() => countryQuery.refetch()} />
      </Screen>
    );
  }

  const country = countryQuery.data;
  const cities = citiesQuery.data || [];
  const universities = universitiesQuery.data || [];
  const heroImage = country.cover_image || country.flag;

  return (
    <Screen
      scroll
      style={styles.screen}
      refreshing={countryQuery.isRefetching || citiesQuery.isRefetching || universitiesQuery.isRefetching}
      onRefresh={refetchAll}
    >
      <RedGradientHero backgroundImage={heroImage ? { uri: heroImage } : bannerImages.country} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroTextBox}>
            <Text style={styles.kicker}>Страна</Text>
            <Text style={styles.title}>{country.name}</Text>
          </View>
          {country.flag ? <Image source={{ uri: country.flag }} style={styles.flag} resizeMode="cover" /> : null}
        </View>
        <Text style={styles.subtitle}>
          '{country.universities_count || 0} вузов, {country.cities_count || 0} городов'
        </Text>
      </RedGradientHero>

      <AppButton
        title="Показать все вузы страны"
        onPress={() => navigation.navigate('App', { screen: 'Universities', params: { country: id } })}
        style={styles.primaryAction}
      />

      {country.description_markdown ? (
        <AppCard style={styles.markdownBox}>
          <Text style={styles.sectionTitle}>О стране</Text>
          <Markdown>{country.description_markdown}</Markdown>
        </AppCard>
      ) : null}

      <SectionHeader eyebrow="Города" title="Города страны" />
      {citiesQuery.isError ? <ErrorState onAction={() => citiesQuery.refetch()} /> : null}
      {!citiesQuery.isLoading && !citiesQuery.isError && !cities.length ? (
        <EmptyState title="Города пока не добавлены" description="Каталог можно обновить pull-to-refresh." />
      ) : null}
      <View style={styles.list}>
        {cities.map(city => (
          <AppCard key={city.id} style={styles.card}>
            <View style={styles.cardRow}>
              {city.image || city.cover_image ? (
                <Image source={{ uri: city.image || city.cover_image || '' }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <SvgIcon name="mapPin" size={24} color={colors.primary} />
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{city.name}</Text>
                <Text style={styles.cardText}>{city.universities_count || 0} вузов</Text>
              </View>
            </View>
            <AppButton
              title="Открыть город"
              variant="outline"
              onPress={() => navigation.navigate('CityDetail', { id: city.id, countryId: id })}
            />
          </AppCard>
        ))}
      </View>

      <SectionHeader eyebrow="Вузы" title="Университеты страны" />
      {universitiesQuery.isError ? <ErrorState onAction={() => universitiesQuery.refetch()} /> : null}
      {!universitiesQuery.isLoading && !universitiesQuery.isError && !universities.length ? (
        <EmptyState title="Вузов пока нет" description="Попробуйте обновить каталог или изменить фильтры." />
      ) : null}
      <View style={styles.list}>
        {universities.slice(0, 10).map(university => (
          <AppCard key={university.id} style={styles.card}>
            <Text style={styles.cardTitle}>{university.name}</Text>
            <Text style={styles.cardText}>{university.city_name || 'Город уточняется'}</Text>
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
  hero: { minHeight: 250, marginBottom: spacing.lg },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heroTextBox: { flex: 1 },
  flag: { width: 58, height: 58, borderRadius: radius.md, backgroundColor: colors.white },
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
  primaryAction: { marginBottom: spacing.lg },
  markdownBox: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.md },
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  cardRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surface },
  thumbPlaceholder: {
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
