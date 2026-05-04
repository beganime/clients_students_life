import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { contentApi } from '../../api/endpoints';
import { ServiceCard } from '../../components/cards/ServiceCard';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: contentApi.getServices });
  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: contentApi.getCountries });
  const newsQuery = useQuery({ queryKey: ['news'], queryFn: contentApi.getNews });

  const isLoading = servicesQuery.isLoading || countriesQuery.isLoading || newsQuery.isLoading;
  const refreshing = servicesQuery.isRefetching || countriesQuery.isRefetching || newsQuery.isRefetching;

  const onRefresh = () => {
    servicesQuery.refetch();
    countriesQuery.refetch();
    newsQuery.refetch();
  };

  if (isLoading) return <Loading />;

  return (
    <Screen
      scroll
      style={styles.screen}
    >
      <View style={styles.hero}>
        <Text style={styles.badge}>Student’s Life</Text>
        <Text style={styles.title}>Образование за рубежом под ключ</Text>
        <Text style={styles.description}>Поступление, перевод, виза, жильё и сопровождение студентов.</Text>

        <Pressable style={styles.heroButton} onPress={() => navigation.navigate('ApplicationCreate')}>
          <Text style={styles.heroButtonText}>Подать заявку</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Услуги</Text>
      </View>

      <FlatList
        data={(servicesQuery.data || []).slice(0, 5)}
        keyExtractor={item => String(item.id)}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <ServiceCard item={item} onPress={() => navigation.navigate('ServiceDetail', { slug: item.slug })} />
        )}
      />

      <Text style={styles.sectionTitle}>Популярные страны</Text>
      <View style={styles.grid}>
        {(countriesQuery.data || []).map(country => (
          <Pressable
            key={country.id}
            style={styles.countryCard}
            onPress={() => navigation.navigate('Universities', { country: country.slug })}
          >
            <Text style={styles.countryName}>{country.name}</Text>
            <Text style={styles.countryText} numberOfLines={2}>{country.short_description}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Последние новости</Text>
      {(newsQuery.data || []).slice(0, 3).map(news => (
        <Pressable key={news.id} style={styles.newsCard} onPress={() => navigation.navigate('NewsDetail', { slug: news.slug })}>
          <Text style={styles.newsTitle}>{news.title}</Text>
          <Text style={styles.newsText} numberOfLines={2}>{news.short_description}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
  },
  hero: {
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: 22,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  description: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroButton: {
    marginTop: 18,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 8,
  },
  grid: {
    gap: 12,
    marginBottom: 14,
  },
  countryCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  countryText: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
  },
  newsCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newsTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  newsText: {
    color: colors.muted,
    marginTop: 8,
    lineHeight: 20,
  },
});