import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { contentApi } from '../../api/endpoints';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Screen } from '../../components/Screen';
import { UniversityCard } from '../../components/UniversityCard';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';

export function FavoriteUniversitiesScreen() {
  const navigation = useNavigation<any>();

  const favoritesQuery = useQuery({
    queryKey: ['favorite-universities'],
    queryFn: contentApi.getFavoriteUniversities,
  });

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={favoritesQuery.isLoading || favoritesQuery.isError ? [] : favoritesQuery.data || []}
        refreshing={favoritesQuery.isRefetching}
        onRefresh={favoritesQuery.refetch}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View>
            <View style={[styles.hero, shadows.premium]}>
              <View style={styles.glowBlue} />
              <View style={styles.glowCoral} />
              <Badge label="Избранное" variant="mint" icon="heart" />
              <Text style={styles.title}>Сохранённые университеты</Text>
              <Text style={styles.subtitle}>Здесь остаются вузы, которые заинтересовали пользователя. Позже можно быстро вернуться и подать заявку.</Text>
            </View>
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
  list: { padding: 20, paddingBottom: 44, backgroundColor: colors.background },
  hero: { minHeight: 280, borderRadius: radius.xl, backgroundColor: colors.primaryDark, padding: spacing.lg, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: spacing.lg },
  glowBlue: { position: 'absolute', width: 270, height: 270, borderRadius: 135, backgroundColor: colors.primary, top: -105, right: -95, opacity: 0.68 },
  glowCoral: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.accent, left: -90, bottom: -96, opacity: 0.24 },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.84)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
});
