import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/colors';
import { AppButton } from './AppButton';
import { RedGradientHero } from './RedGradientHero';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  primaryText: string;
  onPrimaryPress: () => void;
  secondaryText?: string;
  onSecondaryPress?: () => void;
};

export function CTASection({ eyebrow, title, description, primaryText, onPrimaryPress, secondaryText, onSecondaryPress }: Props) {
  return (
    <RedGradientHero style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.actions}>
        <AppButton title={primaryText} onPress={onPrimaryPress} style={styles.button} />
        {secondaryText && onSecondaryPress ? <AppButton title={secondaryText} onPress={onSecondaryPress} variant="outline" style={styles.button} /> : null}
      </View>
    </RedGradientHero>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 230,
    marginTop: spacing.xl,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: typography.tiny,
    fontWeight: typography.weights.heavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: colors.white,
    fontSize: typography.title,
    lineHeight: 32,
    fontWeight: typography.weights.heavy,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.sm,
    fontSize: typography.body,
    lineHeight: 23,
    fontWeight: typography.weights.medium,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    alignSelf: 'stretch',
  },
});
