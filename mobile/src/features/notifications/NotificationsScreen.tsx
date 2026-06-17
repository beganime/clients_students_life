import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { notificationsApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';

export function NotificationsScreen() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['my-notifications'],
    queryFn: notificationsApi.getMyNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] }),
  });

  const unreadCount = (notificationsQuery.data || []).filter(item => !item.is_read).length;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={notificationsQuery.isLoading || notificationsQuery.isError ? [] : notificationsQuery.data || []}
        refreshing={notificationsQuery.isRefetching}
        onRefresh={notificationsQuery.refetch}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View>
            <View style={[styles.hero, shadows.premium]}>
              <View style={styles.glowBlue} />
              <View style={styles.glowCoral} />
              <Badge label={`Непрочитанные: ${unreadCount}`} variant={unreadCount > 0 ? 'orange' : 'mint'} icon="bell" />
              <Text style={styles.title}>Уведомления</Text>
              <Text style={styles.subtitle}>Важные события по заявкам, чатам и персональным предложениям.</Text>
              {unreadCount > 0 ? <AppButton title="Отметить все прочитанными" variant="outline" onPress={() => markAllMutation.mutate()} style={styles.heroButton} /> : null}
            </View>
            {notificationsQuery.isLoading ? <LoadingSkeleton rows={4} height={100} /> : null}
            {notificationsQuery.isError ? <ErrorState onAction={() => notificationsQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={!notificationsQuery.isLoading && !notificationsQuery.isError ? <EmptyState title="Уведомлений пока нет" description="Когда появятся новости по заявкам или сообщениям, они будут здесь." /> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => { if (!item.is_read) markReadMutation.mutate(item.id); }}>
            <AppCard style={[styles.card, !item.is_read && styles.unreadCard]}>
              <View style={styles.row}>
                <View style={styles.iconBox}><SvgIcon name="bell" size={19} color={item.is_read ? colors.muted : colors.primary} /></View>
                <View style={styles.textBox}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.body}>{item.body}</Text>
                  <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
                {!item.is_read ? <View style={styles.dot} /> : null}
              </View>
            </AppCard>
          </Pressable>
        )}
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
  heroButton: { marginTop: spacing.lg },
  card: { marginBottom: spacing.md },
  unreadCard: { borderColor: colors.primary, backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconBox: { width: 42, height: 42, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  textBox: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy },
  body: { color: colors.muted, marginTop: spacing.xs, lineHeight: 20, fontWeight: typography.weights.medium },
  date: { color: colors.mutedLight, marginTop: spacing.sm, fontSize: typography.tiny, fontWeight: typography.weights.bold },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginTop: spacing.xs },
});
