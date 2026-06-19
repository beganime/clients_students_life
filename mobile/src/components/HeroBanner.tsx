import React from 'react';
import { ImageBackground, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { radius, shadows, spacing } from '../constants/colors';
import { BrandMark } from './BrandLogo';

export type HeroBannerProps = React.PropsWithChildren<{
  backgroundImage?: ImageSourcePropType;
  showWatermark?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}>;

const gradientStops = [
  ['0%', '#B8201A', 0.94],
  ['50%', '#B71D17', 0.88],
  ['100%', '#7F1D1D', 0.96],
] as const;

const imageGradientStops = [
  ['0%', '#B8201A', 0.42],
  ['50%', '#B71D17', 0.34],
  ['100%', '#7F1D1D', 0.54],
] as const;

export function HeroBanner({ children, backgroundImage, showWatermark = false, style, contentStyle }: HeroBannerProps) {
  const stops = backgroundImage ? imageGradientStops : gradientStops;

  const content = (
    <>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="heroBannerRedGradient" x1="0" y1="0" x2="1" y2="1">
            {stops.map(([offset, color, opacity]) => (
              <Stop key={`${offset}-${color}`} offset={offset} stopColor={color} stopOpacity={opacity} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroBannerRedGradient)" />
      </Svg>
      <View style={backgroundImage ? styles.imageOverlay : styles.darkOverlay} />
      {showWatermark ? (
        <View style={styles.watermark}>
          <BrandMark size={120} onDark />
        </View>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </>
  );

  if (backgroundImage) {
    return (
      <ImageBackground source={backgroundImage} imageStyle={styles.image} style={[styles.root, shadows.premium, style]} resizeMode="cover">
        {content}
      </ImageBackground>
    );
  }

  return <View style={[styles.root, shadows.premium, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.xl,
    backgroundColor: '#B71D17',
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: radius.xl,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,0,0,0.35)',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,0,0,0.14)',
  },
  watermark: {
    position: 'absolute',
    right: -16,
    bottom: -14,
    opacity: 0.08,
  },
  content: {
    zIndex: 2,
  },
});
