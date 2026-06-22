import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chatApi } from '../../api/endpoints';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { ChatMessage } from '../../types/api';
import { getApiErrorMessage } from '../../utils/apiError';
import { getMediaUrl } from '../../utils/media';

type R = RouteProp<RootStackParamList, 'ChatRoom'>;

export function ChatRoomScreen() {
  const route = useRoute<R>();
  const insets = useSafeAreaInsets();
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
      const messageText = getApiErrorMessage(error, 'Сообщение не отправилось. Проверьте интернет и попробуйте снова.');
      setSendError(messageText);
      Alert.alert('Ошибка отправки', messageText);
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
      const messageText = getApiErrorMessage(error, 'Фото не отправилось. Попробуйте ещё раз.');
      setSendError(messageText);
      Alert.alert('Ошибка отправки', messageText);
    } finally {
      setSendingImage(false);
    }
  };

  if (messagesQuery.isLoading) return <Loading />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={[styles.header, shadows.soft]}>
        <View style={styles.headerIcon}><SvgIcon name="chat" size={22} color={colors.primary} /></View>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Чат с менеджером</Text>
          <Text style={styles.headerSubtitle}>{messagesQuery.isFetching ? 'Обновляем диалог...' : 'Сообщения обновляются автоматически'}</Text>
        </View>
      </View>

      {messagesQuery.isError ? (
        <View style={styles.errorWrap}><ErrorState onAction={() => messagesQuery.refetch()} /></View>
      ) : (
        <FlatList
          ref={listRef}
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + spacing.xl, spacing.xl) }]}
          data={messages}
          keyExtractor={item => String(item.id)}
          refreshing={messagesQuery.isRefetching}
          onRefresh={messagesQuery.refetch}
          ListEmptyComponent={<EmptyState title="Пока нет сообщений" description="Напишите менеджеру, и мы поможем с поступлением, визой и документами." />}
          renderItem={({ item }) => <MessageBubble message={item} />}
        />
      )}

      {sendError ? <Text style={styles.errorText}>{sendError}</Text> : null}
      {sendingText || sendingImage ? (
        <View style={styles.sendingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.sendingText}>{sendingImage ? 'Отправляем фото...' : 'Отправляем сообщение...'}</Text>
        </View>
      ) : null}

      <AppCard style={[styles.inputCard, { marginBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable style={styles.iconButton} onPress={handlePickImage} disabled={sendingText || sendingImage}>
          <SvgIcon name="file" size={22} color={colors.primary} />
        </Pressable>
        <TextInput value={text} onChangeText={setText} placeholder="Напишите сообщение..." placeholderTextColor={colors.mutedLight} style={styles.input} multiline />
        <Pressable style={[styles.sendButton, (!text.trim() || sendingText || sendingImage) && styles.sendButtonDisabled]} onPress={handleSend} disabled={!text.trim() || sendingText || sendingImage}>
          <SvgIcon name="chevronRight" size={23} color={colors.white} strokeWidth={2.8} />
        </Pressable>
      </AppCard>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isMine = Boolean(message.is_mine);
  const imageUrl = getMediaUrl(message.attachments?.[0]?.url || message.file || null);
  const sender = message.sender_display_name || message.sender_staff?.full_name || message.sender_user_name;

  return (
    <View style={[styles.messageWrap, isMine ? styles.myWrap : styles.otherWrap]}>
      <View style={[styles.message, isMine ? styles.myMessage : styles.otherMessage]}>
        {!isMine && sender ? <Text style={styles.sender}>{sender}</Text> : null}
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.messageImage} resizeMode="cover" /> : null}
        {message.text ? <Text style={[styles.messageText, isMine && styles.myMessageText]}>{message.text}</Text> : null}
        <View style={styles.messageFooter}>
          <Text style={[styles.time, isMine && styles.myTime]}>{new Date(message.created_at).toLocaleTimeString()}</Text>
          {isMine ? <Text style={[styles.readState, styles.myTime]}>{message.is_read ? 'прочитано' : 'отправлено'}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 46, height: 46, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerTextBox: { flex: 1 },
  headerTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  headerSubtitle: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold, marginTop: 2 },
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  errorWrap: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  messageWrap: { marginBottom: spacing.sm },
  myWrap: { alignItems: 'flex-end' },
  otherWrap: { alignItems: 'flex-start' },
  message: { maxWidth: '84%', borderRadius: 22, padding: spacing.md },
  myMessage: { backgroundColor: colors.primary, borderBottomRightRadius: 7 },
  otherMessage: { backgroundColor: colors.card, borderBottomLeftRadius: 7, borderWidth: 1, borderColor: colors.border, ...shadows.soft },
  sender: { color: colors.primary, fontSize: 12, fontWeight: typography.weights.heavy, marginBottom: 4 },
  messageImage: { width: 220, height: 165, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: colors.border },
  messageText: { color: colors.text, fontSize: typography.body, lineHeight: 22 },
  myMessageText: { color: colors.white },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs, marginTop: spacing.xs },
  time: { color: colors.mutedLight, fontSize: 11 },
  readState: { color: colors.mutedLight, fontSize: 11, fontWeight: typography.weights.bold },
  myTime: { color: 'rgba(255,255,255,0.78)' },
  sendingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.card },
  sendingText: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold },
  errorText: { color: colors.danger, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, fontSize: typography.small, fontWeight: typography.weights.bold },
  inputCard: { margin: spacing.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, borderRadius: radius.lg },
  iconButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, minHeight: 46, maxHeight: 120, borderRadius: radius.md, backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 10, color: colors.text, fontSize: typography.body },
  sendButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.45 },
});
