import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { colors, spacing, typography } from '../../constants/colors';
import { ClientExam, UserNotification } from '../../types/api';

export function NotificationsScreen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const notificationsQuery = useQuery({
    queryKey: ['my-notifications'],
    queryFn: notificationsApi.getMyNotifications,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const examsQuery = useQuery({
    queryKey: ['my-exams'],
    queryFn: notificationsApi.getMyExams,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] }),
  });

  const acknowledgeExamMutation = useMutation({
    mutationFn: notificationsApi.acknowledgeExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-exams'] });
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
    },
  });

  const unreadCount = (notificationsQuery.data || []).filter(item => !item.is_read).length;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 28, 44) }]}
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
          <NotificationCard
            item={item}
            exam={findExamForNotification(examsQuery.data || [], item)}
            markingRead={markReadMutation.isPending}
            acknowledging={acknowledgeExamMutation.isPending}
            onMarkRead={() => markReadMutation.mutate(item.id)}
            onAcknowledgeExam={examId => acknowledgeExamMutation.mutate(examId)}
          />
        )}
      />
    </Screen>
  );
}

function findExamForNotification(exams: ClientExam[], item: UserNotification) {
  if (item.related_object_type !== 'client_exam' || !item.related_object_id) return undefined;
  return exams.find(exam => exam.id === item.related_object_id);
}

function NotificationCard({
  item,
  exam,
  acknowledging,
  onMarkRead,
  onAcknowledgeExam,
}: {
  item: UserNotification;
  exam?: ClientExam;
  markingRead: boolean;
  acknowledging: boolean;
  onMarkRead: () => void;
  onAcknowledgeExam: (examId: number) => void;
}) {
  const isExam = item.related_object_type === 'client_exam';
  const canAcknowledge = Boolean(isExam && exam && !exam.acknowledged_by_user);

  return (
    <Pressable onPress={() => { if (!item.is_read) onMarkRead(); }}>
      <AppCard style={[styles.card, !item.is_read && styles.unreadCard]}>
        <View style={styles.row}>
          <View style={styles.iconBox}><SvgIcon name={isExam ? 'calendar' : 'bell'} size={19} color={item.is_read ? colors.muted : '#B91C1C'} /></View>
          <View style={styles.textBox}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            {exam ? (
              <View style={styles.examBox}>
                <Text style={styles.examTitle}>{exam.subject}</Text>
                <Text style={styles.examMeta}>{formatExamDate(exam.exam_date, exam.exam_time)}</Text>
                {exam.comment ? <Text style={styles.examComment}>{exam.comment}</Text> : null}
              </View>
            ) : null}
            <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
            {canAcknowledge ? (
              <AppButton
                title="Увидел уведомление"
                onPress={() => onAcknowledgeExam(exam!.id)}
                loading={acknowledging}
                style={styles.ackButton}
              />
            ) : null}
          </View>
          {!item.is_read ? <View style={styles.dot} /> : null}
        </View>
      </AppCard>
    </Pressable>
  );
}

function formatExamDate(dateValue: string, timeValue: string) {
  const [hours = '00', minutes = '00'] = String(timeValue || '').split(':');
  const date = new Date(`${dateValue}T${hours}:${minutes}:00`);
  if (Number.isNaN(date.getTime())) return `${dateValue} ${timeValue}`;
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  list: { padding: 20, backgroundColor: '#FEF7F5' },
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
  examBox: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: 10, backgroundColor: 'rgba(13,65,109,0.06)' },
  examTitle: { color: colors.secondary, fontWeight: typography.weights.heavy },
  examMeta: { color: colors.text, marginTop: 2, fontWeight: typography.weights.bold },
  examComment: { color: colors.muted, marginTop: 4, lineHeight: 18 },
  ackButton: { marginTop: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626', marginTop: spacing.xs },
});
