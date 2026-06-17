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
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, spacing, typography } from '../../constants/colors';

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
            <RedGradientHero style={styles.hero}>
              <Badge label={`Непрочитанные: ${unreadCount}`} variant={unreadCount > 0 ? 'orange' : 'mint'} icon="bell" />
              <Text style={styles.title}>Уведомления</Text>
              <Text style={styles.subtitle}>Важные события по заявкам, чатам и персональным предложениям.</Text>
              {unreadCount > 0 ? <AppButton title="Отметить все прочитанными" variant="outline" onPress={() => markAllMutation.mutate()} style={styles.heroButton} /> : null}
            </RedGradientHero>
            {notificationsQuery.isLoading ? <LoadingSkeleton rows={4} height={100} /> : null}
            {notificationsQuery.isError ? <ErrorState onAction={() => notificationsQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={!notificationsQuery.isLoading && !notificationsQuery.isError ? <EmptyState title="Уведомлений пока нет" description="Когда появятся новости по заявкам или сообщениям, они будут здесь." /> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => { if (!item.is_read) markReadMutation.mutate(item.id); }}>
            <AppCard style={[styles.card, !item.is_read && styles.unreadCard]}>
              <View style={styles.row}>
                <View style={styles.iconBox}><SvgIcon name="bell" size={19} color={item.is_read ? colors.muted : '#B91C1C'} /></View>
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
  list: { padding: 20, paddingBottom: 44, backgroundColor: '#FEF7F5' },
  hero: { minHeight: 260, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  heroButton: { marginTop: spacing.lg },
  card: { marginBottom: spacing.md, borderColor: '#FFDDDD' },
  unreadCard: { borderColor: '#B91C1C', backgroundColor: '#FEF2F2' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconBox: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  textBox: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy },
  body: { color: colors.muted, marginTop: spacing.xs, lineHeight: 20, fontWeight: typography.weights.medium },
  date: { color: colors.mutedLight, marginTop: spacing.sm, fontSize: typography.tiny, fontWeight: typography.weights.bold },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626', marginTop: spacing.xs },
});
