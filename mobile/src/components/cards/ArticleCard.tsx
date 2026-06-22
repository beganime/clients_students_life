import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/colors';
import { getMediaUrl } from '../../utils/media';

type Props = {
  title: string;
  description?: string;
  image?: string | null;
  category?: string;
  author?: string;
  onPress?: () => void;
};

export function ArticleCard({ title, description, image, category, author, onPress }: Props) {
  const imageUrl = getMediaUrl(image);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
      <View style={styles.content}>
        {category ? <Text style={styles.category}>{category}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description} numberOfLines={3}>{description}</Text> : null}
        {author ? <Text style={styles.author}>Автор: {author}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
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
  content: {
    padding: 16,
  },
  category: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
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
  author: {
    marginTop: 10,
    color: colors.secondary,
    fontWeight: '700',
  },
});
