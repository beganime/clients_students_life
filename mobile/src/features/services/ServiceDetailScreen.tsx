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

type R = RouteProp<RootStackParamList, 'ServiceDetail'>;

export function ServiceDetailScreen() {
  const route = useRoute<R>();
  const { data, isLoading } = useQuery({
    queryKey: ['service', route.params.slug],
    queryFn: () => contentApi.getService(route.params.slug),
  });

  if (isLoading) return <Loading />;
  if (!data) return null;

  return (
    <Screen scroll>
      <Text style={styles.title}>{data.title}</Text>
      <Text style={styles.description}>{data.short_description}</Text>
      <Markdown>{data.description_markdown || ''}</Markdown>
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
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
});