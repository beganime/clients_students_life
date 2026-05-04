import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';

import { Alert, Pressable } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../utils/apiError';

import { contentApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getMediaUrl } from '../../utils/media';

type R = RouteProp<RootStackParamList, 'UniversityDetail'>;

export function UniversityDetailScreen() {
  const queryClient = useQueryClient();
  const favoriteMutation = useMutation({
    mutationFn: () => contentApi.toggleFavoriteUniversity(route.params.slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['university', route.params.slug] });
      await queryClient.invalidateQueries({ queryKey: ['universities'] });
      await queryClient.invalidateQueries({ queryKey: ['favorite-universities'] });
    },
    onError: error => {
      Alert.alert('Ошибка', getApiErrorMessage(error, 'Не удалось изменить избранное'));
    },
  });
  const route = useRoute<R>();
  const navigation = useNavigation<any>();

  const { data, isLoading } = useQuery({
    queryKey: ['university', route.params.slug],
    queryFn: () => contentApi.getUniversity(route.params.slug),
  });

  if (isLoading) return <Loading />;
  if (!data) return null;

  const imageUrl = getMediaUrl(data.cover_image || data.logo);

  return (
    <Screen scroll style={styles.screen}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : <View style={styles.placeholder} />}

      <Text style={styles.title}>{data.name}</Text>
      <Text style={styles.location}>{[data.country_name, data.city_name].filter(Boolean).join(', ')}</Text>

      <View style={styles.badges}>
        {data.partner_status ? <Text style={styles.badgeRed}>Партнёр Student’s Life</Text> : null}
        {data.recognized_status ? <Text style={styles.badgeBlue}>Признаваемый вуз</Text> : null}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.info}>Языки: {data.languages || 'уточняется'}</Text>
        <Text style={styles.info}>Уровни: {data.education_levels || 'уточняется'}</Text>
        <Text style={styles.info}>Стоимость: {data.tuition_from || 'уточняется'}</Text>
        <Text style={styles.info}>Общежитие: {data.has_dormitory ? data.dormitory_cost || 'есть' : 'уточняется'}</Text>
        <Text style={styles.info}>Сроки подачи: {data.application_deadline || 'уточняется'}</Text>
      </View>

      <AppButton title="Подать заявку в этот вуз" onPress={() => navigation.navigate('ApplicationCreate')} />
        <Pressable style={styles.favoriteButton} onPress={() => favoriteMutation.mutate()}>
          <Text style={styles.favoriteButtonText}>{data.is_favorite ? '★ В избранном' : '☆ В избранное'}</Text>
        </Pressable>

      {data.programs?.length ? (
        <View style={styles.programsBox}>
          <Text style={styles.sectionTitle}>Программы</Text>
          {data.programs.map(program => (
            <View key={program.id} style={styles.programCard}>
              <Text style={styles.programTitle}>{program.title}</Text>
              <Text style={styles.programMeta}>Уровень: {program.level}</Text>
              <Text style={styles.programMeta}>Язык: {program.language || 'уточняется'}</Text>
              <Text style={styles.programMeta}>
                Стоимость: {program.tuition_fee ? `${program.tuition_fee} ${program.currency}` : 'уточняется'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.markdownBox}>
        <Markdown>{data.description_markdown || ''}</Markdown>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
  },
  image: {
    width: '100%',
    height: 210,
    borderRadius: 22,
    backgroundColor: colors.border,
    marginBottom: 18,
  },
  placeholder: {
    width: '100%',
    height: 130,
    borderRadius: 22,
    backgroundColor: '#EEF4FF',
    marginBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  location: {
    marginTop: 8,
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '800',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badgeRed: {
    backgroundColor: '#FDECEC',
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontWeight: '800',
  },
  badgeBlue: {
    backgroundColor: '#EAF2FF',
    color: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontWeight: '800',
  },
  infoBox: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginVertical: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    color: colors.text,
    marginBottom: 8,
  },
  programsBox: {
    marginTop: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  programCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  programTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  programMeta: {
    color: colors.muted,
    marginTop: 5,
  },
  markdownBox: {
    marginTop: 22,
  },

  favoriteButton: {
  marginTop: 12,
  alignSelf: 'flex-start',
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.primary,
  borderRadius: 999,
  paddingHorizontal: 14,
  paddingVertical: 8,
},
favoriteButtonText: {
  color: colors.primary,
  fontWeight: '900',
},
});