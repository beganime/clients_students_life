import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../constants/colors';

type Props = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function RedGradientHero({ children, style, contentStyle }: Props) {
  return (
    <View style={[styles.root, shadows.premium, style]}>
      <View style={styles.layerLightTop} />
      <View style={styles.layerScarlet} />
      <View style={styles.layerDark} />
      <View style={styles.layerWarm} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.xl,
    backgroundColor: '#DC2626',
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  layerLightTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF1F2',
    opacity: 0.14,
  },
  layerScarlet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '18%',
    height: '44%',
    backgroundColor: '#EF4444',
    opacity: 0.52,
  },
  layerDark: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '44%',
    height: '38%',
    backgroundColor: '#991B1B',
    opacity: 0.72,
  },
  layerWarm: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
    backgroundColor: '#F97316',
    opacity: 0.14,
  },
  content: {
    zIndex: 2,
  },
});
