import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../constants/colors';
import { SvgIcon } from './SvgIcon';

type Props = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: Props) {
  return (
    <View style={[styles.container, shadows.soft]}>
      <View style={styles.iconBox}>
        <SvgIcon name="document" size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },
});
