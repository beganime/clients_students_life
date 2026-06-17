import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/colors';
import { SvgIcon, SvgIconName } from './SvgIcon';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: SvgIconName;
  right?: React.ReactNode;
};

export function AppHeader({ eyebrow, title, description, icon, right }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.mainRow}>
        <View style={styles.left}>
          {icon ? (
            <View style={styles.iconBox}>
              <SvgIcon name={icon} size={24} color={colors.primary} strokeWidth={2.4} />
            </View>
          ) : null}
          <View style={styles.textBox}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  textBox: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.tiny,
    fontWeight: typography.weights.heavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    lineHeight: 32,
    fontWeight: typography.weights.heavy,
  },
  description: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  right: {
    flexShrink: 0,
  },
});
