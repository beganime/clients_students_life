import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { colors, radius, spacing, typography } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { ClientExam } from '../../types/api';

export function ExamsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const examsQuery = useQuery({
    queryKey: ['my-exams'],
    queryFn: notificationsApi.getMyExams,
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const acknowledgeMutation = useMutation({
    mutationFn: notificationsApi.acknowledgeExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-exams'] });
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
    },
  });

  if (!isAuthenticated) {
    return (
      <Screen scroll>
        <EmptyState
          title="Войдите в аккаунт"
          description="Экзамены доступны после одобрения заявки и входа по SL-ID."
          actionText="Войти"
          onAction={() => navigation.navigate('Auth', { screen: 'Login' })}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 28, 44) }]}
        data={examsQuery.data || []}
        keyExtractor={item => String(item.id)}
        refreshing={examsQuery.isRefetching}
        onRefresh={examsQuery.refetch}
        ListHeaderComponent={
          <View>
            <RedGradientHero style={styles.hero}>
              <Badge label="Личный кабинет" variant="mint" icon="calendar" />
              <Text style={styles.title}>Экзамены</Text>
              <Text style={styles.subtitle}>Здесь отображаются только название вуза и дата экзамена. Данные доступа остаются у менеджера.</Text>
            </RedGradientHero>
            {examsQuery.isLoading ? <LoadingSkeleton rows={3} height={130} /> : null}
            {examsQuery.isError ? <ErrorState onAction={() => examsQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={!examsQuery.isLoading && !examsQuery.isError ? (
          <EmptyState title="Экзаменов пока нет" description="Когда менеджер добавит экзамен, он появится здесь и придёт push-уведомление." />
        ) : null}
        renderItem={({ item }) => (
          <ExamCard
            exam={item}
            loading={acknowledgeMutation.isPending}
            onAcknowledge={() => acknowledgeMutation.mutate(item.id)}
          />
        )}
      />
    </Screen>
  );
}

function ExamCard({ exam, loading, onAcknowledge }: { exam: ClientExam; loading: boolean; onAcknowledge: () => void }) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconBox}><SvgIcon name="calendar" size={24} color={colors.primary} /></View>
        <View style={styles.cardText}>
          <Text style={styles.university}>{exam.university}</Text>
          <Text style={styles.date}>{formatDate(exam.exam_date)}</Text>
        </View>
      </View>
      {exam.acknowledged_by_user ? (
        <Badge label="Уведомление просмотрено" variant="mint" icon="check" />
      ) : (
        <AppButton title="Увидел уведомление" onPress={onAcknowledge} loading={loading} />
      )}
    </AppCard>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

const styles = StyleSheet.create({
  list: { padding: 20, backgroundColor: colors.background },
  hero: { minHeight: 250, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.92)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  card: { marginBottom: spacing.md, gap: spacing.md },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  iconBox: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: 'rgba(185,28,28,0.08)', alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  university: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  date: { color: colors.secondary, marginTop: 4, fontWeight: typography.weights.bold },
});
