import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { chatApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { LoginRequired } from '../../components/LoginRequired';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';

export function ChatListScreen() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <LoginRequired
        title="Чат доступен после входа"
        description="Вы можете смотреть информацию в приложении без аккаунта, но для переписки с менеджером нужно войти или зарегистрироваться."
      />
    );
  }

  return <ChatListContent />;
}

function ChatListContent() {
  const navigation = useNavigation<any>();
  const user = useAuthStore(state => state.user);
  const [creating, setCreating] = useState(false);
  const isManager = Boolean(user?.is_manager);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: chatApi.getRooms,
    refetchInterval: 10000,
  });

  const handleCreateChat = async () => {
    try {
      setCreating(true);
      const room = await chatApi.createRoom(null);
      await refetch();
      navigation.navigate('ChatRoom', { id: room.id });
    } catch (error) {
      Alert.alert('Ошибка', getApiErrorMessage(error, 'Не удалось создать чат'));
    } finally {
      setCreating(false);
    }
  };

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
            <Text style={styles.title}>{isManager ? 'Входящие чаты' : 'Чат с менеджером'}</Text>
            <Text style={styles.subtitle}>
              {isManager
                ? 'Здесь собраны обращения клиентов из мобильного приложения. Видно онлайн-статус и последние сообщения.'
                : 'Задайте вопрос по поступлению, визе, документам или переводу. Менеджер ответит в этом диалоге.'}
            </Text>
            {!isManager ? <AppButton title="Новый чат" onPress={handleCreateChat} loading={creating} /> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={isManager ? 'Новых диалогов нет' : 'Диалогов пока нет'}
            description={isManager ? 'Когда клиент напишет в приложение, чат появится здесь.' : 'Создайте первый чат с менеджером.'}
          />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('ChatRoom', { id: item.id })}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>{isManager ? item.user_name || `Клиент #${item.user}` : `Чат #${item.id}`}</Text>
                {item.application_number ? <Text style={styles.application}>Заявка {item.application_number}</Text> : null}
              </View>
              {item.unread_count ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread_count}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cardText} numberOfLines={1}>
              {item.last_message?.text || (item.last_message?.message_type === 'image' ? 'Фото' : 'Нет сообщений')}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.status}>Статус: {item.status}</Text>
              {isManager ? (
                <Text style={[styles.presence, item.user_activity?.is_online ? styles.online : styles.offline]}>
                  {item.user_activity?.is_online ? 'online' : lastSeenText(item.user_activity?.last_seen)}
                </Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function lastSeenText(value?: string | null) {
  if (!value) return 'offline';
  return `был(а) ${new Date(value).toLocaleDateString()}`;
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    marginTop: 8,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  application: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  cardText: {
    color: colors.muted,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  status: {
    color: colors.secondary,
    fontWeight: '800',
  },
  presence: {
    fontSize: 12,
    fontWeight: '900',
  },
  online: {
    color: colors.success,
  },
  offline: {
    color: colors.muted,
  },
});
