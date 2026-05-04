import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet } from 'react-native';

import { contentApi } from '../../api/endpoints';
import { ServiceCard } from '../../components/cards/ServiceCard';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';

export function ServicesScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ['services'], queryFn: contentApi.getServices });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={data || []}
        keyExtractor={item => String(item.id)}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={<EmptyState title="Услуг пока нет" />}
        renderItem={({ item }) => (
          <ServiceCard item={item} onPress={() => navigation.navigate('ServiceDetail', { slug: item.slug })} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },
});