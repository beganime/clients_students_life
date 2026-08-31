import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { educationCatalogApi } from '../../api/educationCatalog';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';

const DEGREE_FILTERS = ['Все', 'Бакалавриат', 'Специалитет'];

export function GovernmentLinePricesScreen() {
  const [search, setSearch] = useState('');
  const [degree, setDegree] = useState('Все');
  const pricesQuery = useQuery({
    queryKey: ['government-line-prices'],
    queryFn: educationCatalogApi.getGovernmentLinePrices,
  });

  const prices = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('ru');
    return (pricesQuery.data || []).filter(item => {
      const matchesDegree = degree === 'Все' || item.degree === degree;
      const matchesSearch = !needle || `${item.code} ${item.name} ${item.degree}`.toLocaleLowerCase('ru').includes(needle);
      return matchesDegree && matchesSearch;
    });
  }, [degree, pricesQuery.data, search]);

  return (
    <Screen scroll refreshing={pricesQuery.isRefetching} onRefresh={pricesQuery.refetch}>
      <RedGradientHero style={styles.hero}>
        <Text style={styles.kicker}>Бюджет</Text>
        <Text style={styles.heroTitle}>Программы и условия сопровождения</Text>
        <Text style={styles.heroText}>
          Отдельный каталог приоритетных направлений. Стоимость показывается только в этом разделе и указана в долларах США.
        </Text>
      </RedGradientHero>

      <View style={styles.searchBlock}>
        <AppInput
          value={search}
          onChangeText={setSearch}
          placeholder="Название или код направления"
          maxLength={255}
          right={<SvgIcon name="search" size={20} color={colors.muted} />}
          wrapperStyle={styles.searchInput}
        />
        <View style={styles.filters}>
          {DEGREE_FILTERS.map(item => (
            <Pressable
              key={item}
              style={[styles.filter, degree === item && styles.filterActive]}
              onPress={() => setDegree(item)}
            >
              <Text style={[styles.filterText, degree === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>Направления</Text>
        <Text style={styles.resultCount}>{prices.length}</Text>
      </View>

      {pricesQuery.isLoading ? <LoadingSkeleton rows={5} height={126} /> : null}
      {pricesQuery.isError ? <ErrorState onAction={() => pricesQuery.refetch()} /> : null}
      {!pricesQuery.isLoading && !pricesQuery.isError && !prices.length ? (
        <EmptyState title="Ничего не найдено" description="Измените поисковый запрос или фильтр уровня обучения." />
      ) : null}
      <View style={styles.list}>
        {prices.map(item => (
          <AppCard key={`${item.code}-${item.degree}-${item.name}`} style={styles.priceCard}>
            <View style={styles.cardTop}>
              <Badge label={item.code} variant="blue" />
              <Badge label={item.degree} variant="neutral" />
            </View>
            <Text style={styles.programName}>{item.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Стоимость услуги</Text>
              <Text style={styles.priceValue}>${item.service_fee_usd.toLocaleString('en-US')}</Text>
            </View>
          </AppCard>
        ))}
      </View>

      <Text style={styles.note}>
        Итоговый состав услуг и условия фиксируются менеджером при оформлении договора.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 220, marginBottom: spacing.lg },
  kicker: { color: 'rgba(255,255,255,0.82)', fontSize: typography.tiny, fontWeight: typography.weights.heavy, textTransform: 'uppercase' },
  heroTitle: { color: colors.white, fontSize: 29, lineHeight: 35, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  heroText: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  searchBlock: { gap: spacing.sm },
  searchInput: { marginBottom: 0 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: { minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  filterActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  filterText: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold },
  filterTextActive: { color: colors.white },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md },
  resultTitle: { color: colors.text, fontSize: typography.title, fontWeight: typography.weights.heavy },
  resultCount: { minWidth: 36, textAlign: 'center', color: colors.secondary, fontWeight: typography.weights.heavy, backgroundColor: 'rgba(13,65,109,0.08)', borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: spacing.sm },
  list: { gap: spacing.md },
  priceCard: { gap: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  programName: { color: colors.text, fontSize: typography.subtitle, lineHeight: 26, fontWeight: typography.weights.heavy },
  priceRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  priceLabel: { flex: 1, color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold },
  priceValue: { color: colors.primary, fontSize: 24, fontWeight: typography.weights.heavy },
  note: { color: colors.muted, fontSize: typography.small, lineHeight: 20, textAlign: 'center', marginTop: spacing.xl, fontWeight: typography.weights.medium },
});
