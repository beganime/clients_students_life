import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';

import { contentApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { getMediaUrl } from '../../utils/media';

type R = RouteProp<RootStackParamList, 'UniversityDetail'>;

export function UniversityDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const { data, isLoading } = useQuery({
    queryKey: ['university', route.params.slug],
    queryFn: () => contentApi.getUniversity(route.params.slug),
  });

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

  const handleFavoritePress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Нужен вход',
        'Чтобы добавлять университеты в избранное, войдите или зарегистрируйтесь.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Войти',
            onPress: () => navigation.navigate('Auth', { screen: 'Login' }),
          },
        ],
      );
      return;
    }

    favoriteMutation.mutate();
  };

  const handleApplyPress = () => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }

    navigation.navigate('ApplicationCreate', {
      universityId: data?.id,
    });
  };

  if (isLoading) return <Loading />;
  if (!data) return null;

  const imageUrl = getMediaUrl(data.cover_image || data.logo || null);

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.hero}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <SvgIcon name="university" size={44} color={colors.white} />
          </View>
        )}

        <View style={styles.imageOverlay} />

        <Pressable style={styles.favoriteFloating} onPress={handleFavoritePress}>
          <SvgIcon
            name={data.is_favorite ? 'heartFilled' : 'heart'}
            size={24}
            color={colors.primary}
          />
        </Pressable>

        <View style={styles.heroContent}>
          <Text style={styles.title}>{data.name}</Text>

          <View style={styles.locationRow}>
            <SvgIcon name="mapPin" size={17} color={colors.white} />
            <Text style={styles.location}>
              {[data.country_name, data.city_name].filter(Boolean).join(', ') || 'Локация уточняется'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.badges}>
        {data.partner_status ? <Badge title="Партнёр Student’s Life" type="red" /> : null}
        {data.recognized_status ? <Badge title="Признаваемый вуз" type="blue" /> : null}
      </View>

      <View style={styles.infoGrid}>
        <InfoCard icon="language" label="Языки" value={data.languages || 'уточняется'} />
        <InfoCard icon="document" label="Уровни" value={data.education_levels || 'уточняется'} />
        <InfoCard icon="money" label="Стоимость" value={data.tuition_from || 'уточняется'} />
        <InfoCard icon="building" label="Общежитие" value={data.has_dormitory ? data.dormitory_cost || 'есть' : 'уточняется'} />
        <InfoCard icon="calendar" label="Сроки подачи" value={data.application_deadline || 'уточняется'} />
      </View>

      <View style={styles.actions}>
        <AppButton title="Подать заявку в этот вуз" onPress={handleApplyPress} />

        <Pressable style={styles.favoriteButton} onPress={handleFavoritePress}>
          <SvgIcon
            name={data.is_favorite ? 'heartFilled' : 'heart'}
            size={19}
            color={colors.primary}
          />
          <Text style={styles.favoriteButtonText}>
            {data.is_favorite ? 'В избранном' : 'Добавить в избранное'}
          </Text>
        </Pressable>
      </View>

      {data.programs?.length ? (
        <View style={styles.programsBox}>
          <Text style={styles.sectionTitle}>Программы</Text>

          {data.programs.map(program => (
            <View key={program.id} style={styles.programCard}>
              <Text style={styles.programTitle}>{program.title}</Text>

              <ProgramMeta icon="document" text={`Уровень: ${program.level}`} />
              <ProgramMeta icon="language" text={`Язык: ${program.language || 'уточняется'}`} />
              <ProgramMeta
                icon="money"
                text={`Стоимость: ${program.tuition_fee ? `${program.tuition_fee} ${program.currency}` : 'уточняется'}`}
              />
            </View>
          ))}
        </View>
      ) : null}

      {data.description_markdown ? (
        <View style={styles.markdownBox}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Markdown>{data.description_markdown}</Markdown>
        </View>
      ) : null}
    </Screen>
  );
}

function Badge({ title, type }: { title: string; type: 'red' | 'blue' }) {
  return (
    <View style={[styles.badge, type === 'red' ? styles.badgeRed : styles.badgeBlue]}>
      <SvgIcon
        name={type === 'red' ? 'star' : 'check'}
        size={14}
        color={type === 'red' ? colors.primary : colors.secondary}
      />
      <Text style={[styles.badgeText, type === 'red' ? styles.badgeTextRed : styles.badgeTextBlue]}>
        {title}
      </Text>
    </View>
  );
}

function InfoCard({ icon, label, value }: { icon: SvgIconName; label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIconBox}>
        <SvgIcon name={icon} size={21} color={colors.secondary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ProgramMeta({ icon, text }: { icon: SvgIconName; text: string }) {
  return (
    <View style={styles.programMetaRow}>
      <SvgIcon name={icon} size={15} color={colors.secondary} />
      <Text style={styles.programMeta}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    paddingBottom: 42,
    backgroundColor: '#F4F7FB',
  },
  hero: {
    minHeight: 340,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: '#101828',
    marginBottom: 16,
    justifyContent: 'flex-end',
    shadowColor: '#101828',
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#101828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,24,40,0.54)',
  },
  favoriteFloating: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
  },
  heroContent: {
    padding: 22,
  },
  title: {
    color: colors.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '900',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
  },
  location: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeRed: {
    backgroundColor: 'rgba(229,57,53,0.1)',
    borderColor: 'rgba(229,57,53,0.18)',
  },
  badgeBlue: {
    backgroundColor: 'rgba(21,101,192,0.1)',
    borderColor: 'rgba(21,101,192,0.18)',
  },
  badgeText: {
    fontWeight: '900',
    fontSize: 12,
  },
  badgeTextRed: {
    color: colors.primary,
  },
  badgeTextBlue: {
    color: colors.secondary,
  },
  infoGrid: {
    gap: 12,
    marginBottom: 18,
  },
  infoCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(21,101,192,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  infoValue: {
    marginTop: 4,
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  favoriteButton: {
    minHeight: 50,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.2)',
    backgroundColor: 'rgba(255,255,255,0.86)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButtonText: {
    color: colors.primary,
    fontWeight: '900',
  },
  programsBox: {
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    marginBottom: 12,
  },
  programCard: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  programTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
    lineHeight: 23,
    marginBottom: 9,
  },
  programMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 6,
  },
  programMeta: {
    flex: 1,
    color: colors.muted,
    fontWeight: '700',
  },
  markdownBox: {
    marginTop: 18,
    borderRadius: 26,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
  },
});