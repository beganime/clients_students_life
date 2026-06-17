import React, { useEffect, useMemo, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { contentApi, UniversityFilters } from '../../api/endpoints';
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
  const [countrySlug, setCountrySlug] = useState<string | undefined>(route.params?.country);
  const [onlyPartners, setOnlyPartners] = useState(false);
  const [withDormitory, setWithDormitory] = useState(false);

  useEffect(() => {
    if (route.params?.country) setCountrySlug(route.params.country);
  }, [route.params?.country]);

  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: contentApi.getCountries });

  const filters = useMemo<UniversityFilters>(() => {
    const payload: UniversityFilters = {};
    if (search.trim()) payload.search = search.trim();
    if (countrySlug) payload.country__slug = countrySlug;
    if (onlyPartners) payload.partner_status = true;
    if (withDormitory) payload.has_dormitory = true;
    return payload;
  }, [search, countrySlug, onlyPartners, withDormitory]);

  const universitiesQuery = useQuery({ queryKey: ['universities', filters], queryFn: () => contentApi.getUniversities(filters) });

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
              <Text style={styles.title}>Найдите университет под цель студента</Text>
              <Text style={styles.subtitle}>Поиск, фильтры, теги и аккуратные карточки помогают быстрее выбрать страну, город и программу.</Text>
            </RedGradientHero>

            <AppCard style={styles.searchCard}>
              <View style={styles.searchBox}>
                <SvgIcon name="search" size={20} color={colors.mutedLight} />
                <TextInput value={search} onChangeText={setSearch} placeholder="Поиск по вузу или специальности" placeholderTextColor={colors.mutedLight} style={styles.searchInput} />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                <FilterChip label="Все страны" active={!countrySlug} onPress={() => setCountrySlug(undefined)} />
                {(countriesQuery.data || []).map(country => (
                  <FilterChip key={country.id} label={country.name} active={countrySlug === country.slug} onPress={() => setCountrySlug(countrySlug === country.slug ? undefined : country.slug)} />
                ))}
              </ScrollView>

              <View style={styles.filterRow}>
                <FilterChip label="Партнёрские" active={onlyPartners} onPress={() => setOnlyPartners(!onlyPartners)} />
                <FilterChip label="С общежитием" active={withDormitory} onPress={() => setWithDormitory(!withDormitory)} />
              </View>

              <Text style={styles.countText}>Найдено: {(universitiesQuery.data || []).length}</Text>
            </AppCard>

            {universitiesQuery.isLoading ? <LoadingSkeleton rows={4} height={160} /> : null}
            {universitiesQuery.isError ? <ErrorState onAction={() => universitiesQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={!universitiesQuery.isLoading && !universitiesQuery.isError ? <EmptyState title="Нет подходящих вузов" description="Попробуйте изменить страну, поиск или фильтры." /> : null}
        renderItem={({ item }) => <UniversityCard university={item} onPress={() => navigation.navigate('UniversityDetail', { slug: item.slug })} onApplyPress={() => navigation.navigate('ApplicationCreate', { universityId: item.id })} />}
      />
    </Screen>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>;
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
  chipsRow: { marginTop: spacing.md },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: '#FFDDDD', marginRight: spacing.sm },
  chipActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  chipText: { color: colors.muted, fontWeight: typography.weights.bold },
  chipTextActive: { color: colors.white },
  countText: { color: colors.muted, fontWeight: typography.weights.heavy, marginTop: spacing.md },
});
