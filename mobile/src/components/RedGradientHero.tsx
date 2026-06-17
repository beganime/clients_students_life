import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { radius, shadows, spacing } from '../constants/colors';

type Props = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}>;

const stops = [
  ['0%', '#FCA5A5'],
  ['18%', '#F87171'],
  ['44%', '#EF4444'],
  ['70%', '#DC2626'],
  ['100%', '#7F1D1D'],
] as const;

export function RedGradientHero({ children, style, contentStyle }: Props) {
  return (
    <View style={[styles.root, shadows.premium, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="redHeroGradient" x1="0" y1="0" x2="1" y2="1">
            {stops.map(([offset, color]) => (
              <Stop key={`${offset}-${color}`} offset={offset} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#redHeroGradient)" />
      </Svg>
      <View style={styles.softShade} />
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
  softShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(127,29,29,0.10)',
  },
  content: {
    zIndex: 2,
  },
});
