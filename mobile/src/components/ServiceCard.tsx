import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../constants/colors';
import { Service } from '../types/api';
import { AnimatedPressable } from './AnimatedPressable';
import { Badge } from './Badge';
import { SvgIcon } from './SvgIcon';

type Props = {
  service: Service;
  onPress: () => void;
  onApplyPress?: () => void;
};

export function ServiceCard({ service, onPress, onApplyPress }: Props) {
  return (
    <AnimatedPressable style={[styles.card, shadows.card]} onPress={onPress}>
      <View style={styles.glow} />
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <SvgIcon name="services" size={24} color={colors.primary} strokeWidth={2.4} />
        </View>
        <Badge label="Услуга" variant="blue" />
      </View>
      <Text style={styles.title}>{service.title}</Text>
      <Text style={styles.description} numberOfLines={3}>
        {service.short_description || 'Подробная поддержка от Student’s Life.'}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.link}>Подробнее</Text>
        {onApplyPress ? (
          <AnimatedPressable style={styles.applyButton} onPress={onApplyPress} pressedScale={0.96}>
            <Text style={styles.applyText}>Заявка</Text>
          </AnimatedPressable>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -70,
    top: -75,
    backgroundColor: colors.surface,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.md,
  },
  description: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  footer: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  link: {
    color: colors.primary,
    fontWeight: typography.weights.heavy,
  },
  applyButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  applyText: {
    color: colors.white,
    fontWeight: typography.weights.heavy,
  },
});
