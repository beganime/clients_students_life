import React from 'react';
import { Image, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { contentApi } from '../../api/endpoints';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, spacing, typography } from '../../constants/colors';
import { getMediaUrl } from '../../utils/media';

export function StaffScreen() {
  const insets = useSafeAreaInsets();
  const staffQuery = useQuery({ queryKey: ['staff'], queryFn: contentApi.getStaff });

  return (
    <Screen>
      <FlatList
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 28, 44) }]}
        data={staffQuery.isLoading || staffQuery.isError ? [] : staffQuery.data || []}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View>
            <RedGradientHero style={styles.hero}>
              <Badge label="Команда" variant="mint" icon="profile" />
              <Text style={styles.title}>Люди, которые сопровождают студентов</Text>
              <Text style={styles.subtitle}>Менеджеры, консультанты и специалисты Student’s Life помогают пройти путь от выбора вуза до адаптации.</Text>
            </RedGradientHero>
            {staffQuery.isLoading ? <LoadingSkeleton rows={3} height={130} /> : null}
            {staffQuery.isError ? <ErrorState onAction={() => staffQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={!staffQuery.isLoading && !staffQuery.isError ? <EmptyState title="Сотрудников пока нет" description="Добавьте команду через админ-панель." /> : null}
        renderItem={({ item }) => {
          const avatarUrl = getMediaUrl(item.avatar || null);
          return (
            <AppCard style={styles.card}>
              <View style={styles.row}>
                {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" /> : <View style={styles.avatarPlaceholder}><SvgIcon name="profile" size={26} color="#B91C1C" /></View>}
                <View style={styles.textBox}>
                  <Text style={styles.name}>{item.full_name}</Text>
                  {item.position ? <Text style={styles.position}>{item.position}</Text> : null}
                  {item.languages ? <Text style={styles.meta}>Языки: {item.languages}</Text> : null}
                </View>
              </View>
              {item.bio ? <Text style={styles.bio}>{item.bio}</Text> : null}
              {item.specialization ? <Badge label={item.specialization} variant="blue" /> : null}
            </AppCard>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, backgroundColor: '#FEF7F5' },
  hero: { minHeight: 260, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  card: { marginBottom: spacing.md, borderColor: '#FFDDDD' },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 24, backgroundColor: colors.border },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 24, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFDDDD' },
  textBox: { flex: 1 },
  name: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  position: { marginTop: 4, color: '#B91C1C', fontWeight: typography.weights.bold },
  meta: { marginTop: 4, color: colors.muted, fontWeight: typography.weights.medium },
  bio: { marginBottom: spacing.md, color: colors.muted, lineHeight: 21, fontWeight: typography.weights.medium },
});
