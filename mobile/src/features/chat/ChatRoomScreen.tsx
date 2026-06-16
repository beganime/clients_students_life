import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { chatApi } from '../../api/endpoints';
import { SvgIcon } from '../../components/SvgIcon';
import { Loading } from '../../components/Loading';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { ChatMessage } from '../../types/api';
import { getApiErrorMessage } from '../../utils/apiError';
import { getMediaUrl } from '../../utils/media';

type R = RouteProp<RootStackParamList, 'ChatRoom'>;

export function ChatRoomScreen() {
  const route = useRoute<R>();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const [text, setText] = useState('');
  const [sendingText, setSendingText] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [sendError, setSendError] = useState('');

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', route.params.id],
    queryFn: () => chatApi.getMessages(route.params.id),
    refetchInterval: 5000,
  });

  const messages = useMemo(() => messagesQuery.data || [], [messagesQuery.data]);

  useEffect(() => {
    if (!messages.length) return;
    chatApi.markRead(route.params.id).catch(() => undefined);
    queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
  }, [messages.length, queryClient, route.params.id]);

  useEffect(() => {
    if (!messages.length) return;
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  const appendMessage = (message: ChatMessage) => {
    queryClient.setQueryData<ChatMessage[]>(['chat-messages', route.params.id], old => {
      const current = old || [];
      if (current.some(item => item.id === message.id)) return current;
      return [...current, message];
    });
    queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
  };

  const handleSend = async () => {
    const message = text.trim();
    if (!message || sendingText || sendingImage) return;

    try {
      setSendError('');
      setSendingText(true);
      const created = await chatApi.sendMessage(route.params.id, message);
      appendMessage(created);
      setText('');
    } catch (error) {
      const messageText = getApiErrorMessage(error, 'Не удалось отправить сообщение');
      setSendError(messageText);
      Alert.alert('Ошибка', messageText);
    } finally {
      setSendingText(false);
    }
  };

  const handlePickImage = async () => {
    if (sendingText || sendingImage) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее, чтобы отправить фото.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.72,
    });

    if (result.canceled || !result.assets.length) return;

    const asset = result.assets[0];
    const file = {
      uri: asset.uri,
      name: asset.fileName || `chat-photo-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    };

    try {
      setSendError('');
      setSendingImage(true);
      const created = await chatApi.sendImage(route.params.id, file, text);
      appendMessage(created);
      setText('');
    } catch (error) {
      const messageText = getApiErrorMessage(error, 'Не удалось отправить фото');
      setSendError(messageText);
      Alert.alert('Ошибка', messageText);
    } finally {
      setSendingImage(false);
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
        <Text style={styles.statusText}>
          {messagesQuery.isFetching ? 'Обновляем диалог...' : 'Сообщения обновляются автоматически'}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        contentContainerStyle={styles.list}
        data={messages}
        keyExtractor={item => String(item.id)}
        refreshing={messagesQuery.isRefetching}
        onRefresh={messagesQuery.refetch}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />

      {sendError ? <Text style={styles.errorText}>{sendError}</Text> : null}
      {(sendingText || sendingImage) ? (
        <View style={styles.sendingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.sendingText}>{sendingImage ? 'Отправляем фото...' : 'Отправляем сообщение...'}</Text>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <Pressable style={styles.iconButton} onPress={handlePickImage} disabled={sendingText || sendingImage}>
          <SvgIcon name="file" size={22} color={colors.secondary} />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Напишите сообщение..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!text.trim() || sendingText || sendingImage) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sendingText || sendingImage}
        >
          <Text style={styles.sendButtonText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isMine = Boolean(message.is_mine);
  const imageUrl = getMediaUrl(message.attachments?.[0]?.url || message.file || null);
  const sender = message.sender_display_name || message.sender_staff?.full_name || message.sender_user_name;

  return (
    <View style={[styles.message, isMine ? styles.myMessage : styles.otherMessage]}>
      {!isMine && sender ? <Text style={styles.sender}>{sender}</Text> : null}
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.messageImage} resizeMode="cover" /> : null}
      {message.text ? <Text style={[styles.messageText, isMine && styles.myMessageText]}>{message.text}</Text> : null}
      <View style={styles.messageFooter}>
        <Text style={[styles.time, isMine && styles.myTime]}>{new Date(message.created_at).toLocaleTimeString()}</Text>
        {isMine ? <Text style={[styles.readState, isMine && styles.myTime]}>{message.is_read ? 'прочитано' : 'отправлено'}</Text> : null}
      </View>
    </View>
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
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 20,
  },
  message: {
    maxWidth: '84%',
    borderRadius: 16,
    padding: 10,
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
  messageImage: {
    width: 220,
    height: 165,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.border,
  },
  messageText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  myMessageText: {
    color: colors.white,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 5,
  },
  time: {
    color: colors.muted,
    fontSize: 11,
  },
  readState: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  myTime: {
    color: '#FFE5E5',
  },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  sendingText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  errorText: {
    color: colors.danger,
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 12,
    fontWeight: '800',
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
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 8,
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
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
  },
});
