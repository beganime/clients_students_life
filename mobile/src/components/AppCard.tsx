import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { colors, radius, shadows, spacing } from '../constants/colors';

type Props = ViewProps & {
  children: React.ReactNode;
  padded?: boolean;
  elevated?: boolean;
};

export function AppCard({ children, padded = true, elevated = true, style, ...props }: Props) {
  return (
    <View
      {...props}
      style={[
        styles.card,
        padded && styles.padded,
        elevated && shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});
