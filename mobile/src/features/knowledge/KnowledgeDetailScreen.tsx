import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { contentApi } from '../../api/endpoints';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type R = RouteProp<RootStackParamList, 'KnowledgeDetail'>;

export function KnowledgeDetailScreen() {
  const route = useRoute<R>();
  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-detail', route.params.slug],
    queryFn: () => contentApi.getKnowledgeArticle(route.params.slug),
  });

  if (isLoading) return <Loading />;
  if (!data) return null;

  return (
    <Screen scroll>
      <Text style={styles.title}>{data.title}</Text>
      {data.author_name ? <Text style={styles.author}>Автор: {data.author_name}</Text> : null}
      <Markdown>{data.content_markdown || ''}</Markdown>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  author: {
    color: colors.secondary,
    fontWeight: '700',
    marginBottom: 18,
  },
});