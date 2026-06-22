import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';

import { educationCatalogApi } from '../../api/educationCatalog';
import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type R = RouteProp<RootStackParamList, 'ProgramDetail'>;

export function ProgramDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<any>();
  const query = useQuery({
    queryKey: ['catalog', 'program', route.params.id],
    queryFn: () => educationCatalogApi.getProgram(route.params.id),
    staleTime: 1000 * 60 * 30,
  });

  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data) {
    return (
      <Screen scroll style={styles.screen}>
        <ErrorState onAction={() => query.refetch()} />
      </Screen>
    );
  }

  const program = query.data;
  const fee = program.tuition_fee
    ? `${program.tuition_fee}${program.currency ? ` ${program.currency}` : ''}`
    : 'Стоимость уточняется';
  const imageUrl = program.university_cover || program.university_logo;
  const intakeText = formatIntakes(program.intakes, program.application_deadline, program.start_date);

  return (
    <Screen scroll style={styles.screen} refreshing={query.isRefetching} onRefresh={() => query.refetch()}>
      <RedGradientHero backgroundImage={imageUrl ? { uri: imageUrl } : bannerImages.program} style={styles.hero}>
        {program.university_logo ? (
          <Image source={{ uri: program.university_logo }} style={styles.logo} resizeMode="cover" />
        ) : null}
        <Badge label="Программа" variant="mint" icon="document" />
        <Text style={styles.title}>{program.title}</Text>
        <Text style={styles.subtitle}>{program.university_name || 'Университет уточняется'}</Text>
      </RedGradientHero>

      <View style={styles.grid}>
        <Info icon="document" label="Уровень" value={program.level || 'уточняется'} />
        <Info icon="language" label="Язык" value={program.language || 'уточняется'} />
        <Info icon="clock" label="Срок" value={program.duration || 'уточняется'} />
        <Info icon="money" label="Стоимость" value={fee} />
        <Info icon="building" label="Факультет" value={program.faculty || 'уточняется'} />
        <Info icon="calendar" label="Intakes / дедлайны" value={intakeText || 'уточняется'} />
      </View>

      {program.description_markdown ? (
        <MarkdownCard title="Описание программы" text={program.description_markdown} />
      ) : null}
      <TextBlock title="Требования" text={program.requirements} />
      <TextBlock title="Документы" text={program.required_documents} />

      <SectionHeader eyebrow="Заявка" title="Подать заявку на программу" />
      <View style={styles.actions}>
        <AppButton
          title="Подать заявку на программу"
          onPress={() => navigation.navigate('ApplicationCreate', { universityId: program.university, programId: program.id })}
        />
        {program.university ? (
          <AppButton
            title="Открыть вуз"
            variant="outline"
            onPress={() => navigation.navigate('UniversityDetail', { id: program.university })}
          />
        ) : null}
      </View>
    </Screen>
  );
}

function formatIntakes(intakes?: Array<Record<string, any>>, deadline?: string, startDate?: string) {
  if (intakes?.length) {
    return intakes
      .map(item => {
        const parts = [item.name, item.start_date || item.start, item.application_deadline || item.deadline].filter(Boolean);
        return parts.join(' · ');
      })
      .filter(Boolean)
      .join('\n');
  }

  return [startDate ? `Старт: ${startDate}` : null, deadline ? `Дедлайн: ${deadline}` : null]
    .filter(Boolean)
    .join('\n');
}

function Info({ icon, label, value }: { icon: SvgIconName; label: string; value: string }) {
  return (
    <AppCard style={styles.info}>
      <View style={styles.iconBox}>
        <SvgIcon name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </AppCard>
  );
}

function MarkdownCard({ title, text }: { title: string; text?: string | null }) {
  if (!text) return null;
  return (
    <AppCard style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Markdown>{text}</Markdown>
    </AppCard>
  );
}

function TextBlock({ title, text }: { title: string; text?: string | null }) {
  if (!text) return null;
  return (
    <AppCard style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 270, marginBottom: spacing.lg },
  logo: { width: 66, height: 66, borderRadius: radius.md, backgroundColor: colors.white, marginBottom: spacing.md },
  title: {
    color: colors.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.md,
  },
  subtitle: { color: 'rgba(255,255,255,0.92)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  grid: { gap: spacing.md },
  info: { borderColor: colors.border },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: { color: colors.muted, fontWeight: typography.weights.bold },
  value: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy, marginTop: 4 },
  card: { marginTop: spacing.lg },
  cardTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.sm },
  text: { color: colors.muted, lineHeight: 22, fontWeight: typography.weights.medium },
  actions: { gap: spacing.sm },
});
