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

type R = RouteProp<RootStackParamList, 'CityDetail'>;

export function CityDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<any>();
  const id = route.params.id;
  const cityQuery = useQuery({ queryKey: ['city-detail', id], queryFn: () => educationCatalogApi.getCity(id) });
  const universitiesQuery = useQuery({ queryKey: ['city-universities', id], queryFn: () => educationCatalogApi.getUniversities({ city: id }) });

  if (cityQuery.isLoading) return <Loading />;
  if (cityQuery.isError || !cityQuery.data) return <Screen scroll style={styles.screen}><ErrorState onAction={() => cityQuery.refetch()} /></Screen>;

  const city = cityQuery.data;

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero style={styles.hero}>
        <Text style={styles.kicker}>Город</Text>
        <Text style={styles.title}>{city.name}</Text>
        <Text style={styles.subtitle}>{city.country_name || 'Страна уточняется'}</Text>
      </RedGradientHero>

      <AppButton title="Все вузы города" onPress={() => navigation.navigate('App', { screen: 'Universities', params: { country: city.country, city: id } })} />

      <SectionHeader eyebrow="Вузы" title="Университеты города" />
      <View style={styles.list}>{(universitiesQuery.data || []).map(university => <AppCard key={university.id} style={styles.card}><Text style={styles.cardTitle}>{university.name}</Text><Text style={styles.cardText}>{university.languages || 'Языки уточняются'}</Text><AppButton title="Открыть вуз" variant="outline" onPress={() => navigation.navigate('UniversityDetail', { id: university.id })} /></AppCard>)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FEF7F5' },
  hero: { minHeight: 260, marginBottom: spacing.lg },
  kicker: { color: 'rgba(255,255,255,0.78)', fontSize: typography.tiny, fontWeight: typography.weights.heavy, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.white, fontSize: 34, lineHeight: 40, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  list: { gap: spacing.md },
  card: { borderColor: '#FFDDDD' },
  cardTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  cardText: { color: colors.muted, lineHeight: 21, marginTop: spacing.xs, marginBottom: spacing.md },
});
