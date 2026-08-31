import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { Screen } from '../../components/Screen';
import { colors, spacing, typography } from '../../constants/colors';

export function MyDocumentsScreen() {
  return (
    <Screen scroll style={styles.screen}>
      <AppCard style={styles.card}>
        <Badge label="Личный кабинет" variant="neutral" icon="document" />
        <Text style={styles.title}>Документы</Text>
        <Text style={styles.soon}>Скоро</Text>
        <Text style={styles.description}>
          Загрузка оригиналов, переводов и других документов появится в следующем обновлении.
          Пока передавайте документы своему менеджеру привычным способом.
        </Text>
      </AppCard>
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
