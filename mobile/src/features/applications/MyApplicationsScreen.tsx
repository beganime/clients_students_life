import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { applicationsApi } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { LoginRequired } from '../../components/LoginRequired';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';

const statusLabels: Record<string, string> = {
  new: 'Новая',
  accepted: 'Принята',
  manager_assigned: 'Назначен менеджер',
  consultation: 'На консультации',
  waiting_documents: 'Ожидаются документы',
  documents_received: 'Документы получены',
  in_progress: 'В работе',
  sent_to_university: 'Отправлено в университет',
  waiting_response: 'Ожидается ответ',
  approved: 'Одобрено',
  rejected: 'Отказ',
  completed: 'Завершено',
  closed: 'Закрыто',
};

const syncLabels: Record<string, string> = {
  pending: 'ожидает синхронизации',
  synced: 'передана в CRM',
  failed: 'будет передана позже',
};

export function MyApplicationsScreen() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <LoginRequired
        title="Мои заявки доступны после входа"
        description="Чтобы видеть историю заявок и статусы, войдите или зарегистрируйтесь."
      />
    );
  }

  return <MyApplicationsContent />;
}

function MyApplicationsContent() {
  const user = useAuthStore(state => state.user);
  const isManager = Boolean(user?.is_manager);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-applications', isManager ? 'manager' : 'client'],
    queryFn: applicationsApi.getMyApplications,
    refetchInterval: isManager ? 15000 : false,
  });

  if (isLoading) return <Loading />;

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
            <Text style={styles.screenTitle}>{isManager ? 'Заявки из приложения' : 'Мои заявки'}</Text>
            <Text style={styles.screenSubtitle}>
              {isManager
                ? 'Новые заявки клиентов с привязкой к manager-sl и текущим статусом.'
                : 'История обращений, выбранные страны и статус обработки.'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={isManager ? 'Заявок пока нет' : 'Заявок пока нет'}
            description={isManager ? 'Новые заявки из мобильного приложения появятся здесь.' : 'Подайте первую заявку на поступление или другую услугу.'}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.number}>{item.application_number}</Text>
              {item.manager_sl_sync_status ? (
                <Text style={[styles.sync, item.manager_sl_sync_status === 'failed' && styles.syncWarning]}>
                  {syncLabels[item.manager_sl_sync_status] || item.manager_sl_sync_status}
                </Text>
              ) : null}
            </View>
            <Text style={styles.title}>{item.service_title || 'Заявка'}</Text>
            <Text style={styles.status}>Статус: {statusLabels[item.status] || item.status}</Text>
            {isManager ? <Text style={styles.info}>Клиент: {item.full_name}</Text> : null}
            {item.target_country_name ? <Text style={styles.info}>Страна: {item.target_country_name}</Text> : null}
            {item.target_university_name ? <Text style={styles.info}>Вуз: {item.target_university_name}</Text> : null}
            {item.assigned_manager_name ? <Text style={styles.info}>Менеджер: {item.assigned_manager_name}</Text> : null}
          </View>
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
    marginBottom: 20,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  screenSubtitle: {
    color: colors.muted,
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  number: {
    color: colors.primary,
    fontWeight: '900',
  },
  sync: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '900',
  },
  syncWarning: {
    color: colors.warning,
  },
  title: {
    marginTop: 6,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  status: {
    marginTop: 8,
    color: colors.secondary,
    fontWeight: '800',
  },
  info: {
    marginTop: 6,
    color: colors.muted,
  },
});
