import React from 'react';
import { Image, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { contentApi } from '../../api/endpoints';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { getMediaUrl } from '../../utils/media';

export function StaffScreen() {
  const staffQuery = useQuery({ queryKey: ['staff'], queryFn: contentApi.getStaff });

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={staffQuery.isLoading || staffQuery.isError ? [] : staffQuery.data || []}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View>
            <View style={[styles.hero, shadows.premium]}>
              <View style={styles.glowBlue} />
              <View style={styles.glowCoral} />
              <Badge label="Команда" variant="mint" icon="profile" />
              <Text style={styles.title}>Люди, которые сопровождают студентов</Text>
              <Text style={styles.subtitle}>Менеджеры, консультанты и специалисты Student’s Life помогают пройти путь от выбора вуза до адаптации.</Text>
            </View>
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
                {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><SvgIcon name="profile" size={26} color={colors.primary} /></View>}
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
  list: { padding: 20, paddingBottom: 44, backgroundColor: colors.background },
  hero: { minHeight: 280, borderRadius: radius.xl, backgroundColor: colors.primaryDark, padding: spacing.lg, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: spacing.lg },
  glowBlue: { position: 'absolute', width: 270, height: 270, borderRadius: 135, backgroundColor: colors.primary, top: -105, right: -95, opacity: 0.68 },
  glowCoral: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.accent, left: -90, bottom: -96, opacity: 0.24 },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.84)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 24, backgroundColor: colors.border },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  textBox: { flex: 1 },
  name: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  position: { marginTop: 4, color: colors.primary, fontWeight: typography.weights.bold },
  meta: { marginTop: 4, color: colors.muted, fontWeight: typography.weights.medium },
  bio: { marginBottom: spacing.md, color: colors.muted, lineHeight: 21, fontWeight: typography.weights.medium },
});
