import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { chatApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { LoginRequired } from '../../components/LoginRequired';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';

export function ChatListScreen() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) {
    return <LoginRequired title="Чат доступен после входа" description="Напишите менеджеру после регистрации. Так вы сможете видеть историю сообщений и быстрее получать ответы." />;
  }
  return <ChatListContent />;
}

function ChatListContent() {
  const navigation = useNavigation<any>();
  const user = useAuthStore(state => state.user);
  const [creating, setCreating] = useState(false);
  const isManager = Boolean(user?.is_manager);

  const roomsQuery = useQuery({ queryKey: ['chat-rooms'], queryFn: chatApi.getRooms, refetchInterval: 10000 });

  const handleCreateChat = async () => {
    try {
      setCreating(true);
      const room = await chatApi.createRoom(null);
      await roomsQuery.refetch();
      navigation.navigate('ChatRoom', { id: room.id });
    } catch (error) {
      Alert.alert('Не удалось создать чат', getApiErrorMessage(error, 'Попробуйте ещё раз или оставьте заявку.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={roomsQuery.isLoading || roomsQuery.isError ? [] : roomsQuery.data || []}
        refreshing={roomsQuery.isRefetching}
        onRefresh={roomsQuery.refetch}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View>
            <View style={[styles.hero, shadows.premium]}>
              <View style={styles.glowBlue} />
              <View style={styles.glowMint} />
              <Text style={styles.kicker}>{isManager ? 'Manager inbox' : 'Чат с менеджером'}</Text>
              <Text style={styles.title}>{isManager ? 'Входящие обращения клиентов' : 'Задайте вопрос по поступлению'}</Text>
              <Text style={styles.subtitle}>{isManager ? 'Следите за статусом клиентов и последними сообщениями.' : 'Напишите менеджеру: поможем с вузами, документами, визой и сроками.'}</Text>
              {!isManager ? <AppButton title="Новый чат" onPress={handleCreateChat} loading={creating} style={styles.heroButton} /> : null}
            </View>
            {roomsQuery.isLoading ? <LoadingSkeleton rows={3} height={108} /> : null}
            {roomsQuery.isError ? <ErrorState onAction={() => roomsQuery.refetch()} /> : null}
          </View>
        }
        ListEmptyComponent={
          !roomsQuery.isLoading && !roomsQuery.isError ? <EmptyState title={isManager ? 'Новых диалогов нет' : 'Пока нет сообщений'} description={isManager ? 'Когда клиент напишет в приложение, чат появится здесь.' : 'Напишите менеджеру, и мы поможем с поступлением.'} /> : null
        }
        renderItem={({ item }) => {
          const title = isManager ? item.user_name || 'Клиент' : 'Чат с менеджером';
          const lastText = item.last_message?.text || (item.last_message?.message_type === 'image' ? 'Фото' : 'Сообщений пока нет');
          return (
            <AnimatedPressable style={styles.cardWrap} onPress={() => navigation.navigate('ChatRoom', { id: item.id })}>
              <AppCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}><SvgIcon name="chat" size={22} color={colors.primary} /></View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    {item.application_number ? <Text style={styles.application}>Заявка {item.application_number}</Text> : null}
                  </View>
                  {item.unread_count ? <View style={styles.badge}><Text style={styles.badgeText}>{item.unread_count}</Text></View> : null}
                </View>
                <Text style={styles.cardText} numberOfLines={1}>{lastText}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.status}>Статус: {item.status}</Text>
                  {isManager ? <Text style={[styles.presence, item.user_activity?.is_online ? styles.online : styles.offline]}>{item.user_activity?.is_online ? 'online' : 'offline'}</Text> : null}
                </View>
              </AppCard>
            </AnimatedPressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 44, backgroundColor: colors.background },
  hero: { minHeight: 300, borderRadius: radius.xl, backgroundColor: colors.primaryDark, padding: spacing.lg, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: spacing.lg },
  glowBlue: { position: 'absolute', width: 270, height: 270, borderRadius: 135, backgroundColor: colors.primary, top: -105, right: -95, opacity: 0.68 },
  glowMint: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.success, left: -90, bottom: -96, opacity: 0.22 },
  kicker: { color: 'rgba(255,255,255,0.72)', fontSize: typography.tiny, fontWeight: typography.weights.heavy, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  subtitle: { color: 'rgba(255,255,255,0.84)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  heroButton: { marginTop: spacing.lg },
  cardWrap: { marginBottom: spacing.md },
  card: { padding: spacing.lg },
  cardHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  cardTitleWrap: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  application: { color: colors.primary, fontSize: 12, fontWeight: typography.weights.heavy, marginTop: 4 },
  badge: { minWidth: 28, height: 28, borderRadius: 14, paddingHorizontal: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: typography.weights.heavy },
  cardText: { color: colors.muted, marginTop: spacing.md, fontWeight: typography.weights.medium },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.sm },
  status: { color: colors.primary, fontWeight: typography.weights.bold },
  presence: { fontSize: 12, fontWeight: typography.weights.heavy },
  online: { color: colors.success },
  offline: { color: colors.mutedLight },
});
