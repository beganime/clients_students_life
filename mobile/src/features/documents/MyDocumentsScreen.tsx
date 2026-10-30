import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { LoginRequired } from '../../components/LoginRequired';
import { useAuthStore } from '../../store/authStore';

import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { Screen } from '../../components/Screen';
import { colors, spacing, typography } from '../../constants/colors';

export function MyDocumentsScreen() {
  const user = useAuthStore(s => s.user);
  const [uploading, setUploading] = useState<number | null>(null);
  const query = useQuery({ queryKey: ['my-documents', user?.id], queryFn: documentsApi.getMyDocuments, enabled: !!user?.id });
  if (!user) return <LoginRequired title="Войдите в аккаунт" description="Документы доступны в вашем личном кабинете." />;
  const upload = async (id: number) => {
    if (uploading !== null) return;
    setUploading(id);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const file = result.assets[0];
      if ((file.size || 0) > 10 * 1024 * 1024) throw new Error('Размер файла не должен превышать 10 МБ.');
      await documentsApi.uploadMyDocument(id, { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream', file: file.file });
      await query.refetch();
      Alert.alert('Документ отправлен', 'Менеджер проверит файл. Результат появится здесь.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      Alert.alert('Загрузка не завершена', typeof detail === 'string' ? detail : error.message || 'Проверьте подключение и повторите.');
    } finally { setUploading(null); }
  };
  const labels = { not_uploaded: 'Не загружен', pending: 'На проверке', approved: 'Принят', rejected: 'Нужны исправления' };
  return (
    <Screen scroll style={styles.screen} refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <AppCard style={styles.card}>
        <Badge label="Личный кабинет" variant="neutral" icon="document" />
        <Text style={styles.title}>Документы</Text>
        <Text style={styles.description}>
          PDF, DOCX, JPEG, PNG или WebP, до 10 МБ. После проверки менеджером документ будет принят либо отправлен на исправление.
        </Text>
      </AppCard>
      {query.isLoading && <Text>Загружаем список…</Text>}
      {query.isError && <AppButton title="Повторить загрузку списка" onPress={() => query.refetch()} />}
      {query.data?.length === 0 && <Text>Менеджер пока не добавил список документов. Напишите ему в чат.</Text>}
      {query.data?.map(doc => <AppCard key={doc.id} style={styles.card}>
        <Text style={styles.soon}>{doc.title}</Text>
        {!!doc.description && <Text>{doc.description}</Text>}
        <Text style={{ color: colors.primary }}>{labels[doc.status]}</Text>
        {!!doc.original_name && <Text>{doc.original_name}</Text>}
        {!!doc.admin_comment && <Text>Комментарий менеджера: {doc.admin_comment}</Text>}
        {doc.status !== 'approved' && <AppButton title={doc.status === 'not_uploaded' ? 'Выбрать и отправить файл' : 'Загрузить новую версию'} loading={uploading === doc.id} disabled={uploading !== null} onPress={() => upload(doc.id)} />}
      </AppCard>)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  card: { marginTop: spacing.md, gap: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: typography.weights.heavy },
  soon: { color: colors.text, fontSize: 22, fontWeight: typography.weights.heavy },
  description: { color: colors.muted, lineHeight: 23, fontWeight: typography.weights.medium },
});
