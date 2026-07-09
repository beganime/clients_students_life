import React, { useEffect, useMemo, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { educationCatalogApi } from '../../api/educationCatalog';
import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
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
import { Program } from '../../types/api';

type R = RouteProp<MainTabParamList, 'Universities'>;
const UNIVERSITIES_PAGE_SIZE = 12;
const PROGRAMS_PAGE_SIZE = 12;
const PROGRAM_SORT_OPTIONS = [
  { label: 'Дешёвые сначала', value: 'price_asc' },
  { label: 'Дорогие сначала', value: 'price_desc' },
  { label: 'По названию', value: 'title_asc' },
  { label: 'По городу', value: 'city_asc' },
  { label: 'По стране', value: 'country_asc' },
  { label: 'По дедлайну', value: 'deadline_asc' },
];
const CURRENCIES = [
  { label: 'Все валюты', value: '' },
  { label: 'RUB', value: 'RUB' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'TRY', value: 'TRY' },
  { label: 'TMT', value: 'TMT' },
];

export function UniversitiesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<R>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [countryId, setCountryId] = useState<string | number | undefined>(route.params?.country);
  const [cityId, setCityId] = useState<string | number | undefined>(route.params?.city);
  const [sortOrder, setSortOrder] = useState('price_asc');
  const [currency, setCurrency] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    setCountryId(route.params?.country);
    setCityId(route.params?.city);
  }, [route.params?.country, route.params?.city]);

  const countriesQuery = useQuery({
    queryKey: ['catalog', 'countries'],
    queryFn: () => educationCatalogApi.getCountries(),
    staleTime: 1000 * 60 * 30,
  });
  const citiesQuery = useQuery({
    queryKey: ['catalog', 'cities', { country: countryId || 'all' }],
    queryFn: () => educationCatalogApi.getCities(countryId ? { country: countryId } : undefined),
    staleTime: 1000 * 60 * 30,
  });

  const hasProgramSearch = Boolean(
    search.trim()
      || levelFilter.trim()
      || languageFilter.trim()
      || priceMin.trim()
      || priceMax.trim()
      || Boolean(currency),
  );

  const universityFilters = useMemo(() => {
    const payload: Record<string, string | number | undefined> = {};
    if (countryId) payload.country = countryId;
    if (cityId) payload.city = cityId;
    return payload;
  }, [countryId, cityId]);

  const programFilters = useMemo(() => {
    const payload: Record<string, string | number | undefined> = {};
    if (search.trim()) payload.search = search.trim();
    if (countryId) payload.country = countryId;
    if (cityId) payload.city = cityId;
    if (sortOrder) payload.ordering = sortOrder;
    if (currency) payload.currency = currency;
    if (levelFilter.trim()) payload.level = levelFilter.trim();
    if (languageFilter.trim()) payload.language = languageFilter.trim();
    if (priceMin.trim()) payload.price_min = priceMin.trim();
    if (priceMax.trim()) payload.price_max = priceMax.trim();
    return payload;
  }, [search, countryId, cityId, sortOrder, currency, levelFilter, languageFilter, priceMin, priceMax]);

  const universitiesQuery = useInfiniteQuery({
    queryKey: ['catalog', 'universities', universityFilters],
    queryFn: ({ pageParam }) =>
      educationCatalogApi.getUniversitiesPage({
        ...universityFilters,
        limit: UNIVERSITIES_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) return undefined;
      try {
        const nextUrl = new URL(lastPage.next);
        const nextOffset = Number(nextUrl.searchParams.get('offset'));
        if (Number.isFinite(nextOffset)) return nextOffset;
      } catch {
        // Some APIs return a relative next URL. Fall back to the number of cached rows.
      }
      const loaded = allPages.reduce((sum, page) => sum + page.results.length, 0);
      return loaded < lastPage.count ? loaded : undefined;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const programsQuery = useInfiniteQuery({
    queryKey: ['catalog', 'programs', programFilters],
    queryFn: ({ pageParam }) =>
      educationCatalogApi.getProgramsPage({
        ...programFilters,
        limit: PROGRAMS_PAGE_SIZE,
        offset: pageParam,
      }),
    enabled: hasProgramSearch,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) return undefined;
      try {
        const nextUrl = new URL(lastPage.next);
        const nextOffset = Number(nextUrl.searchParams.get('offset'));
        if (Number.isFinite(nextOffset)) return nextOffset;
      } catch {
        // Relative next URLs are common behind reverse proxies.
      }
      const loaded = allPages.reduce((sum, page) => sum + page.results.length, 0);
      return loaded < lastPage.count ? loaded : undefined;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const cachedUniversities = (queryClient.getQueryData(['catalog', 'universities', 'all']) || []) as any[];
  const cachedPrograms = (queryClient.getQueryData(['catalog', 'programs', 'all']) || []) as Program[];
  const universities = useMemo(() => {
    const pageRows = universitiesQuery.data?.pages.flatMap(page => page.results) || [];
    if (pageRows.length) return pageRows;
    if (!countryId && !cityId) return cachedUniversities;
    return cachedUniversities.filter(item => {
      const sameCountry = !countryId || String(item.country) === String(countryId) || String(item.country_id) === String(countryId);
      const sameCity = !cityId || String(item.city) === String(cityId) || String(item.city_id) === String(cityId);
      return sameCountry && sameCity;
    });
  }, [universitiesQuery.data, cachedUniversities, countryId, cityId]);
  const universitiesCount = universitiesQuery.data?.pages[0]?.count ?? universities.length;
  const programs = useMemo(() => {
    const pageRows = programsQuery.data?.pages.flatMap(page => page.results) || [];
    if (pageRows.length) return pageRows;
    const query = search.trim().toLowerCase();
    return cachedPrograms.filter(program => {
      const text = [
        program.title,
        program.program_title,
        program.university_name,
        program.city_name,
        program.country_name,
        program.level,
        program.language,
      ].filter(Boolean).join(' ').toLowerCase();
      return (!query || text.includes(query))
        && (!countryId || String((program as any).country) === String(countryId) || String((program as any).country_id) === String(countryId))
        && (!cityId || String((program as any).city) === String(cityId) || String((program as any).city_id) === String(cityId));
    });
  }, [programsQuery.data, cachedPrograms, search, countryId, cityId]);
  const programsCount = programsQuery.data?.pages[0]?.count ?? programs.length;
  const currentItems = hasProgramSearch ? programs : universities;
  const activeQuery = hasProgramSearch ? programsQuery : universitiesQuery;

  const refreshAll = () => {
    countriesQuery.refetch();
    citiesQuery.refetch();
    universitiesQuery.refetch();
    if (hasProgramSearch) programsQuery.refetch();
  };

  return (
    <Screen>
      <FlatList
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 28, 44) }]}
        data={activeQuery.isLoading || activeQuery.isError ? [] : currentItems}
        keyExtractor={item => `${hasProgramSearch ? 'program' : 'university'}-${item.id}`}
        refreshing={countriesQuery.isRefetching || citiesQuery.isRefetching || activeQuery.isRefetching}
        onRefresh={refreshAll}
        onEndReached={() => {
          if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
            activeQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.45}
        ListFooterComponent={
          activeQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.footerText}>{hasProgramSearch ? 'Загружаем ещё программы...' : 'Загружаем ещё вузы...'}</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View>
            <RedGradientHero backgroundImage={bannerImages.universities} style={styles.hero}>
              <Text style={styles.kicker}>Каталог вузов</Text>
              <Text style={styles.title}>Страны, города, вузы и программы</Text>
              <Text style={styles.subtitle}>
                Данные загружаются через прокси students-life.ru. Используйте фильтры, чтобы быстро перейти к подходящим вариантам.
              </Text>
            </RedGradientHero>

            <AppCard style={styles.searchCard}>
              <View style={styles.searchBox}>
                <SvgIcon name="search" size={20} color={colors.mutedLight} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Поиск по программе: стоматология, IT, медицина"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.searchInput}
                />
              </View>

              <Text style={styles.blockLabel}>Страны</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                <FilterChip
                  label="Все страны"
                  active={!countryId}
                  onPress={() => {
                    setCountryId(undefined);
                    setCityId(undefined);
                  }}
                />
                {(countriesQuery.data || []).map(country => (
                  <FilterChip
                    key={country.id}
                    label={country.name}
                    active={String(countryId) === String(country.id)}
                    onPress={() => {
                      setCountryId(String(countryId) === String(country.id) ? undefined : country.id);
                      setCityId(undefined);
                    }}
                    onLongPress={() => navigation.navigate('CountryDetail', { id: country.id })}
                  />
                ))}
              </ScrollView>

              <Text style={styles.blockLabel}>Города</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                <FilterChip label="Все города" active={!cityId} onPress={() => setCityId(undefined)} />
                {(citiesQuery.data || []).map(city => (
                  <FilterChip
                    key={city.id}
                    label={city.name}
                    active={String(cityId) === String(city.id)}
                    onPress={() => setCityId(String(cityId) === String(city.id) ? undefined : city.id)}
                    onLongPress={() => navigation.navigate('CityDetail', { id: city.id, countryId: city.country })}
                  />
                ))}
              </ScrollView>

              {hasProgramSearch ? (
                <>
                  <Text style={styles.blockLabel}>Сортировка программ</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                    {PROGRAM_SORT_OPTIONS.map(option => (
                      <FilterChip
                        key={option.value}
                        label={option.label}
                        active={sortOrder === option.value}
                        onPress={() => setSortOrder(option.value)}
                      />
                    ))}
                  </ScrollView>

                  <Text style={styles.blockLabel}>Валюта</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                    {CURRENCIES.map(item => (
                      <FilterChip key={item.value || 'all'} label={item.label} active={currency === item.value} onPress={() => setCurrency(item.value)} />
                    ))}
                  </ScrollView>

                  <View style={styles.inlineFilters}>
                    <TextInput
                      value={levelFilter}
                      onChangeText={setLevelFilter}
                      placeholder="Уровень"
                      placeholderTextColor={colors.mutedLight}
                      style={styles.inlineInput}
                    />
                    <TextInput
                      value={languageFilter}
                      onChangeText={setLanguageFilter}
                      placeholder="Язык"
                      placeholderTextColor={colors.mutedLight}
                      style={styles.inlineInput}
                    />
                  </View>
                  <View style={styles.inlineFilters}>
                    <TextInput
                      value={priceMin}
                      onChangeText={setPriceMin}
                      placeholder="Цена от"
                      placeholderTextColor={colors.mutedLight}
                      keyboardType="numeric"
                      style={styles.inlineInput}
                    />
                    <TextInput
                      value={priceMax}
                      onChangeText={setPriceMax}
                      placeholder="Цена до"
                      placeholderTextColor={colors.mutedLight}
                      keyboardType="numeric"
                      style={styles.inlineInput}
                    />
                  </View>
                </>
              ) : null}

              <Text style={styles.helperText}>
                Нажмите на чип для фильтра. Удерживайте страну или город, чтобы открыть отдельную страницу.
              </Text>
              <Text style={styles.countText}>
                {hasProgramSearch
                  ? `Показано программ: ${programs.length}${programsCount ? ` из ${programsCount}` : ''}`
                  : `Показано вузов: ${universities.length}${universitiesCount ? ` из ${universitiesCount}` : ''}`}
              </Text>
            </AppCard>

            {countriesQuery.isError ? <ErrorState title="Страны не загрузились" onAction={() => countriesQuery.refetch()} /> : null}
            {citiesQuery.isError ? <ErrorState title="Города не загрузились" onAction={() => citiesQuery.refetch()} /> : null}
            {activeQuery.isLoading ? <LoadingSkeleton rows={4} height={160} /> : null}
            {activeQuery.isError ? <ErrorState onAction={() => activeQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={
          !activeQuery.isLoading && !activeQuery.isError ? (
            <EmptyState
              title={hasProgramSearch ? 'Нет подходящих программ' : 'Нет подходящих вузов'}
              description={hasProgramSearch ? 'Попробуйте изменить запрос, сортировку, валюту или фильтры цены.' : 'Попробуйте изменить страну, город или поисковый запрос.'}
            />
          ) : null
        }
        renderItem={({ item }) => (
          hasProgramSearch ? (
            <ProgramResultCard
              program={item as Program}
              onOpen={() => navigation.navigate('ProgramDetail', { id: item.id })}
              onApply={() => navigation.navigate('ApplicationCreate', { universityId: (item as Program).university_id || (item as Program).university, programId: item.id })}
            />
          ) : (
            <UniversityCard
              university={item}
              onPress={() => navigation.navigate('UniversityDetail', { id: item.id })}
              onApplyPress={() => navigation.navigate('ApplicationCreate', { universityId: item.id })}
            />
          )
        )}
      />
    </Screen>
  );
}

function ProgramResultCard({ program, onOpen, onApply }: { program: Program; onOpen: () => void; onApply: () => void }) {
  const price = formatProgramPrice(program);
  const location = [program.city_name, program.country_name].filter(Boolean).join(', ');
  const meta = [program.level, program.language, program.duration].filter(Boolean).join(' • ');

  return (
    <AppCard style={styles.programCard}>
      <View style={styles.programHeader}>
        <View style={styles.programIcon}>
          <SvgIcon name="document" size={22} color={colors.secondary} />
        </View>
        <View style={styles.programTitleBox}>
          <Text style={styles.programTitle}>{program.title}</Text>
          {program.university_name ? <Text style={styles.programUniversity}>{program.university_name}</Text> : null}
        </View>
      </View>

      {location ? <Text style={styles.programMeta}>{location}</Text> : null}
      {meta ? <Text style={styles.programMeta}>{meta}</Text> : null}
      {program.faculty ? <Text style={styles.programMeta}>Факультет: {program.faculty}</Text> : null}
      {price ? <Text style={styles.programPrice}>{price}</Text> : null}
      {program.application_deadline ? <Text style={styles.programMeta}>Дедлайн: {formatDate(program.application_deadline)}</Text> : null}

      <View style={styles.programActions}>
        <AppButton title="Подробнее" variant="outline" onPress={onOpen} style={styles.programButton} />
        <AppButton title="Подать заявку" onPress={onApply} style={styles.programButton} />
      </View>
    </AppCard>
  );
}

function formatProgramPrice(program: Program) {
  const original = money(program.tuition_fee, program.currency);
  const converted = money(program.converted_tuition_fee, program.selected_currency);
  if (converted && original && program.selected_currency && program.currency && program.selected_currency !== program.currency) {
    return `${original} • ${converted}`;
  }
  return converted || original || '';
}

function money(value?: string | number | null, currency?: string) {
  if (value === null || value === undefined || value === '') return '';
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/\s/g, ''));
  const text = Number.isFinite(numeric) ? new Intl.NumberFormat('ru-RU').format(numeric) : String(value);
  return `${text}${currency ? ` ${currency}` : ''}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function FilterChip({
  label,
  active,
  onPress,
  onLongPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress} onLongPress={onLongPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: 18, backgroundColor: colors.background },
  hero: { minHeight: 270, marginBottom: spacing.lg },
  kicker: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: typography.tiny,
    fontWeight: typography.weights.heavy,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  searchCard: { marginBottom: spacing.lg },
  searchBox: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: { flex: 1, minHeight: 48, color: colors.text, fontSize: typography.body },
  blockLabel: { color: colors.text, fontWeight: typography.weights.heavy, marginTop: spacing.md, marginBottom: spacing.xs },
  chipsRow: { marginTop: 0 },
  inlineFilters: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  inlineInput: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: typography.small,
    fontWeight: typography.weights.bold,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: typography.weights.bold },
  chipTextActive: { color: colors.white },
  helperText: {
    color: colors.mutedLight,
    fontSize: typography.small,
    fontWeight: typography.weights.bold,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  countText: { color: colors.muted, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  programCard: { marginBottom: spacing.md },
  programHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  programIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(13,65,109,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programTitleBox: { flex: 1 },
  programTitle: { color: colors.text, fontSize: typography.subtitle, lineHeight: 24, fontWeight: typography.weights.heavy },
  programUniversity: { color: colors.secondary, fontSize: typography.small, lineHeight: 19, marginTop: 3, fontWeight: typography.weights.heavy },
  programMeta: { color: colors.muted, fontSize: typography.small, lineHeight: 20, marginTop: spacing.xs, fontWeight: typography.weights.bold },
  programPrice: { color: colors.primary, fontSize: typography.body, marginTop: spacing.sm, fontWeight: typography.weights.heavy },
  programActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  programButton: { flex: 1 },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: typography.weights.bold,
  },
});
