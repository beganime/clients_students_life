import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';

import { contentApi } from '../../api/endpoints';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getMediaUrl } from '../../utils/media';

type R = RouteProp<RootStackParamList, 'NewsDetail'>;

export function NewsDetailScreen() {
  const route = useRoute<R>();

  const newsQuery = useQuery({
    queryKey: ['news-detail', route.params.slug],
    queryFn: () => contentApi.getNewsPost(route.params.slug),
  });

  if (newsQuery.isLoading) return <Loading />;

  if (newsQuery.isError) {
    return (
      <Screen scroll style={styles.screen}>
        <ErrorState onAction={() => newsQuery.refetch()} />
      </Screen>
    );
  }

  if (!newsQuery.data) return null;

  const data = newsQuery.data;
  const imageUrl = getMediaUrl(data.cover_image || null);

  return (
    <Screen scroll style={styles.screen}>
      <View style={[styles.hero, shadows.premium]}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" /> : <View style={styles.heroPlaceholder}><SvgIcon name="news" size={46} color={colors.white} /></View>}
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.badgeRow}>
            {data.category_title ? <Badge label={data.category_title} variant="blue" /> : null}
            {data.is_important ? <Badge label="Важно" variant="coral" /> : null}
          </View>
          <Text style={styles.title}>{data.title}</Text>
          {data.author_name ? <Text style={styles.author}>Автор: {data.author_name}</Text> : null}
        </View>
      </View>

      {data.short_description ? (
        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryIconBox}><SvgIcon name="document" size={22} color={colors.primary} /></View>
          <Text style={styles.summaryText}>{data.short_description}</Text>
        </AppCard>
      ) : null}

      <AppCard style={styles.contentCard}>
        <Text style={styles.sectionTitle}>Материал</Text>
        <Markdown>{data.content_markdown || ''}</Markdown>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 380, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.primaryDark, marginBottom: spacing.lg, justifyContent: 'flex-end' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,18,32,0.68)' },
  heroContent: { padding: spacing.lg },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  title: { color: colors.white, fontSize: 31, lineHeight: 37, fontWeight: typography.weights.heavy },
  author: { color: 'rgba(255,255,255,0.82)', fontWeight: typography.weights.bold, marginTop: spacing.sm },
  summaryCard: { marginBottom: spacing.lg, flexDirection: 'row', gap: spacing.md },
  summaryIconBox: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  summaryText: { flex: 1, color: colors.primary, fontSize: typography.body, lineHeight: 23, fontWeight: typography.weights.bold },
  contentCard: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.md },
});
