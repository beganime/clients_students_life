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
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-applications'],
    queryFn: applicationsApi.getMyApplications,
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
        ListEmptyComponent={<EmptyState title="Заявок пока нет" description="Подайте первую заявку на поступление или другую услугу." />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.number}>{item.application_number}</Text>
            <Text style={styles.title}>{item.service_title || 'Заявка'}</Text>
            <Text style={styles.status}>Статус: {statusLabels[item.status] || item.status}</Text>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  number: {
    color: colors.primary,
    fontWeight: '900',
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