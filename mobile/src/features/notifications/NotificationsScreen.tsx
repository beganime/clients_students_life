import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { notificationsApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';

export function NotificationsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
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

  if (isLoading) return <Loading />;

  const unreadCount = (data || []).filter(item => !item.is_read).length;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={data || []}
        refreshing={isRefetching}
        onRefresh={refetch}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Уведомления</Text>
            <Text style={styles.subtitle}>Непрочитанные: {unreadCount}</Text>
            {unreadCount > 0 ? (
              <Pressable style={styles.markAllButton} onPress={() => markAllMutation.mutate()}>
                <Text style={styles.markAllText}>Отметить все прочитанными</Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={<EmptyState title="Уведомлений пока нет" />}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.is_read && styles.unreadCard]}
            onPress={() => {
              if (!item.is_read) markReadMutation.mutate(item.id);
            }}
          >
            <View style={styles.row}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {!item.is_read ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: colors.muted,
    fontWeight: '700',
  },
  markAllButton: {
    marginTop: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  markAllText: {
    color: colors.secondary,
    fontWeight: '900',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadCard: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7F7',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
  body: {
    color: colors.muted,
    marginTop: 8,
    lineHeight: 20,
  },
  date: {
    color: colors.muted,
    marginTop: 10,
    fontSize: 12,
  },
});