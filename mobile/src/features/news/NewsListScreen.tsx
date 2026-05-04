import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

import { contentApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';

export function NewsListScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading } = useQuery({ queryKey: ['news'], queryFn: contentApi.getNews });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={data || []}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={<EmptyState title="Новостей пока нет" />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('NewsDetail', { slug: item.slug })}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.short_description}</Text>
            {item.author_name ? <Text style={styles.author}>Автор: {item.author_name}</Text> : null}
          </Pressable>
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
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  description: {
    marginTop: 8,
    color: colors.muted,
    lineHeight: 20,
  },
  author: {
    marginTop: 10,
    color: colors.secondary,
    fontWeight: '700',
  },
});