import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { contentApi } from '../../api/endpoints';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { UniversityCard } from '../../components/UniversityCard';
import { colors, spacing, typography } from '../../constants/colors';
import { useCatalogFavorites } from '../../store/catalogFavorites';
import { useAuthStore } from '../../store/authStore';

export function FavoriteUniversitiesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const owner = useAuthStore(state => String(state.user?.id || 'guest'));
  const favorites = useCatalogFavorites(state => state.byOwner[owner]);

  return (
    <Screen>
      <FlatList
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 28, 44) }]}
        data={favorites || []}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View>
            <RedGradientHero style={styles.hero}>
              <Badge label="Избранное" variant="mint" icon="heart" />
              <Text style={styles.title}>Сохранённые университеты</Text>
              <Text style={styles.subtitle}>Ваши вузы сохранены на этом устройстве и доступны без интернета.</Text>
            </RedGradientHero>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Избранных вузов пока нет" description="Откройте карточку университета и нажмите «В избранное»." />}
        renderItem={({ item }) => (
          <UniversityCard
            university={item}
            onPress={() => navigation.navigate('UniversityDetail', { id: item.id })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, backgroundColor: '#FEF7F5' },
  hero: { minHeight: 260, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
});
