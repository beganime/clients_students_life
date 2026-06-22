import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/colors';
import { Service } from '../../types/api';
import { getMediaUrl } from '../../utils/media';

type Props = {
  item: Service;
  onPress?: () => void;
};

export function ServiceCard({ item, onPress }: Props) {
  const imageUrl = getMediaUrl(item.cover_image || item.icon);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : <View style={styles.placeholder} />}
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={3}>{item.short_description}</Text>
        {item.estimated_time ? <Text style={styles.meta}>Сроки: {item.estimated_time}</Text> : null}
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
    height: 150,
    backgroundColor: colors.border,
  },
  placeholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#FDECEC',
  },
  content: {
    padding: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  description: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    marginTop: 10,
    color: colors.secondary,
    fontWeight: '700',
  },
});
