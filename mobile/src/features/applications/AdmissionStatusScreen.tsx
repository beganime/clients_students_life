import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

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
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { AdmissionProgress } from '../../types/api';

export function AdmissionStatusScreen() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) {
    return <LoginRequired title="Войдите в аккаунт" description="Статус поступления доступен после одобрения аккаунта менеджером." />;
  }
  return <AdmissionStatusContent />;
}

function AdmissionStatusContent() {
  const userId = useAuthStore(state => state.user?.id);
  const { isOnline } = useNetworkStatus();
  const query = useQuery({
    queryKey: ['admission-status', userId],
    queryFn: applicationsApi.getAdmissionStatus,
    enabled: Boolean(userId) && isOnline,
    staleTime: 2 * 60_000,
  });

  return (
    <Screen scroll style={styles.screen} refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <RedGradientHero style={styles.hero}>
        <Badge label={query.data?.client?.sl_id || 'Личный кабинет'} variant="mint" icon="application" />
        <Text style={styles.title}>Статус поступления</Text>
        <Text style={styles.subtitle}>Здесь отдельно показан ход каждой подачи в университет. Данные обновляет ваш менеджер.</Text>
      </RedGradientHero>

      {!isOnline && query.data ? <Text style={styles.offlineNote}>Сохранённые данные. Обновим статус при подключении к интернету.</Text> : null}
      {query.data?.client ? (
        <AppCard style={styles.clientCard}>
          <Text style={styles.clientEyebrow}>Общий статус клиента</Text>
          <Text style={styles.clientStatus}>{query.data.client.status_label || 'На сопровождении'}</Text>
          <Text style={styles.clientName}>{query.data.client.full_name}</Text>
          {query.data.client.updated_at ? <Text style={styles.meta}>Обновлено {new Date(query.data.client.updated_at).toLocaleString('ru-RU')}</Text> : null}
        </AppCard>
      ) : null}

      {query.isLoading && !query.data ? <LoadingSkeleton rows={3} height={150} /> : null}
      {query.isError && !query.data ? <ErrorState title="Не удалось загрузить статус" onAction={() => query.refetch()} /> : null}
      {!isOnline && !query.data ? <EmptyState title="Статус пока не сохранён" description="Откройте этот экран при подключённом интернете, чтобы сохранить данные." /> : null}
      {!query.isLoading && !query.isError && isOnline && !query.data?.client ? <EmptyState title="Карточка клиента ещё не привязана" description="Менеджер добавит ваш профиль в систему, и здесь появится текущий статус." /> : null}
      {query.data?.client && !(query.data?.results || []).length ? (
        <EmptyState
          title="Подачи в университет пока не добавлены"
          description="После выбора университетов менеджер создаст заявки, и их этапы появятся здесь."
        />
      ) : null}

      {(query.data?.results || []).map(item => <AdmissionCard key={item.id} item={item} />)}
    </Screen>
  );
}

function AdmissionCard({ item }: { item: AdmissionProgress }) {
  const latestHistory = (item.history || []).slice(0, 4);
  return (
    <AppCard style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardHeading}>
          <Text style={styles.university}>{item.university}</Text>
          <Text style={styles.program}>{item.program}</Text>
        </View>
        <Badge label={item.stage_label} variant="blue" />
      </View>
      <View style={styles.metaRow}>
        {item.country ? <Text style={styles.meta}>{item.country}</Text> : null}
        {item.academic_year ? <Text style={styles.meta}>{item.academic_year}</Text> : null}
        <Text style={styles.meta}>Обновлено {new Date(item.updated_at).toLocaleString('ru-RU')}</Text>
      </View>
      {latestHistory.length ? (
        <View style={styles.timeline}>
          {latestHistory.map((event, index) => (
            <View style={styles.timelineRow} key={`${event.stage}-${event.created_at}-${index}`}>
              <View style={[styles.dot, index === 0 && styles.dotActive]} />
              <View style={styles.eventCopy}>
                <Text style={styles.eventTitle}>{event.stage_label}</Text>
                <Text style={styles.eventDate}>{new Date(event.created_at).toLocaleString('ru-RU')}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 230, marginBottom: spacing.lg },
  offlineNote: { color: colors.muted, marginBottom: spacing.md, marginHorizontal: spacing.md },
  clientCard: { marginBottom: spacing.lg },
  clientEyebrow: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold },
  clientStatus: { color: colors.primary, fontSize: typography.title, fontWeight: typography.weights.heavy, marginTop: spacing.xs },
  clientName: { color: colors.text, marginTop: spacing.sm, fontWeight: typography.weights.bold },
  title: { color: colors.white, fontSize: 31, lineHeight: 37, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.9)', lineHeight: 22, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  card: { marginBottom: spacing.md, borderColor: colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  cardHeading: { flex: 1 },
  university: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  program: { color: colors.muted, marginTop: spacing.xs, lineHeight: 20, fontWeight: typography.weights.medium },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  meta: { color: colors.mutedLight, fontSize: typography.tiny, fontWeight: typography.weights.bold },
  timeline: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  eventCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  eventTitle: { flex: 1, color: colors.text, fontWeight: typography.weights.bold },
  eventDate: { color: colors.mutedLight, fontSize: typography.tiny },
});
