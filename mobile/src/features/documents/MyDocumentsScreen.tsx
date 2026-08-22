import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { documentsApi, UploadableFile } from '../../api/endpoints';
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
import { MyDocument, MyDocumentStatus } from '../../types/api';
import {
  getPendingDocumentUploads,
  removePendingDocumentUpload,
  savePendingDocumentUpload,
} from '../../utils/localMediaCache';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export function MyDocumentsScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<number, UploadableFile>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});
  const documentsQuery = useQuery({
    queryKey: ['my-documents'],
    queryFn: documentsApi.getMyDocuments,
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    getPendingDocumentUploads().then(items => {
      const files = Object.fromEntries(Object.entries(items).map(([id, item]) => [Number(id), item.file]));
      setPendingFiles(files);
    });
  }, []);

  async function upload(documentTypeId: number, file: UploadableFile) {
    setUploadingId(documentTypeId);
    setUploadErrors(current => ({ ...current, [documentTypeId]: '' }));
    try {
      await documentsApi.uploadMyDocument(documentTypeId, file);
      await removePendingDocumentUpload(documentTypeId);
      setPendingFiles(current => {
        const next = { ...current };
        delete next[documentTypeId];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      Alert.alert('Документ отправлен', 'Файл сохранён и передан менеджеру на проверку.');
    } catch (error: any) {
      const detail = String(error?.response?.data?.detail || 'Не удалось загрузить файл. Проверьте интернет и повторите.');
      setUploadErrors(current => ({ ...current, [documentTypeId]: detail }));
    } finally {
      setUploadingId(null);
    }
  }

  async function chooseFile(documentTypeId: number) {
    const result = await DocumentPicker.getDocumentAsync({
      type: DOCUMENT_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_FILE_SIZE) {
      Alert.alert('Файл слишком большой', 'Максимальный размер одного файла — 50 МБ.');
      return;
    }
    const file: UploadableFile = {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || undefined,
      file: asset.file,
    };
    const cachedFile = await savePendingDocumentUpload(documentTypeId, file);
    setPendingFiles(current => ({ ...current, [documentTypeId]: cachedFile }));
    await upload(documentTypeId, cachedFile);
  }

  if (!isAuthenticated) {
    return (
      <Screen scroll>
        <EmptyState
          title="Войдите в аккаунт"
          description="Загрузка документов доступна после одобрения заявки и входа по SL-ID."
          actionText="Войти"
          onAction={() => navigation.navigate('Auth', { screen: 'Login' })}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      style={styles.screen}
      refreshing={documentsQuery.isRefetching}
      onRefresh={documentsQuery.refetch}
    >
      <RedGradientHero style={styles.hero}>
        <Badge label="Личный кабинет" variant="mint" icon="document" />
        <Text style={styles.title}>Мои документы</Text>
        <Text style={styles.heroDescription}>
          PDF, DOCX, JPG или PNG до 50 МБ. После загрузки менеджер проверит документ и сообщит результат.
        </Text>
      </RedGradientHero>

      {documentsQuery.isLoading ? <LoadingSkeleton rows={4} height={190} /> : null}
      {documentsQuery.isError ? <ErrorState onAction={() => documentsQuery.refetch()} /> : null}
      {!documentsQuery.isLoading && !documentsQuery.isError && !documentsQuery.data?.length ? (
        <EmptyState title="Список документов пока пуст" description="Менеджер ещё не настроил перечень документов для загрузки." />
      ) : null}
      {documentsQuery.data?.map(document => (
        <DocumentCard
          key={document.id}
          document={document}
          pendingFile={pendingFiles[document.id]}
          error={uploadErrors[document.id]}
          loading={uploadingId === document.id}
          onChoose={() => chooseFile(document.id)}
          onRetry={() => pendingFiles[document.id] && upload(document.id, pendingFiles[document.id])}
        />
      ))}
    </Screen>
  );
}

function DocumentCard({
  document,
  pendingFile,
  error,
  loading,
  onChoose,
  onRetry,
}: {
  document: MyDocument;
  pendingFile?: UploadableFile;
  error?: string;
  loading: boolean;
  onChoose: () => void;
  onRetry: () => void;
}) {
  const status = statusMeta(document.status);
  return (
    <AppCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}><SvgIcon name="file" size={24} color={colors.primary} /></View>
        <View style={styles.cardHeading}>
          <View style={styles.titleRow}>
            <Text style={styles.documentTitle}>{document.title}</Text>
            {document.is_required ? <Text style={styles.required}>Обязательно</Text> : null}
          </View>
          <Badge label={status.label} variant={status.variant} icon={status.icon} />
        </View>
      </View>
      {document.description ? <Text style={styles.description}>{document.description}</Text> : null}
      {document.original_name ? <Text style={styles.filename}>Файл: {document.original_name}</Text> : null}
      {document.admin_comment ? (
        <View style={styles.commentBox}>
          <Text style={styles.commentTitle}>Комментарий менеджера</Text>
          <Text style={styles.comment}>{document.admin_comment}</Text>
        </View>
      ) : null}
      {pendingFile ? <Text style={styles.pending}>Сохранено для повтора: {pendingFile.name || 'документ'}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {error && pendingFile ? (
        <View style={styles.actions}>
          <AppButton title="Повторить" onPress={onRetry} loading={loading} style={styles.action} />
          <AppButton title="Выбрать другой" onPress={onChoose} variant="outline" disabled={loading} style={styles.action} />
        </View>
      ) : (
        <AppButton
          title={document.status === 'not_uploaded' ? 'Выбрать файл' : 'Загрузить заново'}
          onPress={onChoose}
          loading={loading}
          variant={document.status === 'rejected' ? 'primary' : 'outline'}
        />
      )}
    </AppCard>
  );
}

function statusMeta(status: MyDocumentStatus): { label: string; variant: 'neutral' | 'orange' | 'mint' | 'coral'; icon: 'clock' | 'check' | 'warning' | 'document' } {
  if (status === 'pending') return { label: 'На проверке', variant: 'orange', icon: 'clock' };
  if (status === 'approved') return { label: 'Принят', variant: 'mint', icon: 'check' };
  if (status === 'rejected') return { label: 'Нужно исправить', variant: 'coral', icon: 'warning' };
  return { label: 'Не загружен', variant: 'neutral', icon: 'document' };
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 230, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  heroDescription: { color: 'rgba(255,255,255,0.92)', lineHeight: 23, fontWeight: typography.weights.medium, marginTop: spacing.sm },
  card: { marginBottom: spacing.md, gap: spacing.md },
  cardHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  cardHeading: { flex: 1, gap: spacing.sm },
  titleRow: { gap: 5 },
  iconBox: { width: 50, height: 50, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  documentTitle: { color: colors.text, fontSize: typography.subtitle, lineHeight: 25, fontWeight: typography.weights.heavy },
  required: { color: colors.primary, fontSize: typography.tiny, textTransform: 'uppercase', fontWeight: typography.weights.heavy },
  description: { color: colors.muted, lineHeight: 23, fontWeight: typography.weights.medium },
  filename: { color: colors.secondary, fontWeight: typography.weights.bold },
  commentBox: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  commentTitle: { color: colors.text, fontWeight: typography.weights.heavy, marginBottom: 4 },
  comment: { color: colors.muted, lineHeight: 21 },
  pending: { color: colors.warning, fontWeight: typography.weights.bold },
  error: { color: colors.danger, lineHeight: 21, fontWeight: typography.weights.bold },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
