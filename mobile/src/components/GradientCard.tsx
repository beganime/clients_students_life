import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { colors, radius, shadows, spacing } from '../constants/colors';

type Props = ViewProps & {
  children: React.ReactNode;
  from?: string;
  to?: string;
};

export function GradientCard({ children, from = colors.primaryDark, to = colors.primary, style, ...props }: Props) {
  return (
    <View {...props} style={[styles.card, { backgroundColor: from }, shadows.premium, style]}>
      <View style={[styles.glowLarge, { backgroundColor: to }]} />
      <View style={[styles.glowSmall, { backgroundColor: colors.primaryLight }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    minHeight: 210,
  },
  glowLarge: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -92,
    right: -88,
    opacity: 0.66,
  },
  glowSmall: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    bottom: -92,
    left: -76,
    opacity: 0.34,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
});
