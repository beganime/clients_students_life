import React, { useEffect, useMemo, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { educationCatalogApi } from '../../api/educationCatalog';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { UniversityCard } from '../../components/UniversityCard';
import { colors, radius, spacing, typography } from '../../constants/colors';
import { MainTabParamList } from '../../navigation/types';

type R = RouteProp<MainTabParamList, 'Universities'>;

export function UniversitiesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<R>();
  const [search, setSearch] = useState('');
  const [countryId, setCountryId] = useState<string | number | undefined>(route.params?.country);
  const [cityId, setCityId] = useState<string | number | undefined>(route.params?.city);

  useEffect(() => {
    setCountryId(route.params?.country);
    setCityId(route.params?.city);
  }, [route.params?.country, route.params?.city]);

  const countriesQuery = useQuery({ queryKey: ['manager-countries'], queryFn: () => educationCatalogApi.getCountries() });
  const citiesQuery = useQuery({ queryKey: ['manager-cities', countryId], queryFn: () => educationCatalogApi.getCities(countryId ? { country: countryId } : undefined) });

  const filters = useMemo(() => {
    const payload: Record<string, string | number | undefined> = {};
    if (search.trim()) payload.search = search.trim();
    if (countryId) payload.country = countryId;
    if (cityId) payload.city = cityId;
    return payload;
  }, [search, countryId, cityId]);

  const universitiesQuery = useQuery({ queryKey: ['manager-universities', filters], queryFn: () => educationCatalogApi.getUniversities(filters) });

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={universitiesQuery.isLoading || universitiesQuery.isError ? [] : universitiesQuery.data || []}
        keyExtractor={item => String(item.id)}
        refreshing={universitiesQuery.isRefetching}
        onRefresh={universitiesQuery.refetch}
        ListHeaderComponent={
          <View>
            <RedGradientHero style={styles.hero}>
              <Text style={styles.kicker}>Каталог вузов</Text>
              <Text style={styles.title}>Страны, города, вузы и программы</Text>
              <Text style={styles.subtitle}>Данные загружаются из manager-sl.ru. Откройте страну, затем город, вуз и программу.</Text>
            </RedGradientHero>

            <AppCard style={styles.searchCard}>
              <View style={styles.searchBox}><SvgIcon name="search" size={20} color={colors.mutedLight} /><TextInput value={search} onChangeText={setSearch} placeholder="Поиск по вузу или специальности" placeholderTextColor={colors.mutedLight} style={styles.searchInput} /></View>
              <Text style={styles.blockLabel}>Страны</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                <FilterChip label="Все страны" active={!countryId} onPress={() => { setCountryId(undefined); setCityId(undefined); }} />
                {(countriesQuery.data || []).map(country => <FilterChip key={country.id} label={country.name} active={String(countryId) === String(country.id)} onPress={() => { setCountryId(countryId === country.id ? undefined : country.id); setCityId(undefined); }} onLongPress={() => navigation.navigate('CountryDetail', { id: country.id })} />)}
              </ScrollView>
              <Text style={styles.blockLabel}>Города</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                <FilterChip label="Все города" active={!cityId} onPress={() => setCityId(undefined)} />
                {(citiesQuery.data || []).map(city => <FilterChip key={city.id} label={city.name} active={String(cityId) === String(city.id)} onPress={() => setCityId(cityId === city.id ? undefined : city.id)} onLongPress={() => navigation.navigate('CityDetail', { id: city.id, countryId: city.country })} />)}
              </ScrollView>
              <Text style={styles.helperText}>Нажмите на страну/город для фильтра. Удержите, чтобы открыть отдельную страницу.</Text>
              <Text style={styles.countText}>Найдено вузов: {(universitiesQuery.data || []).length}</Text>
            </AppCard>

            {universitiesQuery.isLoading ? <LoadingSkeleton rows={4} height={160} /> : null}
            {universitiesQuery.isError ? <ErrorState onAction={() => universitiesQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={!universitiesQuery.isLoading && !universitiesQuery.isError ? <EmptyState title="Нет подходящих вузов" description="Попробуйте изменить страну, город или поиск." /> : null}
        renderItem={({ item }) => <UniversityCard university={item} onPress={() => navigation.navigate('UniversityDetail', { id: item.id })} onApplyPress={() => navigation.navigate('ApplicationCreate', { universityId: item.id })} />}
      />
    </Screen>
  );
}

function FilterChip({ label, active, onPress, onLongPress }: { label: string; active: boolean; onPress: () => void; onLongPress?: () => void }) {
  return <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress} onLongPress={onLongPress}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 44, backgroundColor: '#FEF7F5' },
  hero: { minHeight: 290, marginBottom: spacing.lg },
  kicker: { color: 'rgba(255,255,255,0.78)', fontSize: typography.tiny, fontWeight: typography.weights.heavy, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  searchCard: { marginBottom: spacing.lg, borderColor: '#FFDDDD' },
  searchBox: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: '#FFDDDD', backgroundColor: '#FEF7F5', paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchInput: { flex: 1, minHeight: 50, color: colors.text, fontSize: typography.body },
  blockLabel: { color: colors.text, fontWeight: typography.weights.heavy, marginTop: spacing.md, marginBottom: spacing.xs },
  chipsRow: { marginTop: 0 },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: '#FFDDDD', marginRight: spacing.sm },
  chipActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  chipText: { color: colors.muted, fontWeight: typography.weights.bold },
  chipTextActive: { color: colors.white },
  helperText: { color: colors.mutedLight, fontSize: typography.small, fontWeight: typography.weights.bold, lineHeight: 18, marginTop: spacing.sm },
  countText: { color: colors.muted, fontWeight: typography.weights.heavy, marginTop: spacing.md },
});
