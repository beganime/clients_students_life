import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { contentApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';

export function StaffScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['staff'], queryFn: contentApi.getStaff });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={data || []}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={<EmptyState title="Сотрудников пока нет" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.position}>{item.position}</Text>
            <Text style={styles.bio}>{item.bio}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  position: {
    marginTop: 6,
    color: colors.secondary,
    fontWeight: '700',
  },
  bio: {
    marginTop: 8,
    color: colors.muted,
    lineHeight: 20,
  },
});