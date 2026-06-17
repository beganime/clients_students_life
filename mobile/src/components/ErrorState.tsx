import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/colors';
import { AppButton } from './AppButton';
import { SvgIcon } from './SvgIcon';

type Props = {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
};

export function ErrorState({
  title = 'Не удалось загрузить данные',
  description = 'Проверьте интернет и попробуйте снова.',
  actionText = 'Повторить',
  onAction,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <SvgIcon name="warning" size={28} color={colors.danger} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onAction ? <AppButton title={actionText} onPress={onAction} variant="outline" style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 63, 94, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
    textAlign: 'center',
  },
  description: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
