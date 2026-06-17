import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/colors';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
};

export function SectionHeader({ eyebrow, title, description, right }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.textBox}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  textBox: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.tiny,
    fontWeight: typography.weights.heavy,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    lineHeight: 31,
    fontWeight: typography.weights.heavy,
  },
  description: {
    color: colors.muted,
    marginTop: 6,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: typography.weights.medium,
  },
  right: {
    flexShrink: 0,
  },
});
