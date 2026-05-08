import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';

import { contentApi } from '../../api/endpoints';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getMediaUrl } from '../../utils/media';

type R = RouteProp<RootStackParamList, 'NewsDetail'>;

export function NewsDetailScreen() {
  const route = useRoute<R>();

  const { data, isLoading } = useQuery({
    queryKey: ['news-detail', route.params.slug],
    queryFn: () => contentApi.getNewsPost(route.params.slug),
  });

  if (isLoading) return <Loading />;
  if (!data) return null;

  const imageUrl = getMediaUrl(data.cover_image || null);

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.hero}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <SvgIcon name="news" size={46} color={colors.white} />
          </View>
        )}

        <View style={styles.heroOverlay} />

        <View style={styles.heroContent}>
          <View style={styles.badgeRow}>
            {data.category_title ? <Text style={styles.categoryBadge}>{data.category_title}</Text> : null}
            {data.is_important ? <Text style={styles.importantBadge}>Важно</Text> : null}
          </View>

          <Text style={styles.title}>{data.title}</Text>

          {data.author_name ? (
            <View style={styles.authorRow}>
              <SvgIcon name="profile" size={16} color={colors.white} />
              <Text style={styles.author}>Автор: {data.author_name}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {data.short_description ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconBox}>
            <SvgIcon name="document" size={22} color={colors.secondary} />
          </View>
          <Text style={styles.summaryText}>{data.short_description}</Text>
        </View>
      ) : null}

      <View style={styles.contentCard}>
        <Markdown>{data.content_markdown || ''}</Markdown>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    paddingBottom: 42,
    backgroundColor: '#F4F7FB',
  },
  hero: {
    minHeight: 340,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: '#101828',
    marginBottom: 16,
    justifyContent: 'flex-end',
    shadowColor: '#101828',
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#101828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,24,40,0.58)',
  },
  heroContent: {
    padding: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    overflow: 'hidden',
    color: colors.white,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
  },
  importantBadge: {
    overflow: 'hidden',
    color: colors.white,
    backgroundColor: 'rgba(229,57,53,0.88)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    color: colors.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '900',
  },
  authorRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  author: {
    color: colors.white,
    fontWeight: '800',
  },
  summaryCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: 'rgba(21,101,192,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(21,101,192,0.16)',
    marginBottom: 14,
    flexDirection: 'row',
    gap: 12,
  },
  summaryIconBox: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: 'rgba(21,101,192,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  contentCard: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});