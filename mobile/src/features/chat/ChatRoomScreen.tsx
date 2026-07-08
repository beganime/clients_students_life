import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chatApi } from '../../api/endpoints';
import { AppCard } from '../../components/AppCard';
import { CachedImage } from '../../components/CachedImage';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { ChatMessage } from '../../types/api';
import { getApiErrorMessage } from '../../utils/apiError';
import { cacheLocalUploadFile } from '../../utils/localMediaCache';
import { getMediaUrl } from '../../utils/media';

type R = RouteProp<RootStackParamList, 'ChatRoom'>;

export function ChatRoomScreen() {
  const route = useRoute<R>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const [text, setText] = useState('');
  const [sendingText, setSendingText] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);
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
    if (!message || sendingText || sendingFile) return;

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

  const handlePickFile = async () => {
    if (sendingText || sendingFile) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const file = await cacheLocalUploadFile({
      uri: asset.uri,
      name: asset.name || `chat-file-${Date.now()}`,
      type: asset.mimeType || 'application/octet-stream',
      file: (asset as any).file,
    }, 'chat');

    try {
      setSendError('');
      setSendingFile(true);
      const isImageFile = (file.type || '').startsWith('image/');
      const created = isImageFile
        ? await chatApi.sendImage(route.params.id, file, text)
        : await chatApi.sendFile(route.params.id, file, text);
      appendMessage(created);
      setText('');
    } catch (error) {
      const messageText = getApiErrorMessage(error, 'Файл не отправился. Попробуйте ещё раз.');
      setSendError(messageText);
      Alert.alert('Ошибка отправки', messageText);
    } finally {
      setSendingFile(false);
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
      {sendingText || sendingFile ? (
        <View style={styles.sendingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.sendingText}>{sendingFile ? 'Отправляем файл...' : 'Отправляем сообщение...'}</Text>
        </View>
      ) : null}

      <AppCard style={[styles.inputCard, { marginBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable style={styles.iconButton} onPress={handlePickFile} disabled={sendingText || sendingFile}>
          <SvgIcon name="file" size={22} color={colors.primary} />
        </Pressable>
        <TextInput value={text} onChangeText={setText} placeholder="Напишите сообщение..." placeholderTextColor={colors.mutedLight} style={styles.input} multiline />
        <Pressable style={[styles.sendButton, (!text.trim() || sendingText || sendingFile) && styles.sendButtonDisabled]} onPress={handleSend} disabled={!text.trim() || sendingText || sendingFile}>
          <SvgIcon name="chevronRight" size={23} color={colors.white} strokeWidth={2.8} />
        </Pressable>
      </AppCard>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isMine = Boolean(message.is_mine);
  const fileUrl = getMediaUrl(message.attachments?.[0]?.url || message.file || null);
  const isImage = message.message_type === 'image' && Boolean(fileUrl);
  const isFile = message.message_type === 'file' && Boolean(fileUrl);
  const sender = message.sender_display_name || message.sender_staff?.full_name || message.sender_user_name;

  return (
    <View style={[styles.messageWrap, isMine ? styles.myWrap : styles.otherWrap]}>
      <View style={[styles.message, isMine ? styles.myMessage : styles.otherMessage]}>
        {!isMine && sender ? <Text style={styles.sender}>{sender}</Text> : null}
        {isImage && fileUrl ? <CachedImage uri={fileUrl} style={styles.messageImage} resizeMode="cover" /> : null}
        {isFile && fileUrl ? (
          <Pressable style={styles.fileBubble} onPress={() => Linking.openURL(fileUrl)}>
            <SvgIcon name="file" size={20} color={isMine ? colors.white : colors.secondary} />
            <Text style={[styles.fileBubbleText, isMine && styles.myMessageText]}>Открыть файл</Text>
          </Pressable>
        ) : null}
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
  fileBubble: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  fileBubbleText: { color: colors.secondary, fontWeight: typography.weights.heavy },
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
