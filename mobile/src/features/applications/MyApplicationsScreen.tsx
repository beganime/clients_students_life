import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { applicationsApi } from '../../api/endpoints';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { LoginRequired } from '../../components/LoginRequired';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { colors, spacing, typography } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';

const statusLabels: Record<string, string> = {
  new: 'Новая', accepted: 'Принята', manager_assigned: 'Назначен менеджер', consultation: 'На консультации', waiting_documents: 'Ожидаются документы', documents_received: 'Документы получены', in_progress: 'В работе', sent_to_university: 'Отправлено в университет', waiting_response: 'Ожидается ответ', approved: 'Одобрено', rejected: 'Отказ', completed: 'Завершено', closed: 'Закрыто',
};

const syncLabels: Record<string, string> = {
  pending: 'ожидает синхронизации', synced: 'передана в CRM', failed: 'будет передана позже',
};

export function MyApplicationsScreen() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <LoginRequired title="Мои заявки доступны после входа" description="Чтобы видеть историю заявок и статусы, войдите или зарегистрируйтесь." />;
  }

  return <MyApplicationsContent />;
}

function MyApplicationsContent() {
  const user = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();
  const isManager = Boolean(user?.is_manager);

  const applicationsQuery = useQuery({
    queryKey: ['my-applications', isManager ? 'manager' : 'client'],
    queryFn: applicationsApi.getMyApplications,
    refetchInterval: isManager ? 15000 : false,
  });

  return (
    <Screen>
      <FlatList
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 28, 44) }]}
        data={applicationsQuery.isLoading || applicationsQuery.isError ? [] : applicationsQuery.data || []}
        refreshing={applicationsQuery.isRefetching}
        onRefresh={applicationsQuery.refetch}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View>
            <RedGradientHero style={styles.hero}>
              <Badge label={isManager ? 'Manager panel' : 'История заявок'} variant="mint" icon="document" />
              <Text style={styles.title}>{isManager ? 'Заявки из приложения' : 'Мои заявки'}</Text>
              <Text style={styles.subtitle}>{isManager ? 'Новые заявки клиентов с текущим статусом и CRM-синхронизацией.' : 'Здесь сохраняется история обращений, выбранные страны и статус обработки.'}</Text>
            </RedGradientHero>
            {applicationsQuery.isLoading ? <LoadingSkeleton rows={3} height={132} /> : null}
            {applicationsQuery.isError ? <ErrorState onAction={() => applicationsQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={!applicationsQuery.isLoading && !applicationsQuery.isError ? <EmptyState title="Заявок пока нет" description={isManager ? 'Новые заявки из мобильного приложения появятся здесь.' : 'Подайте первую заявку на поступление или другую услугу.'} /> : null}
        renderItem={({ item }) => (
          <AppCard style={styles.card}>
            <View style={styles.topRow}>
              <Badge label={item.application_number} variant="blue" />
              {item.manager_sl_sync_status ? <Badge label={syncLabels[item.manager_sl_sync_status] || item.manager_sl_sync_status} variant={item.manager_sl_sync_status === 'failed' ? 'orange' : 'mint'} /> : null}
            </View>
            <Text style={styles.cardTitle}>{item.service_title || 'Заявка'}</Text>
            <Text style={styles.status}>Статус: {statusLabels[item.status] || item.status}</Text>
            {isManager ? <InfoLine label="Клиент" value={item.full_name} /> : null}
            {item.target_country_name ? <InfoLine label="Страна" value={item.target_country_name} /> : null}
            {item.target_university_name ? <InfoLine label="Вуз" value={item.target_university_name} /> : null}
            {item.assigned_manager_name ? <InfoLine label="Менеджер" value={item.assigned_manager_name} /> : null}
          </AppCard>
        )}
      />
    </Screen>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <Text style={styles.info}>{label}: {value}</Text>;
}

const styles = StyleSheet.create({
  list: { padding: 20, backgroundColor: '#FEF7F5' },
  hero: { minHeight: 260, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  card: { marginBottom: spacing.md, borderColor: '#FFDDDD' },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  cardTitle: { marginTop: spacing.md, color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  status: { marginTop: spacing.sm, color: '#B91C1C', fontWeight: typography.weights.heavy },
  info: { marginTop: spacing.xs, color: colors.muted, lineHeight: 20, fontWeight: typography.weights.medium },
});
