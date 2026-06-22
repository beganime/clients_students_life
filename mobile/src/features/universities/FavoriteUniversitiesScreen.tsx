import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { contentApi } from '../../api/endpoints';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { UniversityCard } from '../../components/UniversityCard';
import { colors, spacing, typography } from '../../constants/colors';

export function FavoriteUniversitiesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const favoritesQuery = useQuery({
    queryKey: ['favorite-universities'],
    queryFn: contentApi.getFavoriteUniversities,
  });

  return (
    <Screen>
      <FlatList
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 28, 44) }]}
        data={favoritesQuery.isLoading || favoritesQuery.isError ? [] : favoritesQuery.data || []}
        refreshing={favoritesQuery.isRefetching}
        onRefresh={favoritesQuery.refetch}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View>
            <RedGradientHero style={styles.hero}>
              <Badge label="Избранное" variant="mint" icon="heart" />
              <Text style={styles.title}>Сохранённые университеты</Text>
              <Text style={styles.subtitle}>Здесь остаются вузы, которые заинтересовали пользователя. Позже можно быстро вернуться и подать заявку.</Text>
            </RedGradientHero>
            {favoritesQuery.isLoading ? <LoadingSkeleton rows={3} height={150} /> : null}
            {favoritesQuery.isError ? <ErrorState onAction={() => favoritesQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={!favoritesQuery.isLoading && !favoritesQuery.isError ? <EmptyState title="Избранных вузов пока нет" description="Откройте карточку университета и нажмите «В избранное»." /> : null}
        renderItem={({ item }) => (
          <UniversityCard
            university={item.university_detail}
            onPress={() => navigation.navigate('UniversityDetail', { slug: item.university_detail.slug })}
            onApplyPress={() => navigation.navigate('ApplicationCreate', { universityId: item.university_detail.id })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, backgroundColor: '#FEF7F5' },
  hero: { minHeight: 260, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
});
