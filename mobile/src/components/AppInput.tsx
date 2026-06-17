import React from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/colors';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  right?: React.ReactNode;
  wrapperStyle?: StyleProp<ViewStyle>;
};

export function AppInput({ label, error, helper, right, style, wrapperStyle, ...props }: Props) {
  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, error && styles.inputError]}>
        <TextInput
          placeholderTextColor={colors.mutedLight}
          style={[styles.input, style]}
          {...props}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    color: colors.text,
    fontSize: typography.small,
    fontWeight: typography.weights.bold,
  },
  inputShell: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 52,
    color: colors.text,
    fontSize: typography.body,
  },
  right: {
    marginLeft: spacing.sm,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.04)',
  },
  error: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  helper: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 12,
    fontWeight: typography.weights.medium,
  },
});
