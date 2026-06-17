import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { contentApi } from '../../api/endpoints';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { NewsPost } from '../../types/api';
import { getMediaUrl } from '../../utils/media';

export function NewsListScreen() {
  const navigation = useNavigation<any>();

  const newsQuery = useQuery({
    queryKey: ['news'],
    queryFn: contentApi.getNews,
  });

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={newsQuery.isLoading || newsQuery.isError ? [] : newsQuery.data || []}
        keyExtractor={item => String(item.id)}
        refreshing={newsQuery.isRefetching}
        onRefresh={newsQuery.refetch}
        ListHeaderComponent={
          <View>
            <View style={[styles.hero, shadows.premium]}>
              <View style={styles.glowBlue} />
              <View style={styles.glowCoral} />
              <Badge label="Новости" variant="mint" icon="news" />
              <Text style={styles.title}>Актуальное для студентов</Text>
              <Text style={styles.description}>Новости, гайды, объявления, дедлайны и важная информация от Student’s Life.</Text>
            </View>
            {newsQuery.isLoading ? <LoadingSkeleton rows={3} height={180} /> : null}
            {newsQuery.isError ? <ErrorState onAction={() => newsQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={!newsQuery.isLoading && !newsQuery.isError ? <EmptyState title="Новостей пока нет" description="Добавьте опубликованные новости через админ-панель." /> : null}
        renderItem={({ item }) => <NewsCard item={item} onPress={() => navigation.navigate('NewsDetail', { slug: item.slug })} />}
      />
    </Screen>
  );
}

function NewsCard({ item, onPress }: { item: NewsPost; onPress: () => void }) {
  const imageUrl = getMediaUrl(item.cover_image || null);

  return (
    <AnimatedPressable style={styles.cardWrap} onPress={onPress}>
      <AppCard padded={false} style={styles.card}>
        <View style={styles.imageBox}>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : <View style={styles.imagePlaceholder}><SvgIcon name="news" size={38} color={colors.primary} /></View>}
          <View style={styles.badgeRow}>
            {item.category_title ? <Badge label={item.category_title} variant="blue" /> : null}
            {item.is_important ? <Badge label="Важно" variant="coral" /> : null}
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.short_description ? <Text style={styles.cardText} numberOfLines={3}>{item.short_description}</Text> : null}
          <Text style={styles.more}>Читать дальше</Text>
        </View>
      </AppCard>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 44, backgroundColor: colors.background },
  hero: { minHeight: 280, borderRadius: radius.xl, backgroundColor: colors.primaryDark, padding: spacing.lg, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: spacing.lg },
  glowBlue: { position: 'absolute', width: 270, height: 270, borderRadius: 135, backgroundColor: colors.primary, top: -105, right: -95, opacity: 0.68 },
  glowCoral: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.accent, left: -90, bottom: -96, opacity: 0.24 },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  description: { color: 'rgba(255,255,255,0.84)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  cardWrap: { marginBottom: spacing.lg },
  card: { overflow: 'hidden' },
  imageBox: { height: 170, backgroundColor: colors.surface, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badgeRow: { position: 'absolute', left: spacing.md, top: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cardBody: { padding: spacing.lg },
  cardTitle: { color: colors.text, fontSize: typography.subtitle, lineHeight: 27, fontWeight: typography.weights.heavy },
  cardText: { marginTop: spacing.sm, color: colors.muted, fontSize: typography.body, lineHeight: 22, fontWeight: typography.weights.medium },
  more: { marginTop: spacing.md, color: colors.primary, fontWeight: typography.weights.heavy },
});
