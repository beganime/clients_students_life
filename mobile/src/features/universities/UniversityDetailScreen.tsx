import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';

import { contentApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { CTASection } from '../../components/CTASection';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';
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

  const universityQuery = useQuery({ queryKey: ['university', route.params.slug], queryFn: () => contentApi.getUniversity(route.params.slug) });

  const favoriteMutation = useMutation({
    mutationFn: () => contentApi.toggleFavoriteUniversity(route.params.slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['university', route.params.slug] });
      await queryClient.invalidateQueries({ queryKey: ['universities'] });
      await queryClient.invalidateQueries({ queryKey: ['favorite-universities'] });
    },
    onError: error => Alert.alert('Не удалось изменить избранное', getApiErrorMessage(error, 'Попробуйте ещё раз.')),
  });

  const handleFavoritePress = () => {
    if (!isAuthenticated) {
      Alert.alert('Нужен вход', 'Чтобы сохранять университеты, войдите или зарегистрируйтесь.', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Войти', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) },
      ]);
      return;
    }
    favoriteMutation.mutate();
  };

  const handleApplyPress = () => navigation.navigate('ApplicationCreate', { universityId: universityQuery.data?.id });

  if (universityQuery.isLoading) return <Loading />;
  if (universityQuery.isError) {
    return <Screen scroll style={styles.screen}><ErrorState onAction={() => universityQuery.refetch()} /></Screen>;
  }
  if (!universityQuery.data) return null;

  const data = universityQuery.data;
  const imageUrl = getMediaUrl(data.cover_image || data.logo || null);
  const location = [data.country_name, data.city_name].filter(Boolean).join(', ') || 'Локация уточняется';

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero style={styles.hero}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.logoImage} /> : null}
        <Pressable style={styles.favoriteFloating} onPress={handleFavoritePress}>
          <SvgIcon name={data.is_favorite ? 'heartFilled' : 'heart'} size={24} color="#DC2626" />
        </Pressable>
        <View style={styles.badgeRow}>
          {data.partner_status ? <Badge label="Партнёр Student’s Life" variant="coral" icon="star" /> : null}
          {data.recognized_status ? <Badge label="Признаваемый вуз" variant="mint" icon="check" /> : null}
        </View>
        <Text style={styles.title}>{data.name}</Text>
        <View style={styles.locationRow}>
          <SvgIcon name="mapPin" size={17} color={colors.white} />
          <Text style={styles.location}>{location}</Text>
        </View>
      </RedGradientHero>

      <View style={styles.actions}>
        <AppButton title="Подать заявку в этот вуз" onPress={handleApplyPress} />
        <AppButton title={data.is_favorite ? 'В избранном' : 'Добавить в избранное'} variant="outline" onPress={handleFavoritePress} />
      </View>

      <SectionHeader eyebrow="Ключевая информация" title="Что важно знать" />
      <View style={styles.infoGrid}>
        <InfoCard icon="language" label="Языки" value={data.languages || 'уточняется'} />
        <InfoCard icon="document" label="Уровни" value={data.education_levels || 'уточняется'} />
        <InfoCard icon="money" label="Стоимость от" value={data.tuition_from || 'уточняется'} />
        <InfoCard icon="building" label="Общежитие" value={data.has_dormitory ? data.dormitory_cost || 'есть' : 'уточняется'} />
        <InfoCard icon="calendar" label="Сроки подачи" value={data.application_deadline || 'уточняется'} />
      </View>

      {data.programs?.length ? <><SectionHeader eyebrow="Программы" title="Доступные программы" /><View style={styles.programsList}>{data.programs.map(program => <AppCard key={program.id} style={styles.programCard}><Text style={styles.programTitle}>{program.title}</Text><ProgramMeta icon="document" text={`Уровень: ${program.level || 'уточняется'}`} /><ProgramMeta icon="language" text={`Язык: ${program.language || 'уточняется'}`} /><ProgramMeta icon="money" text={`Стоимость: ${program.tuition_fee ? `${program.tuition_fee} ${program.currency || ''}` : 'уточняется'}`} /></AppCard>)}</View></> : null}

      {data.description_markdown ? <AppCard style={styles.markdownBox}><Text style={styles.sectionTitle}>Описание</Text><Markdown>{data.description_markdown}</Markdown></AppCard> : null}

      <CTASection eyebrow="Поступление" title="Хотите поступить в этот вуз?" description="Заявка ни к чему не обязывает. Менеджер проверит данные и объяснит следующие шаги." primaryText="Оставить заявку" onPrimaryPress={handleApplyPress} secondaryText="Открыть чат" onSecondaryPress={() => navigation.navigate('Chat')} />
    </Screen>
  );
}

function InfoCard({ icon, label, value }: { icon: SvgIconName; label: string; value: string }) {
  return <AppCard style={styles.infoCard}><View style={styles.infoIconBox}><SvgIcon name={icon} size={21} color="#B91C1C" /></View><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></AppCard>;
}

function ProgramMeta({ icon, text }: { icon: SvgIconName; text: string }) {
  return <View style={styles.programMetaRow}><SvgIcon name={icon} size={15} color="#B91C1C" /><Text style={styles.programMeta}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FEF7F5' },
  hero: { minHeight: 360, marginBottom: spacing.lg },
  logoImage: { width: 82, height: 82, borderRadius: 26, backgroundColor: colors.white, marginBottom: spacing.md },
  favoriteFloating: { position: 'absolute', top: spacing.lg, right: spacing.lg, width: 50, height: 50, borderRadius: 25, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFDDDD' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy },
  locationRow: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  location: { flex: 1, color: colors.white, fontWeight: typography.weights.bold },
  actions: { gap: spacing.sm, marginBottom: spacing.lg },
  infoGrid: { gap: spacing.md },
  infoCard: { padding: spacing.lg, borderColor: '#FFDDDD' },
  infoIconBox: { width: 48, height: 48, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  infoLabel: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold },
  infoValue: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy, marginTop: 3 },
  programsList: { gap: spacing.md },
  programCard: { padding: spacing.lg, borderColor: '#FFDDDD' },
  programTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.sm },
  programMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  programMeta: { flex: 1, color: colors.muted, fontWeight: typography.weights.bold },
  markdownBox: { marginTop: spacing.xl, borderColor: '#FFDDDD' },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.md },
});
