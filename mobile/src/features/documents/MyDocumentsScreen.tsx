import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { documentsApi, UploadableFile } from '../../api/endpoints';
import { bannerImages } from '../../assets/banners';
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
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { MyDocument, MyDocumentStatus } from '../../types/api';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  cacheLocalUploadFile,
  getPendingDocumentUploads,
  removePendingDocumentUpload,
  savePendingDocumentUpload,
} from '../../utils/localMediaCache';

const STATUS_LABELS: Record<MyDocumentStatus, string> = {
  not_uploaded: 'Не загружен',
  pending: 'Отправлен на проверку',
  approved: 'Принят',
  rejected: 'Не принят',
};

const STATUS_VARIANTS: Record<MyDocumentStatus, 'neutral' | 'blue' | 'mint' | 'coral'> = {
  not_uploaded: 'neutral',
  pending: 'blue',
  approved: 'mint',
  rejected: 'coral',
};

type UploadPayload = {
  documentTypeId: number;
  file: UploadableFile;
};

export function MyDocumentsScreen() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [pendingUploads, setPendingUploads] = useState<Record<number, UploadableFile>>({});

  useEffect(() => {
    getPendingDocumentUploads()
      .then(pending => {
        const files = Object.values(pending).reduce<Record<number, UploadableFile>>((acc, item) => {
          acc[item.documentTypeId] = item.file;
          return acc;
        }, {});
        setPendingUploads(files);
      })
      .catch(() => undefined);
  }, []);

  const documentsQuery = useQuery({
    queryKey: ['my-documents'],
    queryFn: documentsApi.getMyDocuments,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ documentTypeId, file }: UploadPayload) => documentsApi.uploadMyDocument(documentTypeId, file),
    onSuccess: async (_data, variables) => {
      await removePendingDocumentUpload(variables.documentTypeId);
      setPendingUploads(prev => {
        const next = { ...prev };
        delete next[variables.documentTypeId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      Alert.alert('Документ отправлен', 'Файл загружен и отправлен менеджеру на проверку.');
    },
    onError: async (error, variables) => {
      const cachedFile = await savePendingDocumentUpload(variables.documentTypeId, variables.file);
      setPendingUploads(prev => ({ ...prev, [variables.documentTypeId]: cachedFile }));
      Alert.alert(
        'Не удалось загрузить документ',
        `${getApiErrorMessage(error)}\n\nФайл сохранён на телефоне. Попробуйте отправить его ещё раз, когда соединение будет стабильным.`,
      );
    },
  });

  const uploadFile = async (documentTypeId: number, file: UploadableFile) => {
    const cachedFile = await cacheLocalUploadFile(file, 'documents');

    if (!isOnline) {
      const pendingFile = await savePendingDocumentUpload(documentTypeId, cachedFile);
      setPendingUploads(prev => ({ ...prev, [documentTypeId]: pendingFile }));
      Alert.alert(
        'Ожидает загрузки',
        'Вы сейчас offline. Файл сохранён на телефоне, его можно отправить после подключения к интернету.',
      );
      return;
    }

    uploadMutation.mutate({ documentTypeId, file: cachedFile });
  };

  const handlePick = async (document: MyDocument) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    uploadFile(document.id, {
      uri: asset.uri,
      name: asset.name || `document-${document.id}`,
      type: asset.mimeType || 'application/octet-stream',
      file: (asset as any).file,
    });
  };

  const handlePendingUpload = (document: MyDocument) => {
    const file = pendingUploads[document.id];
    if (!file) {
      handlePick(document);
      return;
    }
    uploadFile(document.id, file);
  };

  const documents = documentsQuery.data || [];
  const uploadedCount = documents.filter(item => item.status !== 'not_uploaded').length;
  const approvedCount = documents.filter(item => item.status === 'approved').length;

  return (
    <Screen
      scroll
      style={styles.screen}
      refreshing={documentsQuery.isRefetching}
      onRefresh={() => documentsQuery.refetch()}
    >
      <RedGradientHero backgroundImage={bannerImages.application} style={styles.hero}>
        <Badge label="Личный кабинет" variant="mint" icon="check" />
        <Text style={styles.title}>Мои документы</Text>
        <Text style={styles.subtitle}>
          Загружайте документы для поступления и следите за статусом проверки. Если нужен перевод,
          менеджер добавит его отдельным типом документа.
        </Text>
      </RedGradientHero>

      <View style={styles.summaryRow}>
        <SummaryCard value={`${uploadedCount}/${documents.length || 0}`} label="загружено" />
        <SummaryCard value={`${approvedCount}`} label="принято" />
      </View>

      {!isOnline ? (
        <AppCard style={styles.offlineCard}>
          <Text style={styles.offlineTitle}>Вы сейчас offline</Text>
          <Text style={styles.offlineText}>
            Данные документов показываются из кэша. Новые файлы будут сохранены на телефоне и получат
            статус ожидания загрузки.
          </Text>
        </AppCard>
      ) : null}

      {documentsQuery.isLoading ? <LoadingSkeleton rows={4} height={150} /> : null}
      {documentsQuery.isError ? <ErrorState onAction={() => documentsQuery.refetch()} /> : null}
      {!documentsQuery.isLoading && !documentsQuery.isError && !documents.length ? (
        <EmptyState
          title="Список документов пока пуст"
          description="Менеджер или администратор добавит требуемые документы в админке."
          actionText="Обновить"
          onAction={() => documentsQuery.refetch()}
        />
      ) : null}

      <View style={styles.documentsList}>
        {documents.map(document => (
          <DocumentCard
            key={document.id}
            document={document}
            onUpload={() => handlePendingUpload(document)}
            uploading={uploadMutation.isPending && uploadMutation.variables?.documentTypeId === document.id}
            pendingUpload={Boolean(pendingUploads[document.id])}
          />
        ))}
      </View>
    </Screen>
  );
}

