import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { radius, shadows, spacing } from '../constants/colors';

type Props = ViewProps & {
  children: React.ReactNode;
};

export function GradientCard({ children, style, ...props }: Props) {
  return (
    <View {...props} style={[styles.card, shadows.premium, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="softRedCardGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FCA5A5" />
            <Stop offset="34%" stopColor="#EF4444" />
            <Stop offset="68%" stopColor="#DC2626" />
            <Stop offset="100%" stopColor="#7F1D1D" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#softRedCardGradient)" />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    minHeight: 210,
    backgroundColor: '#DC2626',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
});
