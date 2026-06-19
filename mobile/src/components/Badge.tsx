import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/colors';
import { SvgIcon, SvgIconName } from './SvgIcon';

type Variant = 'blue' | 'mint' | 'coral' | 'orange' | 'neutral';

type Props = {
  label: string;
  variant?: Variant;
  icon?: SvgIconName;
};

function getVariant(variant: Variant) {
  switch (variant) {
    case 'mint':
      return { bg: 'rgba(16, 185, 129, 0.10)', border: 'rgba(16, 185, 129, 0.18)', text: colors.success };
    case 'coral':
      return { bg: 'rgba(244, 63, 94, 0.10)', border: 'rgba(244, 63, 94, 0.18)', text: colors.danger };
    case 'orange':
      return { bg: 'rgba(249, 115, 22, 0.10)', border: 'rgba(249, 115, 22, 0.18)', text: colors.warning };
    case 'neutral':
      return { bg: colors.surface, border: colors.border, text: colors.muted };
    default:
      return { bg: 'rgba(13, 65, 109, 0.10)', border: 'rgba(13, 65, 109, 0.18)', text: colors.secondary };
  }
}

export function Badge({ label, variant = 'blue', icon }: Props) {
  const current = getVariant(variant);

  return (
    <View style={[styles.badge, { backgroundColor: current.bg, borderColor: current.border }]}>
      {icon ? <SvgIcon name={icon} size={13} color={current.text} strokeWidth={2.3} /> : null}
      <Text style={[styles.text, { color: current.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 28,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: typography.tiny,
    fontWeight: typography.weights.heavy,
  },
});
