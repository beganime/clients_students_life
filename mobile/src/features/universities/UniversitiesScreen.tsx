import React, { useEffect, useMemo, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { contentApi, UniversityFilters } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors } from '../../constants/colors';
import { MainTabParamList } from '../../navigation/types';
import { University } from '../../types/api';
import { getMediaUrl } from '../../utils/media';

type R = RouteProp<MainTabParamList, 'Universities'>;

export function UniversitiesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<R>();

  const [search, setSearch] = useState('');
  const [countrySlug, setCountrySlug] = useState<string | undefined>(route.params?.country);
  const [onlyPartners, setOnlyPartners] = useState(false);
  const [withDormitory, setWithDormitory] = useState(false);

  useEffect(() => {
    if (route.params?.country) {
      setCountrySlug(route.params.country);
    }
  }, [route.params?.country]);

  const countriesQuery = useQuery({
    queryKey: ['countries'],
    queryFn: contentApi.getCountries,
  });

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
            <View style={styles.hero}>
              <View style={styles.heroGlowRed} />
              <View style={styles.heroGlowBlue} />

              <View style={styles.heroGlass}>
                <View style={styles.heroIconBox}>
                  <SvgIcon name="university" size={34} color={colors.white} strokeWidth={2.4} />
                </View>

                <Text style={styles.kicker}>Каталог вузов</Text>
                <Text style={styles.title}>Найдите университет для поступления</Text>
                <Text style={styles.subtitle}>
                  Выбирайте страну, смотрите стоимость, языки обучения, общежитие и программы.
                </Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <SvgIcon name="search" size={20} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Поиск по названию или специальности"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
            </View>

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
                <SvgIcon name="star" size={18} color={onlyPartners ? colors.white : colors.secondary} />
                <Text style={[styles.filterButtonText, onlyPartners && styles.filterButtonTextActive]}>
                  Партнёры
                </Text>
              </Pressable>

              <Pressable
                style={[styles.filterButton, withDormitory && styles.filterButtonActive]}
                onPress={() => setWithDormitory(!withDormitory)}
              >
                <SvgIcon name="building" size={18} color={withDormitory ? colors.white : colors.secondary} />
                <Text style={[styles.filterButtonText, withDormitory && styles.filterButtonTextActive]}>
                  Общежитие
                </Text>
              </Pressable>
            </View>

            <Text style={styles.countText}>
              Найдено: {(universitiesQuery.data || []).length}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Университеты не найдены"
            description="Попробуйте изменить страну, поиск или фильтры."
          />
        }
        renderItem={({ item }) => (
          <UniversityGlassCard
            item={item}
            onPress={() => navigation.navigate('UniversityDetail', { slug: item.slug })}
          />
        )}
      />
    </Screen>
  );
}

function UniversityGlassCard({ item, onPress }: { item: University; onPress: () => void }) {
  const imageUrl = getMediaUrl(item.cover_image || item.logo || null);

  return (
    <Pressable style={styles.universityCard} onPress={onPress}>
      <View style={styles.universityImageBox}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.universityImage} />
        ) : (
          <View style={styles.universityPlaceholder}>
            <SvgIcon name="university" size={34} color={colors.secondary} />
          </View>
        )}

        {item.partner_status ? (
          <View style={styles.partnerBadge}>
            <SvgIcon name="star" size={13} color={colors.primary} />
            <Text style={styles.partnerBadgeText}>Партнёр</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.universityBody}>
        <Text style={styles.universityName}>{item.name}</Text>

        <View style={styles.metaRow}>
          <SvgIcon name="mapPin" size={15} color={colors.secondary} />
          <Text style={styles.metaText}>
            {[item.country_name, item.city_name].filter(Boolean).join(', ') || 'Локация уточняется'}
          </Text>
        </View>

        <View style={styles.infoPills}>
          <View style={styles.infoPill}>
            <SvgIcon name="language" size={14} color={colors.secondary} />
            <Text style={styles.infoPillText}>{item.languages || 'Языки уточняются'}</Text>
          </View>

          <View style={styles.infoPill}>
            <SvgIcon name="money" size={14} color={colors.secondary} />
            <Text style={styles.infoPillText}>{item.tuition_from || 'Стоимость уточняется'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.moreText}>Подробнее</Text>
          <SvgIcon name="chevronRight" size={18} color={colors.secondary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
    paddingBottom: 42,
    backgroundColor: '#F4F7FB',
  },
  hero: {
    minHeight: 275,
    borderRadius: 34,
    backgroundColor: '#101828',
    padding: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#101828',
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  heroGlowRed: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary,
    top: -95,
    right: -80,
    opacity: 0.68,
  },
  heroGlowBlue: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.secondary,
    bottom: -105,
    left: -80,
    opacity: 0.72,
  },
  heroGlass: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginBottom: 14,
  },
  kicker: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: colors.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 22,
    fontWeight: '600',
  },
  searchBox: {
    height: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  chipsRow: {
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.muted,
    fontWeight: '800',
  },
  chipTextActive: {
    color: colors.white,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    minHeight: 50,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
  },
  filterButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterButtonText: {
    color: colors.secondary,
    fontWeight: '900',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  countText: {
    color: colors.muted,
    fontWeight: '800',
    marginBottom: 14,
  },
  universityCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 13 },
    elevation: 6,
  },
  universityImageBox: {
    height: 170,
    backgroundColor: 'rgba(21,101,192,0.08)',
  },
  universityImage: {
    width: '100%',
    height: '100%',
  },
  universityPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerBadge: {
    position: 'absolute',
    left: 14,
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  partnerBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  universityBody: {
    padding: 16,
  },
  universityName: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  metaRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  metaText: {
    flex: 1,
    color: colors.muted,
    fontWeight: '700',
  },
  infoPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(21,101,192,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(21,101,192,0.14)',
  },
  infoPillText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
  },
  cardFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreText: {
    color: colors.secondary,
    fontWeight: '900',
  },
});