import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { educationCatalogApi } from '../../api/educationCatalog';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ErrorState } from '../../components/ErrorState';
import { Loading } from '../../components/Loading';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, spacing, typography } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type R = RouteProp<RootStackParamList, 'ProgramDetail'>;

export function ProgramDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<any>();
  const programQuery = useQuery({ queryKey: ['program-detail', route.params.id], queryFn: () => educationCatalogApi.getProgram(route.params.id) });

  if (programQuery.isLoading) return <Loading />;
  if (programQuery.isError || !programQuery.data) return <Screen scroll style={styles.screen}><ErrorState onAction={() => programQuery.refetch()} /></Screen>;

  const program = programQuery.data;
  const fee = program.tuition_fee ? `${program.tuition_fee}${program.currency ? ` ${program.currency}` : ''}` : 'Стоимость уточняется';

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero style={styles.hero}>
        <Text style={styles.kicker}>Программа</Text>
        <Text style={styles.title}>{program.title}</Text>
        <Text style={styles.subtitle}>{program.university_name || 'Университет уточняется'}</Text>
      </RedGradientHero>

      <View style={styles.grid}>
        <Info icon="document" label="Уровень" value={program.level || 'уточняется'} />
        <Info icon="language" label="Язык" value={program.language || 'уточняется'} />
        <Info icon="clock" label="Срок" value={program.duration || 'уточняется'} />
        <Info icon="money" label="Стоимость" value={fee} />
      </View>

      {program.description ? <AppCard style={styles.card}><SectionHeader eyebrow="Описание" title="О программе" /><Text style={styles.text}>{program.description}</Text></AppCard> : null}
      {program.requirements ? <AppCard style={styles.card}><SectionHeader eyebrow="Требования" title="Поступление" /><Text style={styles.text}>{program.requirements}</Text></AppCard> : null}

      <AppButton title="Подать заявку на программу" onPress={() => navigation.navigate('ApplicationCreate', { universityId: program.university, programId: program.id })} style={styles.button} />
      <AppButton title="Открыть вуз" variant="outline" onPress={() => navigation.navigate('UniversityDetail', { id: program.university })} />
    </Screen>
  );
}

function Info({ icon, label, value }: { icon: any; label: string; value: string }) { return <AppCard style={styles.info}><View style={styles.iconBox}><SvgIcon name={icon} size={20} color="#B91C1C" /></View><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></AppCard>; }

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FEF7F5' },
  hero: { minHeight: 280, marginBottom: spacing.lg },
  kicker: { color: 'rgba(255,255,255,0.78)', fontSize: typography.tiny, fontWeight: typography.weights.heavy, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  grid: { gap: spacing.md },
  info: { borderColor: '#FFDDDD' },
  iconBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  label: { color: colors.muted, fontWeight: typography.weights.bold },
  value: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy, marginTop: 4 },
  card: { marginTop: spacing.lg, borderColor: '#FFDDDD' },
  text: { color: colors.muted, lineHeight: 22, fontWeight: typography.weights.medium },
  button: { marginTop: spacing.lg, marginBottom: spacing.sm },
});
