import React from 'react';
import {
  ImageBackground,
  ImageResizeMode,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { radius, shadows, spacing } from '../constants/colors';
import { useCachedMediaUri } from '../hooks/useCachedMediaUri';
import { BrandMark } from './BrandLogo';

export type HeroBannerProps = React.PropsWithChildren<{
  backgroundImage?: ImageSourcePropType;
  backgroundResizeMode?: ImageResizeMode;
  showWatermark?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}>;

const DEFAULT_BACKGROUND_RESIZE_MODE: ImageResizeMode = 'cover';
const MIN_HERO_HEIGHT = 220;
const MAX_HERO_HEIGHT = 360;

const gradientStops = [
  ['0%', '#B8201A', 0.94],
  ['50%', '#B71D17', 0.88],
  ['100%', '#7F1D1D', 0.96],
] as const;

const imageGradientStops = [
  ['0%', '#000000', 0],
  ['50%', '#000000', 0],
  ['100%', '#000000', 0],
] as const;

export function HeroBanner({
  children,
  backgroundImage,
  backgroundResizeMode = DEFAULT_BACKGROUND_RESIZE_MODE,
  showWatermark = false,
  style,
  contentStyle,
}: HeroBannerProps) {
  const { width } = useWindowDimensions();
  const responsiveHeight = Math.min(Math.max(width * 0.58, MIN_HERO_HEIGHT), MAX_HERO_HEIGHT);
  const stops = backgroundImage ? imageGradientStops : gradientStops;
  const remoteBackgroundUri =
    backgroundImage && !Array.isArray(backgroundImage) && typeof backgroundImage === 'object' && 'uri' in backgroundImage
      ? String((backgroundImage as { uri?: string }).uri || '')
      : null;
  const cachedBackgroundUri = useCachedMediaUri(remoteBackgroundUri);
  const effectiveBackgroundImage =
    remoteBackgroundUri && cachedBackgroundUri
      ? ({ ...(backgroundImage as object), uri: cachedBackgroundUri } as ImageSourcePropType)
      : backgroundImage;

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

  if (effectiveBackgroundImage) {
    return (
      <ImageBackground
        source={effectiveBackgroundImage}
        imageStyle={styles.image}
        style={[styles.root, styles.imageRoot, { minHeight: responsiveHeight }, shadows.premium, style]}
        resizeMode={backgroundResizeMode}
      >
        {content}
      </ImageBackground>
    );
  }

  return <View style={[styles.root, { minHeight: responsiveHeight }, shadows.premium, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.xl,
    backgroundColor: '#B71D17',
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  imageRoot: {
    backgroundColor: '#8F1515',
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
    backgroundColor: 'transparent',
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
