import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { radius, shadows, spacing } from '../constants/colors';

type Props = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: 'redBlue' | 'blue' | 'navy';
}>;

const gradientStops = {
  redBlue: [
    ['0%', '#FFF1F2'],
    ['13%', '#FCA5A5'],
    ['38%', '#DC2626'],
    ['64%', '#991B1B'],
    ['82%', '#1E3A8A'],
    ['100%', '#0B1220'],
  ],
  blue: [
    ['0%', '#DBEAFE'],
    ['18%', '#60A5FA'],
    ['48%', '#2563EB'],
    ['76%', '#1E3A8A'],
    ['100%', '#0B1220'],
  ],
  navy: [
    ['0%', '#1E3A8A'],
    ['38%', '#172554'],
    ['76%', '#0B1220'],
    ['100%', '#020617'],
  ],
} as const;

export function RedGradientHero({ children, style, contentStyle, variant = 'redBlue' }: Props) {
  const stops = gradientStops[variant];

  return (
    <View style={[styles.root, shadows.premium, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="heroGradient" x1="0" y1="0" x2="1" y2="1">
            {stops.map(([offset, color]) => (
              <Stop key={`${offset}-${color}`} offset={offset} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGradient)" />
      </Svg>
      <View style={styles.blueWash} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.xl,
    backgroundColor: '#0B1220',
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  blueWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  content: {
    zIndex: 2,
  },
});
