import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, typography } from '../constants/colors';

type Props = {
  width?: number;
  compact?: boolean;
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
};

const BRAND_BLUE = '#0D416D';
const BRAND_RED = '#B8201A';
const BRAND_RED_DARK = '#B71D17';
const BRAND_LIGHT = '#E0DFDD';

export function BrandLogo({ width = 176, compact = false, onDark = false, style }: Props) {
  const markSize = compact ? Math.min(width, 42) : Math.min(width * 0.28, 54);
  const textColor = onDark ? colors.white : BRAND_BLUE;
  const subColor = onDark ? 'rgba(255,255,255,0.78)' : BRAND_RED_DARK;

  return (
    <View style={[styles.root, compact && styles.compactRoot, style]}>
      <Svg width={markSize} height={markSize} viewBox="0 0 64 64">
        <Rect x="5" y="8" width="54" height="48" rx="14" fill={onDark ? 'rgba(255,255,255,0.92)' : '#FFFFFF'} />
        <Path d="M16 40c8-2 14 0 18 6V20c-5-5-12-7-18-4v24Z" fill={BRAND_BLUE} />
        <Path d="M48 40c-8-2-14 0-18 6V20c5-5 12-7 18-4v24Z" fill={BRAND_RED} />
        <Path d="M20 19c4-.8 8 .2 12 3.2v18.2c-3.3-3.2-7.3-4.5-12-3.8V19Z" fill={BRAND_LIGHT} opacity={0.95} />
        <Path d="M44 19c-4-.8-8 .2-12 3.2v18.2c3.3-3.2 7.3-4.5 12-3.8V19Z" fill="#FFFFFF" opacity={0.78} />
        <Circle cx="32" cy="48" r="4" fill={BRAND_RED_DARK} />
      </Svg>
      {!compact ? (
        <View style={styles.textBox}>
          <Text style={[styles.name, { color: textColor }]}>Student's Life</Text>
          <Text style={[styles.sub, { color: subColor }]}>International Education</Text>
        </View>
      ) : null}
    </View>
  );
}

export function BrandMark({ size = 42, onDark = false, style }: { size?: number; onDark?: boolean; style?: StyleProp<ViewStyle> }) {
  return <BrandLogo width={size} compact onDark={onDark} style={style} />;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactRoot: {
    justifyContent: 'center',
  },
  textBox: {
    marginLeft: 10,
  },
  name: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: typography.weights.heavy,
  },
  sub: {
    marginTop: 1,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
});
