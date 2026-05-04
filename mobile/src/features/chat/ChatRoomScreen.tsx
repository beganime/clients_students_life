import React, { useEffect, useRef, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { chatApi } from '../../api/endpoints';
import { createChatSocket } from '../../api/ws';
import { Loading } from '../../components/Loading';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { ChatMessage } from '../../types/api';
import { getApiErrorMessage } from '../../utils/apiError';

type R = RouteProp<RootStackParamList, 'ChatRoom'>;

export function ChatRoomScreen() {
  const route = useRoute<R>();
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const [text, setText] = useState('');
  const [socketReady, setSocketReady] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', route.params.id],
    queryFn: () => chatApi.getMessages(route.params.id),
    refetchInterval: socketReady ? false : 5000,
  });

  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        const socket = await createChatSocket(route.params.id);
        socketRef.current = socket;

        socket.onopen = () => {
          if (mounted) setSocketReady(true);
        };

        socket.onmessage = event => {
          try {
            const incoming = JSON.parse(event.data) as ChatMessage;
            queryClient.setQueryData<ChatMessage[]>(['chat-messages', route.params.id], old => {
              const current = old || [];
              if (current.some(item => item.id === incoming.id)) return current;
              return [...current, incoming];
            });
            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
          } catch (error) {
            console.log('Invalid ws message', error);
          }
        };

        socket.onerror = () => {
          if (mounted) setSocketReady(false);
        };

        socket.onclose = () => {
          if (mounted) setSocketReady(false);
        };
      } catch (error) {
        setSocketReady(false);
      }
    }

    connect();

    return () => {
      mounted = false;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [route.params.id, queryClient]);

  const handleSend = async () => {
    const message = text.trim();
    if (!message) return;

    try {
      if (socketRef.current && socketReady) {
        socketRef.current.send(JSON.stringify({ text: message }));
        setText('');
        return;
      }

      const created = await chatApi.sendMessage(route.params.id, message);
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', route.params.id], old => [...(old || []), created]);
      setText('');
    } catch (error) {
      Alert.alert('Ошибка', getApiErrorMessage(error, 'Не удалось отправить сообщение'));
    }
  };

  if (messagesQuery.isLoading) return <Loading />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.statusBar}>
        <Text style={[styles.statusText, socketReady ? styles.online : styles.offline]}>
          {socketReady ? 'Онлайн-чат подключён' : 'Соединение нестабильно, используется резервное обновление'}
        </Text>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={messagesQuery.data || []}
        keyExtractor={item => String(item.id)}
        refreshing={messagesQuery.isRefetching}
        onRefresh={messagesQuery.refetch}
        renderItem={({ item }) => {
          const isMine = item.sender_user === user?.id;
          return (
            <View style={[styles.message, isMine ? styles.myMessage : styles.otherMessage]}>
              {!isMine && item.sender_staff?.full_name ? (
                <Text style={styles.sender}>{item.sender_staff.full_name}</Text>
              ) : null}
              <Text style={[styles.messageText, isMine && styles.myMessageText]}>{item.text}</Text>
              <Text style={[styles.time, isMine && styles.myTime]}>{new Date(item.created_at).toLocaleTimeString()}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Напишите сообщение..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  online: {
    color: colors.success,
  },
  offline: {
    color: colors.warning,
  },
  list: {
    padding: 16,
    paddingBottom: 20,
  },
  message: {
    maxWidth: '82%',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sender: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  messageText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  myMessageText: {
    color: colors.white,
  },
  time: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  myTime: {
    color: '#FFE5E5',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 18,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    color: colors.text,
    fontSize: 15,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
});