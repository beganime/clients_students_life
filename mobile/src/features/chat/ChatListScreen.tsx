import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { chatApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { getApiErrorMessage } from '../../utils/apiError';

export function ChatListScreen() {
  const navigation = useNavigation<any>();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: chatApi.getRooms,
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
            <Text style={styles.title}>Чат с менеджером</Text>
            <Text style={styles.subtitle}>Задайте вопрос по поступлению, визе, документам или переводу.</Text>
            <AppButton title="Новый чат" onPress={handleCreateChat} loading={creating} />
          </View>
        }
        ListEmptyComponent={<EmptyState title="Диалогов пока нет" description="Создайте первый чат с менеджером." />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('ChatRoom', { id: item.id })}>
            <Text style={styles.cardTitle}>Чат #{item.id}</Text>
            <Text style={styles.cardText} numberOfLines={1}>{item.last_message?.text || 'Нет сообщений'}</Text>
            <Text style={styles.status}>Статус: {item.status}</Text>
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  cardText: {
    color: colors.muted,
    marginTop: 8,
  },
  status: {
    color: colors.secondary,
    marginTop: 8,
    fontWeight: '800',
  },
});