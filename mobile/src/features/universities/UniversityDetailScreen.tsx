import React, { useMemo, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';

import { educationCatalogApi } from '../../api/educationCatalog';
import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { CTASection } from '../../components/CTASection';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { Program } from '../../types/api';

type R = RouteProp<RootStackParamList, 'UniversityDetail'>;

export function UniversityDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<any>();
  const [programSearch, setProgramSearch] = useState('');
  const [programSort, setProgramSort] = useState<'title' | 'price' | 'duration'>('title');
  const universityQuery = useQuery({
    queryKey: ['catalog', 'university', route.params.id],
    queryFn: () => educationCatalogApi.getUniversity(route.params.id),
    staleTime: 1000 * 60 * 30,
  });
  const programsQuery = useQuery({
    queryKey: ['catalog', 'programs', { university: universityQuery.data?.id || route.params.id }],
    queryFn: () => educationCatalogApi.getPrograms({ university: universityQuery.data?.id || route.params.id }),
    enabled: Boolean(universityQuery.data?.id || route.params.id),
    staleTime: 1000 * 60 * 30,
  });
  const universityPrograms = useMemo(() => {
    const fetchedPrograms = programsQuery.data || [];
    if (fetchedPrograms.length) return fetchedPrograms;
    return universityQuery.data?.programs || [];
  }, [programsQuery.data, universityQuery.data?.programs]);
  const visiblePrograms = useMemo(() => {
    const queryText = programSearch.trim().toLowerCase();
    const programs = [...universityPrograms].filter(program => {
      if (!queryText) return true;
      return [program.title, program.faculty, program.specialty, program.level, program.language]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(queryText));
    });

    return programs.sort((left, right) => {
      if (programSort === 'price') {
        return parseMoney(left.tuition_fee) - parseMoney(right.tuition_fee);
      }
      if (programSort === 'duration') {
        return String(left.duration || '').localeCompare(String(right.duration || ''), 'ru');
      }
      return String(left.title || '').localeCompare(String(right.title || ''), 'ru');
    });
  }, [programSearch, programSort, universityPrograms]);

  const handleApplyPress = () => navigation.navigate('ApplicationCreate', { universityId: universityQuery.data?.id });

  if (universityQuery.isLoading) return <Loading />;
  if (universityQuery.isError) {
    return (
      <Screen scroll style={styles.screen}>
        <ErrorState onAction={() => universityQuery.refetch()} />
      </Screen>
    );
  }
  if (!universityQuery.data) return null;

  const data = universityQuery.data;
  const imageUrl = data.cover_image || data.logo || null;
  const location = [data.country_name, data.city_name].filter(Boolean).join(', ') || 'Локация уточняется';
  const contacts = [data.phone, data.email, data.official_website].filter(Boolean).join('\n');

  return (
    <Screen
      scroll
      style={styles.screen}
      refreshing={universityQuery.isRefetching || programsQuery.isRefetching}
      onRefresh={() => {
        universityQuery.refetch();
        programsQuery.refetch();
      }}
    >
      <RedGradientHero backgroundImage={imageUrl ? { uri: imageUrl } : bannerImages.university} style={styles.hero}>
        {data.logo ? <Image source={{ uri: data.logo }} style={styles.logoImage} resizeMode="cover" /> : null}
        <View style={styles.badgeRow}>
          <Badge label="Каталог через прокси" variant="mint" icon="check" />
          {data.programs_count ? <Badge label={`${data.programs_count} программ`} variant="neutral" icon="document" /> : null}
        </View>
        <Text style={styles.title}>{data.name}</Text>
        <View style={styles.locationRow}>
          <SvgIcon name="mapPin" size={17} color={colors.white} />
          <Text style={styles.location}>{location}</Text>
        </View>
      </RedGradientHero>

      <View style={styles.actions}>
        <AppButton title="Подать заявку в этот вуз" onPress={handleApplyPress} />
        {data.city ? (
          <AppButton
            title="Показать город"
            variant="outline"
            onPress={() => navigation.navigate('CityDetail', { id: data.city, countryId: data.country })}
          />
        ) : null}
      </View>

      <SectionHeader eyebrow="Ключевая информация" title="Что важно знать" />
      <View style={styles.infoGrid}>
        <InfoCard icon="language" label="Языки" value={data.languages || 'уточняется'} />
        <InfoCard icon="document" label="Уровни" value={data.education_levels || 'уточняется'} />
        <InfoCard icon="money" label="Стоимость от" value={data.tuition_from || 'уточняется'} />
        <InfoCard
          icon="building"
          label="Общежитие"
          value={data.has_dormitory ? data.dormitory_cost || 'есть' : 'уточняется'}
        />
      </View>

      {data.description_markdown ? (
        <MarkdownCard title="Описание" text={data.description_markdown} />
      ) : null}
      <TextBlock title="Контакты" text={contacts || data.public_contacts || data.contacts} actionUrl={data.official_website} />
      <TextBlock title="Условия поступления" text={data.admission_requirements} />
      <TextBlock title="Приглашение и зачисление" text={data.invitation_info} />
      <TextBlock title="Общежитие" text={data.dormitory_info} />
      <TextBlock title="Расходы" text={data.expenses_info} />
      <TextBlock title="Документы" text={data.required_documents} />

      <SectionHeader eyebrow="Программы" title="Доступные программы" />
      {programsQuery.isLoading ? <LoadingSkeleton rows={3} height={150} /> : null}
      {!programsQuery.isLoading && !universityPrograms.length ? (
        <EmptyState title="Программы пока не добавлены" description="Можно отправить заявку по вузу, менеджер уточнит детали." />
      ) : null}
      {!programsQuery.isLoading && universityPrograms.length ? (
        <View style={styles.programsList}>
          <AppCard style={styles.programFilters}>
            <View style={styles.searchBox}>
              <SvgIcon name="search" size={19} color={colors.mutedLight} />
              <TextInput
                value={programSearch}
                onChangeText={setProgramSearch}
                placeholder="Поиск по программам, факультету, языку"
                placeholderTextColor={colors.mutedLight}
                style={styles.searchInput}
              />
            </View>
            <View style={styles.sortRow}>
              <SortChip label="Название" active={programSort === 'title'} onPress={() => setProgramSort('title')} />
              <SortChip label="Стоимость" active={programSort === 'price'} onPress={() => setProgramSort('price')} />
              <SortChip label="Срок" active={programSort === 'duration'} onPress={() => setProgramSort('duration')} />
            </View>
            <Text style={styles.programCount}>Показано программ: {visiblePrograms.length}</Text>
          </AppCard>

          {visiblePrograms.map((program: Program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onOpen={() => navigation.navigate('ProgramDetail', { id: program.id })}
              onApply={() => navigation.navigate('ApplicationCreate', { universityId: data.id, programId: program.id })}
            />
          ))}
          {!visiblePrograms.length ? (
            <AppCard style={styles.programCard}>
              <Text style={styles.emptyText}>По этому запросу программ не найдено.</Text>
            </AppCard>
          ) : null}
        </View>
      ) : null}

      <CTASection
        eyebrow="Поступление"
        title="Хотите поступить в этот вуз?"
        description="Заявка ни к чему не обязывает. Менеджер проверит данные и объяснит следующие шаги."
        primaryText="Оставить заявку"
        onPrimaryPress={handleApplyPress}
        secondaryText="Открыть чат"
        onSecondaryPress={() => navigation.navigate('Chat')}
      />
    </Screen>
  );
}

