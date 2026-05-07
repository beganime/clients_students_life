import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList } from 'react-native';

import { contentApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { NewsPost } from '../../types/api';
import { getMediaUrl } from '../../utils/media';

export function NewsListScreen() {
  const navigation = useNavigation<any>();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['news'],
    queryFn: contentApi.getNews,
  });

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={data || []}
        keyExtractor={item => String(item.id)}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.hero}>
            <View style={styles.glowRed} />
            <View style={styles.glowBlue} />

            <View style={styles.heroGlass}>
              <Text style={styles.kicker}>Новости</Text>
              <Text style={styles.title}>Актуальные новости Student’s Life</Text>
              <Text style={styles.description}>
                Новости, гайды, объявления, дедлайны и важная информация для студентов.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Новостей пока нет"
            description="Добавьте опубликованные новости через админ-панель."
          />
        }
        renderItem={({ item }) => (
          <NewsCard
            item={item}
            onPress={() => navigation.navigate('NewsDetail', { slug: item.slug })}
          />
        )}
      />
    </Screen>
  );
}

function NewsCard({ item, onPress }: { item: NewsPost; onPress: () => void }) {
  const imageUrl = getMediaUrl(item.cover_image || null);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>SL</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.badgeRow}>
          {item.category_title ? <Text style={styles.badgeBlue}>{item.category_title}</Text> : null}
          {item.is_important ? <Text style={styles.badgeRed}>Важно</Text> : null}
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        {item.short_description ? (
          <Text style={styles.cardText} numberOfLines={3}>
            {item.short_description}
          </Text>
        ) : null}

        <Text style={styles.more}>Читать →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
    paddingBottom: 42,
    backgroundColor: '#F4F7FB',
  },
  hero: {
    minHeight: 230,
    borderRadius: 30,
    backgroundColor: '#101828',
    padding: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: '#101828',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  glowRed: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primary,
    top: -80,
    right: -80,
    opacity: 0.65,
  },
  glowBlue: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: colors.secondary,
    bottom: -90,
    left: -70,
    opacity: 0.72,
  },
  heroGlass: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  kicker: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: colors.white,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  description: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.86)',
    lineHeight: 22,
    fontSize: 15,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.09,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: colors.border,
  },
  imagePlaceholder: {
    width: '100%',
    height: 130,
    backgroundColor: 'rgba(229,57,53,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '900',
  },
  cardBody: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  badgeBlue: {
    overflow: 'hidden',
    backgroundColor: 'rgba(21,101,192,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(21,101,192,0.18)',
    color: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
  },
  badgeRed: {
    overflow: 'hidden',
    backgroundColor: 'rgba(229,57,53,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.18)',
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  cardText: {
    marginTop: 9,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  more: {
    marginTop: 14,
    color: colors.secondary,
    fontWeight: '900',
  },
});