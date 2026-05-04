import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { contentApi, UniversityFilters } from '../../api/endpoints';
import { UniversityCard } from '../../components/cards/UniversityCard';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';

export function UniversitiesScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [countrySlug, setCountrySlug] = useState<string | undefined>();
  const [onlyPartners, setOnlyPartners] = useState(false);
  const [withDormitory, setWithDormitory] = useState(false);

  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: contentApi.getCountries });

  const filters = useMemo<UniversityFilters>(() => {
    const payload: UniversityFilters = {};
    if (search.trim()) payload.search = search.trim();
    if (countrySlug) payload.country__slug = countrySlug;
    if (onlyPartners) payload.partner_status = true;
    if (withDormitory) payload.has_dormitory = true;
    return payload;
  }, [search, countrySlug, onlyPartners, withDormitory]);

  const universitiesQuery = useQuery({
    queryKey: ['universities', filters],
    queryFn: () => contentApi.getUniversities(filters),
  });

  if (universitiesQuery.isLoading || countriesQuery.isLoading) return <Loading />;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={universitiesQuery.data || []}
        keyExtractor={item => String(item.id)}
        refreshing={universitiesQuery.isRefetching}
        onRefresh={universitiesQuery.refetch}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Университеты</Text>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Поиск по названию или специальности"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              <Pressable
                style={[styles.chip, !countrySlug && styles.chipActive]}
                onPress={() => setCountrySlug(undefined)}
              >
                <Text style={[styles.chipText, !countrySlug && styles.chipTextActive]}>Все страны</Text>
              </Pressable>

              {(countriesQuery.data || []).map(country => {
                const active = countrySlug === country.slug;
                return (
                  <Pressable
                    key={country.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCountrySlug(active ? undefined : country.slug)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{country.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterButton, onlyPartners && styles.filterButtonActive]}
                onPress={() => setOnlyPartners(!onlyPartners)}
              >
                <Text style={[styles.filterButtonText, onlyPartners && styles.filterButtonTextActive]}>Партнёры</Text>
              </Pressable>

              <Pressable
                style={[styles.filterButton, withDormitory && styles.filterButtonActive]}
                onPress={() => setWithDormitory(!withDormitory)}
              >
                <Text style={[styles.filterButtonText, withDormitory && styles.filterButtonTextActive]}>Общежитие</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Университеты не найдены" description="Попробуйте изменить фильтры." />}
        renderItem={({ item }) => (
          <UniversityCard item={item} onPress={() => navigation.navigate('UniversityDetail', { slug: item.slug })} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 16,
  },
  searchInput: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  chipsRow: {
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.muted,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.white,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterButtonText: {
    color: colors.muted,
    fontWeight: '800',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
});