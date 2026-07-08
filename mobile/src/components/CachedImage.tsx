import React from 'react';
import { Image, ImageResizeMode, ImageStyle, StyleProp } from 'react-native';

import { useCachedMediaUri } from '../hooks/useCachedMediaUri';

type CachedImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
};

export function CachedImage({ uri, style, resizeMode = 'cover' }: CachedImageProps) {
  const sourceUri = useCachedMediaUri(uri);

  if (!sourceUri) return null;

  return <Image source={{ uri: sourceUri }} style={style} resizeMode={resizeMode} />;
}

