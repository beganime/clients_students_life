import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { contentApi } from '../../api/endpoints';
import { UniversityCard } from '../../components/cards/UniversityCard';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';

export function FavoriteUniversitiesScreen() {
  const navigation = useNavigation<any>();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['favorite-universities'],
    queryFn: contentApi.getFavoriteUniversities,
  });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={data || []}
        refreshing={isRefetching}
        onRefresh={refetch}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Избранные вузы</Text>
            <Text style={styles.subtitle}>Здесь сохраняются университеты, которые заинтересовали пользователя.</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Избранных вузов пока нет"
            description="Откройте карточку университета и нажмите «В избранное»."
          />
        }
        renderItem={({ item }) => (
          <UniversityCard
            item={item.university_detail}
            onPress={() => navigation.navigate('UniversityDetail', { slug: item.university_detail.slug })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: colors.muted,
    lineHeight: 22,
  },
});