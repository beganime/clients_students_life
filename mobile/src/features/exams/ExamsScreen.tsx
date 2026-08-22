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
  const exams = [...(examsQuery.data || [])].sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  const upcoming = exams.filter(item => item.exam_date >= todayKey());
  const unseenCount = exams.filter(item => !item.acknowledged_by_user).length;

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
        data={exams}
        keyExtractor={item => String(item.id)}
        refreshing={examsQuery.isRefetching}
        onRefresh={examsQuery.refetch}
        ListHeaderComponent={
          <View>
            <RedGradientHero style={styles.hero}>
              <Badge label="Личный кабинет" variant="mint" icon="calendar" />
              <Text style={styles.title}>Экзамены</Text>
              <Text style={styles.subtitle}>Все даты поступительных испытаний в одном месте. Ссылка, логин и пароль остаются у менеджера.</Text>
            </RedGradientHero>
            {!examsQuery.isLoading && !examsQuery.isError && exams.length ? (
              <AppCard style={styles.summaryCard}>
                <View style={styles.summaryIcon}><SvgIcon name="calendar" size={27} color={colors.primary} /></View>
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle}>
                    {upcoming[0] ? `Ближайший экзамен — ${shortDate(upcoming[0].exam_date)}` : 'Все экзамены завершены'}
                  </Text>
                  <Text style={styles.summarySubtitle}>
                    Предстоящих: {upcoming.length} · требуют подтверждения: {unseenCount}
                  </Text>
                </View>
              </AppCard>
            ) : null}
            {!examsQuery.isLoading && !examsQuery.isError && exams.length ? <Text style={styles.sectionTitle}>Расписание</Text> : null}
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
  const dateStatus = examDateStatus(exam.exam_date);
  return (
    <AppCard style={[styles.card, !exam.acknowledged_by_user && styles.cardUnread]}>
      <View style={styles.cardTop}>
        <View style={styles.iconBox}><SvgIcon name="calendar" size={24} color={colors.primary} /></View>
        <View style={styles.cardText}>
          <Text style={styles.university}>{exam.university}</Text>
          <Text style={styles.date}>{formatDate(exam.exam_date)}</Text>
        </View>
        <Badge label={dateStatus.label} variant={dateStatus.variant} />
      </View>
      {exam.acknowledged_by_user ? (
        <View style={styles.seenRow}>
          <SvgIcon name="check" size={17} color={colors.success} />
          <Text style={styles.seenText}>Вы подтвердили уведомление</Text>
        </View>
      ) : (
        <AppButton title="Подтвердить, что увидел" onPress={onAcknowledge} loading={loading} />
      )}
    </AppCard>
  );
}

function todayKey() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function shortDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function examDateStatus(value: string): { label: string; variant: 'orange' | 'blue' | 'neutral' | 'mint' } {
  const target = new Date(`${value}T12:00:00`);
  const now = new Date(`${todayKey()}T12:00:00`);
  const days = Math.round((target.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return { label: 'Прошёл', variant: 'neutral' };
  if (days === 0) return { label: 'Сегодня', variant: 'orange' };
  if (days === 1) return { label: 'Завтра', variant: 'orange' };
  return { label: `Через ${days} дн.`, variant: 'blue' };
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
  cardUnread: { borderColor: 'rgba(185,28,28,0.34)', borderWidth: 1.5 },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  iconBox: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: 'rgba(185,28,28,0.08)', alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  university: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  date: { color: colors.secondary, marginTop: 4, fontWeight: typography.weights.bold },
  summaryCard: { marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.border },
  summaryIcon: { width: 58, height: 58, borderRadius: radius.lg, backgroundColor: 'rgba(185,28,28,0.08)', alignItems: 'center', justifyContent: 'center' },
  summaryText: { flex: 1 },
  summaryTitle: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy, lineHeight: 22 },
  summarySubtitle: { color: colors.muted, marginTop: 5, fontSize: typography.small, lineHeight: 19, fontWeight: typography.weights.medium },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.md },
  seenRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.xs },
  seenText: { color: colors.success, fontWeight: typography.weights.bold, fontSize: typography.small },
});
