import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';

import { contentApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { CTASection } from '../../components/CTASection';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { StepperBlock } from '../../components/StepperBlock';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getMediaUrl } from '../../utils/media';

type R = RouteProp<RootStackParamList, 'ServiceDetail'>;

const serviceSteps = [
  { title: 'Консультация', description: 'Менеджер уточняет задачу, страну, сроки и документы.' },
  { title: 'Проверка данных', description: 'Проверяем анкету, контактные данные и текущую ситуацию студента.' },
  { title: 'План действий', description: 'Объясняем этапы, сроки, оплату и следующий шаг.' },
];

export function ServiceDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<any>();

  const serviceQuery = useQuery({
    queryKey: ['service', route.params.slug],
    queryFn: () => contentApi.getService(route.params.slug),
  });

  if (serviceQuery.isLoading) return <Loading />;

  if (serviceQuery.isError) {
    return (
      <Screen scroll style={styles.screen}>
        <ErrorState onAction={() => serviceQuery.refetch()} />
      </Screen>
    );
  }

  if (!serviceQuery.data) return null;

  const data = serviceQuery.data;
  const imageUrl = getMediaUrl(data.cover_image || data.icon || null);

  return (
    <Screen scroll style={styles.screen}>
      <View style={[styles.hero, shadows.premium]}>
        <View style={styles.glowBlue} />
        <View style={styles.glowCoral} />
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.heroImage} /> : null}
        <View style={styles.iconBox}>
          <SvgIcon name="services" size={34} color={colors.white} strokeWidth={2.4} />
        </View>
        <Badge label="Услуга Student’s Life" variant="mint" />
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.description}>{data.short_description || 'Комплексная поддержка по выбранной услуге.'}</Text>
        <View style={styles.heroActions}>
          <AppButton title={data.button_text || 'Подать заявку'} onPress={() => navigation.navigate('ApplicationCreate', { serviceId: data.id })} />
          <AppButton title="Написать в чат" variant="outline" onPress={() => navigation.navigate('Chat')} />
        </View>
      </View>

      <SectionHeader eyebrow="Что входит" title="Что входит в услугу" />
      <View style={styles.grid}>
        <InfoCard icon="check" title="Персональный разбор" text="Менеджер объяснит, что подходит именно под вашу ситуацию." />
        <InfoCard icon="document" title="Документы" text={data.required_documents || 'Список документов зависит от страны, вуза и услуги.'} />
        <InfoCard icon="clock" title="Сроки" text={data.estimated_time || 'Сроки уточняются после консультации и проверки документов.'} />
      </View>

      <SectionHeader eyebrow="Этапы" title="Как проходит оформление" description="Без сложных технических формулировок — только понятные шаги." />
      <StepperBlock steps={serviceSteps} />

      <AppCard style={styles.documentsCard}>
        <Text style={styles.documentsTitle}>Какие документы могут понадобиться</Text>
        <DocLine text="паспорт или документ, удостоверяющий личность" />
        <DocLine text="аттестат, диплом или справка об обучении" />
        <DocLine text="переводы документов, фото, контакты и анкета" />
        <Text style={styles.documentsNote}>Точный список менеджер даст после первичной консультации.</Text>
      </AppCard>

      {data.description_markdown ? (
        <AppCard style={styles.markdownBox}>
          <Text style={styles.sectionTitle}>Подробнее</Text>
          <Markdown>{data.description_markdown}</Markdown>
        </AppCard>
      ) : null}

      <CTASection
        eyebrow="Следующий шаг"
        title="Оставьте заявку — она ни к чему не обязывает"
        description="Менеджер свяжется с вами и объяснит, какие действия нужны дальше."
        primaryText="Оставить заявку"
        onPrimaryPress={() => navigation.navigate('ApplicationCreate', { serviceId: data.id })}
        secondaryText="Открыть чат"
        onSecondaryPress={() => navigation.navigate('Chat')}
      />
    </Screen>
  );
}

function InfoCard({ icon, title, text }: { icon: SvgIconName; title: string; text: string }) {
  return (
    <AppCard style={styles.infoCard}>
      <View style={styles.infoIconBox}>
        <SvgIcon name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </AppCard>
  );
}

function DocLine({ text }: { text: string }) {
  return (
    <View style={styles.docLine}>
      <SvgIcon name="check" size={16} color={colors.success} />
      <Text style={styles.docText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  hero: {
    minHeight: 350,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryDark,
    padding: spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  glowBlue: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primary,
    top: -105,
    right: -95,
    opacity: 0.68,
  },
  glowCoral: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.accent,
    left: -90,
    bottom: -96,
    opacity: 0.24,
  },
  heroImage: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 78,
    height: 78,
    borderRadius: 26,
    opacity: 0.9,
  },
  iconBox: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.md,
  },
  description: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  heroActions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  grid: {
    gap: spacing.md,
  },
  infoCard: {
    padding: spacing.lg,
  },
  infoIconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  infoTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
  },
  infoText: {
    color: colors.muted,
    lineHeight: 21,
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  documentsCard: {
    marginTop: spacing.xl,
  },
  documentsTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
    marginBottom: spacing.md,
  },
  docLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  docText: {
    flex: 1,
    color: colors.muted,
    fontWeight: typography.weights.bold,
    lineHeight: 20,
  },
  documentsNote: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  markdownBox: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
    marginBottom: spacing.md,
  },
});