function SummaryCard({ value, label }: { value: string; label: string }) {
  return (
    <AppCard style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </AppCard>
  );
}

function DocumentCard({
  document,
  onUpload,
  uploading,
  pendingUpload,
}: {
  document: MyDocument;
  onUpload: () => void;
  uploading: boolean;
  pendingUpload: boolean;
}) {
  const rejected = document.status === 'rejected';
  const buttonTitle = pendingUpload
    ? 'Повторить загрузку'
    : document.status === 'not_uploaded'
      ? 'Загрузить файл'
      : rejected
        ? 'Загрузить исправленный файл'
        : 'Заменить файл';

  return (
    <AppCard style={[styles.documentCard, rejected && styles.rejectedCard]}>
      <View style={styles.documentHeader}>
        <View style={styles.documentIconBox}>
          <SvgIcon name="file" size={22} color={colors.secondary} />
        </View>
        <View style={styles.documentTitleBox}>
          <Text style={styles.documentTitle}>{document.title}</Text>
          <View style={styles.badgeRow}>
            <Badge
              label={STATUS_LABELS[document.status]}
              variant={STATUS_VARIANTS[document.status]}
              icon={document.status === 'approved' ? 'check' : 'document'}
            />
            {document.is_required ? <Badge label="Обязательный" variant="orange" icon="warning" /> : null}
          </View>
        </View>
      </View>

      {document.description ? <Text style={styles.description}>{document.description}</Text> : null}

      {document.original_name ? (
        <Text style={styles.metaText}>Файл: {document.original_name}</Text>
      ) : (
        <Text style={styles.metaText}>Файл ещё не загружен.</Text>
      )}
      {document.uploaded_at ? <Text style={styles.metaText}>Загружен: {formatDate(document.uploaded_at)}</Text> : null}
      {document.reviewed_at ? <Text style={styles.metaText}>Проверен: {formatDate(document.reviewed_at)}</Text> : null}
      {pendingUpload ? <Text style={styles.pendingText}>Файл сохранён на телефоне и ожидает отправки.</Text> : null}

      {rejected && document.admin_comment ? (
        <View style={styles.commentBox}>
          <Text style={styles.commentTitle}>Комментарий менеджера</Text>
          <Text style={styles.commentText}>{document.admin_comment}</Text>
        </View>
      ) : null}

      <AppButton title={buttonTitle} onPress={onUpload} loading={uploading} style={styles.uploadButton} />
    </AppCard>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 270, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.92)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: { flex: 1, padding: spacing.md },
  summaryValue: { color: colors.secondary, fontSize: 22, fontWeight: typography.weights.heavy },
  summaryLabel: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold, marginTop: 2 },
  offlineCard: { marginBottom: spacing.lg, borderColor: 'rgba(13,65,109,0.2)', backgroundColor: 'rgba(13,65,109,0.06)' },
  offlineTitle: { color: colors.secondary, fontSize: typography.body, fontWeight: typography.weights.heavy },
  offlineText: { color: colors.text, lineHeight: 21, marginTop: spacing.xs, fontWeight: typography.weights.medium },
  documentsList: { gap: spacing.md },
  documentCard: { borderColor: colors.border },
  rejectedCard: { borderColor: 'rgba(244,63,94,0.25)' },
  documentHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  documentIconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: 'rgba(13,65,109,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentTitleBox: { flex: 1 },
  documentTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  description: { color: colors.muted, lineHeight: 22, marginTop: spacing.md, fontWeight: typography.weights.medium },
  metaText: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold, marginTop: spacing.sm },
  pendingText: { color: colors.secondary, fontSize: typography.small, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  commentBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: 'rgba(244,63,94,0.08)' },
  commentTitle: { color: colors.danger, fontWeight: typography.weights.heavy },
  commentText: { color: colors.text, lineHeight: 21, marginTop: spacing.xs, fontWeight: typography.weights.medium },
  uploadButton: { marginTop: spacing.lg },
});

