import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../constants/colors';

type Props = {
  rows?: number;
  height?: number;
};

export function LoadingSkeleton({ rows = 4, height = 92 }: Props) {
  return (
    <View style={styles.wrapper}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={[styles.item, { height, opacity: index % 2 ? 0.58 : 0.9 }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  item: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
