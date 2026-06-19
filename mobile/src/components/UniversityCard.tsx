import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../constants/colors';
import { University } from '../types/api';
import { AnimatedPressable } from './AnimatedPressable';
import { Badge } from './Badge';
import { SvgIcon } from './SvgIcon';

type Props = {
  university: University;
  onPress: () => void;
  onApplyPress?: () => void;
};

export function UniversityCard({ university, onPress, onApplyPress }: Props) {
  const location =
    [university.country_name, university.city_name].filter(Boolean).join(', ') ||
    'Локация уточняется';
  const imageUrl = university.cover_image || university.logo;

  return (
    <AnimatedPressable style={[styles.card, shadows.card]} onPress={onPress}>
      <View style={styles.cover}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <SvgIcon name="university" size={38} color={colors.white} strokeWidth={2.4} />
        )}
        <View style={styles.coverOverlay} />
        {university.partner_status ? (
          <View style={styles.coverBadge}>
            <Badge label="Партнёр" variant="coral" icon="star" />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{university.name}</Text>
        <View style={styles.metaRow}>
          <SvgIcon name="mapPin" size={15} color={colors.primary} />
          <Text style={styles.metaText}>{location}</Text>
        </View>
        <View style={styles.tags}>
          <Badge label={university.languages || 'Языки уточняются'} variant="neutral" icon="language" />
          <Badge label={university.tuition_from || 'Стоимость уточняется'} variant="blue" icon="money" />
          {university.has_dormitory ? (
            <Badge label="Есть общежитие" variant="mint" icon="building" />
          ) : null}
          {university.programs_count ? (
            <Badge label={`${university.programs_count} программ`} variant="neutral" icon="document" />
          ) : null}
        </View>
        <View style={styles.footer}>
          <Text style={styles.link}>Подробнее</Text>
          {onApplyPress ? (
            <AnimatedPressable style={styles.applyButton} onPress={onApplyPress} pressedScale={0.96}>
              <Text style={styles.applyText}>Заявка</Text>
            </AnimatedPressable>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cover: {
    height: 132,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76,17,17,0.22)',
  },
  coverBadge: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
  },
  body: {
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    lineHeight: 26,
    fontWeight: typography.weights.heavy,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  metaText: {
    flex: 1,
    color: colors.muted,
    fontWeight: typography.weights.bold,
  },
  tags: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  footer: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    color: colors.primary,
    fontWeight: typography.weights.heavy,
  },
  applyButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  applyText: {
    color: colors.white,
    fontWeight: typography.weights.heavy,
  },
});
