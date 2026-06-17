import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../constants/colors';
import { AppButton } from './AppButton';

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
    <View style={[styles.card, shadows.premium]}>
      <View style={styles.glowBlue} />
      <View style={styles.glowCoral} />
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.actions}>
        <AppButton title={primaryText} onPress={onPrimaryPress} style={styles.button} />
        {secondaryText && onSecondaryPress ? <AppButton title={secondaryText} onPress={onSecondaryPress} variant="outline" style={styles.button} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.primaryDark,
    overflow: 'hidden',
    marginTop: spacing.xl,
  },
  glowBlue: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary,
    top: -95,
    right: -85,
    opacity: 0.62,
  },
  glowCoral: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: colors.accent,
    bottom: -96,
    left: -78,
    opacity: 0.28,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.74)',
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
    color: 'rgba(255,255,255,0.84)',
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
