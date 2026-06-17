import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../constants/colors';

export function Loading() {
  return (
    <View style={styles.container}>
      <View style={[styles.card, shadows.soft]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Загружаем данные...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  card: {
    minWidth: 190,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: typography.weights.bold,
  },
});
