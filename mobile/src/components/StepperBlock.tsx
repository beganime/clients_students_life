import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../constants/colors';

type Step = {
  title: string;
  description?: string;
};

type Props = {
  steps: Step[];
};

export function StepperBlock({ steps }: Props) {
  return (
    <View style={styles.card}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.indexBox}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <View style={styles.stepTextBox}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            {step.description ? <Text style={styles.stepDescription}>{step.description}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.soft,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  indexBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    color: colors.primary,
    fontWeight: typography.weights.heavy,
  },
  stepTextBox: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weights.heavy,
  },
  stepDescription: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: 3,
    fontWeight: typography.weights.medium,
  },
});
