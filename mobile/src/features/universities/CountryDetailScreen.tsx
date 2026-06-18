import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { educationCatalogApi } from '../../api/educationCatalog';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { colors, spacing, typography } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type R = RouteProp<RootStackParamList, 'CountryDetail'>;

export function CountryDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<any>();
  const id = route.params.id;
  const countryQuery = useQuery({ queryKey: ['country-detail', id], queryFn: () => educationCatalogApi.getCountry(id) });
  const citiesQuery = useQuery({ queryKey: ['country-cities', id], queryFn: () => educationCatalogApi.getCities({ country: id }) });
  const universitiesQuery = useQuery({ queryKey: ['country-universities', id], queryFn: () => educationCatalogApi.getUniversities({ country: id }) });

  if (countryQuery.isLoading) return <Loading />;
  if (countryQuery.isError || !countryQuery.data) return <Screen scroll style={styles.screen}><ErrorState onAction={() => countryQuery.refetch()} /></Screen>;

  const country = countryQuery.data;

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero style={styles.hero}>
        <Text style={styles.kicker}>Страна</Text>
        <Text style={styles.title}>{country.name}</Text>
        <Text style={styles.subtitle}>{country.short_description || 'Информация о стране из каталога.'}</Text>
      </RedGradientHero>

      <AppButton title="Все вузы страны" onPress={() => navigation.navigate('App', { screen: 'Universities', params: { country: id } })} />

      <SectionHeader eyebrow="Города" title="Города" />
      <View style={styles.list}>{(citiesQuery.data || []).map(city => <AppCard key={city.id} style={styles.card}><Text style={styles.cardTitle}>{city.name}</Text><Text style={styles.cardText}>{(city as any).universities_count || 0} вузов</Text><AppButton title="Открыть город" variant="outline" onPress={() => navigation.navigate('CityDetail', { id: city.id, countryId: id })} /></AppCard>)}</View>

      <SectionHeader eyebrow="Вузы" title="Университеты" />
      <View style={styles.list}>{(universitiesQuery.data || []).slice(0, 10).map(university => <AppCard key={university.id} style={styles.card}><Text style={styles.cardTitle}>{university.name}</Text><Text style={styles.cardText}>{university.city_name || 'Город уточняется'}</Text><AppButton title="Открыть вуз" variant="outline" onPress={() => navigation.navigate('UniversityDetail', { id: university.id })} /></AppCard>)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FEF7F5' },
  hero: { minHeight: 270, marginBottom: spacing.lg },
  kicker: { color: 'rgba(255,255,255,0.78)', fontSize: typography.tiny, fontWeight: typography.weights.heavy, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.white, fontSize: 34, lineHeight: 40, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  list: { gap: spacing.md },
  card: { borderColor: '#FFDDDD' },
  cardTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  cardText: { color: colors.muted, lineHeight: 21, marginTop: spacing.xs, marginBottom: spacing.md },
});