function InfoCard({ icon, label, value }: { icon: SvgIconName; label: string; value: string }) {
  return (
    <AppCard style={styles.infoCard}>
      <View style={styles.infoIconBox}>
        <SvgIcon name={icon} size={21} color={colors.primary} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </AppCard>
  );
}

function MarkdownCard({ title, text }: { title: string; text?: string | null }) {
  if (!text) return null;

  return (
    <AppCard style={styles.markdownBox}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Markdown>{text}</Markdown>
    </AppCard>
  );
}

function TextBlock({ title, text, actionUrl }: { title: string; text?: string | null; actionUrl?: string | null }) {
  if (!text) return null;

  return (
    <AppCard style={styles.textBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      {actionUrl ? (
        <AppButton title="Открыть сайт" variant="outline" onPress={() => Linking.openURL(actionUrl)} style={styles.inlineButton} />
      ) : null}
    </AppCard>
  );
}

function ProgramCard({ program, onOpen, onApply }: { program: Program; onOpen: () => void; onApply: () => void }) {
  const fee = program.tuition_fee
    ? `${program.tuition_fee}${program.currency ? ` ${program.currency}` : ''}`
    : 'Стоимость уточняется';

  return (
    <AppCard style={styles.programCard}>
      <Text style={styles.programTitle}>{program.title}</Text>
      <ProgramMeta icon="document" text={`Уровень: ${program.level || 'уточняется'}`} />
      <ProgramMeta icon="language" text={`Язык: ${program.language || 'уточняется'}`} />
      <ProgramMeta icon="clock" text={`Срок: ${program.duration || 'уточняется'}`} />
      <ProgramMeta icon="money" text={`Стоимость: ${fee}`} />
      <View style={styles.programActions}>
        <AppButton title="Открыть" variant="outline" onPress={onOpen} style={styles.programButton} />
        <AppButton title="Заявка" onPress={onApply} style={styles.programButton} />
      </View>
    </AppCard>
  );
}

function ProgramMeta({ icon, text }: { icon: SvgIconName; text: string }) {
  return (
    <View style={styles.programMetaRow}>
      <SvgIcon name={icon} size={15} color={colors.primary} />
      <Text style={styles.programMeta}>{text}</Text>
    </View>
  );
}

function SortChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.sortChip, active && styles.sortChipActive]} onPress={onPress}>
      <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function parseMoney(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return Number.MAX_SAFE_INTEGER;
  const normalized = String(value).replace(/\s/g, '').replace(',', '.').match(/\d+(\.\d+)?/);
  return normalized ? Number(normalized[0]) : Number.MAX_SAFE_INTEGER;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 300, marginBottom: spacing.lg },
  logoImage: { width: 78, height: 78, borderRadius: radius.md, backgroundColor: colors.white, marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy },
  locationRow: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  location: { flex: 1, color: colors.white, fontWeight: typography.weights.bold },
  actions: { gap: spacing.sm, marginBottom: spacing.lg },
  infoGrid: { gap: spacing.md },
  infoCard: { padding: spacing.lg },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold },
  infoValue: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy, marginTop: 3 },
  markdownBox: { marginTop: spacing.lg },
  textBlock: { marginTop: spacing.md },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.md },
  text: { color: colors.muted, fontSize: typography.body, lineHeight: 23, fontWeight: typography.weights.medium },
  inlineButton: { marginTop: spacing.md },
  programsList: { gap: spacing.md },
  programFilters: { padding: spacing.md },
  searchBox: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: { flex: 1, minHeight: 46, color: colors.text, fontSize: typography.body },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortChipText: { color: colors.muted, fontWeight: typography.weights.bold },
  sortChipTextActive: { color: colors.white },
  programCount: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold, marginTop: spacing.sm },
  programCard: { padding: spacing.lg },
  programTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.sm },
  programMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  programMeta: { flex: 1, color: colors.muted, fontWeight: typography.weights.bold },
  programActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  programButton: { flex: 1 },
  emptyText: { color: colors.muted, lineHeight: 22, fontWeight: typography.weights.bold },
});
