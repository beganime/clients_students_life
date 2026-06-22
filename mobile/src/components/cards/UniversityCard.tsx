import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/colors';
import { University } from '../../types/api';
import { getMediaUrl } from '../../utils/media';

type Props = {
  item: University;
  onPress?: () => void;
};

export function UniversityCard({ item, onPress }: Props) {
  const imageUrl = getMediaUrl(item.cover_image || item.logo);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : <View style={styles.placeholder} />}

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          {item.partner_status ? <Text style={styles.badge}>Партнёр</Text> : null}
          {item.recognized_status ? <Text style={styles.badgeBlue}>Признаваемый</Text> : null}
        </View>

        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.location}>{[item.country_name, item.city_name].filter(Boolean).join(', ')}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.info}>{item.tuition_from || 'Цена уточняется'}</Text>
          <Text style={styles.info}>{item.languages || 'Язык уточняется'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: colors.border,
  },
  placeholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#EEF4FF',
  },
  content: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#FDECEC',
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '800',
  },
  badgeBlue: {
    backgroundColor: '#EAF2FF',
    color: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  location: {
    marginTop: 6,
    color: colors.secondary,
    fontWeight: '700',
  },
  infoRow: {
    marginTop: 12,
    gap: 6,
  },
  info: {
    color: colors.muted,
    fontSize: 13,
  },
});
