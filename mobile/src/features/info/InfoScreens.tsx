import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppCard } from '../../components/AppCard';
import { CTASection } from '../../components/CTASection';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';

type InfoData = {
  icon: SvgIconName;
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: Array<{ title: string; text: string; icon: SvgIconName }>;
};

const VISA_INFO: InfoData = {
  icon: 'visa',
  eyebrow: 'Виза',
  title: 'Визовая поддержка',
  subtitle: 'Помогаем понять этапы, сроки и документы для студенческой визы.',
  sections: [
    { icon: 'document', title: 'Документы', text: 'Паспорт, приглашение, анкеты, фото, подтверждение оплаты и дополнительные справки по стране.' },
    { icon: 'clock', title: 'Сроки', text: 'Менеджер поможет проверить дедлайны и заранее подготовить пакет без лишней спешки.' },
    { icon: 'chat', title: 'Сопровождение', text: 'В чате можно уточнить статус, получить список документов и задать вопрос менеджеру.' },
  ],
};

const TOURS_INFO: InfoData = {
  icon: 'mapPin',
  eyebrow: 'Туры',
  title: 'Ознакомительные туры',
  subtitle: 'Подбираем поездки для знакомства со страной, городом и университетом до поступления.',
  sections: [
    { icon: 'globe', title: 'Маршрут', text: 'Можно обсудить страну, город, кампус, проживание и важные бытовые вопросы.' },
    { icon: 'building', title: 'Университеты', text: 'Тур помогает увидеть инфраструктуру, общежитие и окружение вуза до финального решения.' },
    { icon: 'application', title: 'Заявка', text: 'Оставьте заявку, и менеджер уточнит даты, бюджет и формат поездки.' },
  ],
};

const ADMISSION_INFO: InfoData = {
  icon: 'application',
  eyebrow: 'Поступление',
  title: 'Поступление в университет',
  subtitle: 'От подбора программы до подачи документов и связи с университетом.',
  sections: [
    { icon: 'search', title: 'Подбор', text: 'Сравниваем страну, город, вуз, программу, язык, стоимость и требования.' },
    { icon: 'document', title: 'Пакет документов', text: 'Помогаем понять, какие документы нужны для конкретной программы.' },
    { icon: 'check', title: 'Сопровождение', text: 'После заявки менеджер ведёт клиента по этапам и сохраняет историю в личном кабинете.' },
  ],
};

export function VisaInfoScreen() {
  return <InfoScreen data={VISA_INFO} />;
}

export function ToursInfoScreen() {
  return <InfoScreen data={TOURS_INFO} />;
}

export function AdmissionInfoScreen() {
  return <InfoScreen data={ADMISSION_INFO} />;
}

function InfoScreen({ data }: { data: InfoData }) {
  const navigation = useNavigation<any>();

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero style={styles.hero}>
        <View style={styles.heroIcon}>
          <SvgIcon name={data.icon} size={30} color={colors.white} />
        </View>
        <Text style={styles.eyebrow}>{data.eyebrow}</Text>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.subtitle}>{data.subtitle}</Text>
      </RedGradientHero>

      <View style={styles.list}>
        {data.sections.map(section => (
          <AppCard key={section.title} style={styles.card}>
            <View style={styles.iconBox}>
              <SvgIcon name={section.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardText}>{section.text}</Text>
          </AppCard>
        ))}
      </View>

      <CTASection
        eyebrow="Следующий шаг"
        title="Обсудить с менеджером"
        description="Оставьте заявку или напишите в чат, чтобы получить персональную консультацию."
        primaryText="Оставить заявку"
        onPrimaryPress={() => navigation.navigate('ApplicationCreate')}
        secondaryText="Открыть чат"
        onSecondaryPress={() => navigation.navigate('Chat')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 260, marginBottom: spacing.lg },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  eyebrow: { color: 'rgba(255,255,255,0.78)', fontSize: typography.tiny, fontWeight: typography.weights.heavy, textTransform: 'uppercase' },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  subtitle: { color: 'rgba(255,255,255,0.92)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  list: { gap: spacing.md },
  card: { minHeight: 138 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  cardText: { color: colors.muted, fontSize: typography.body, lineHeight: 23, marginTop: spacing.xs, fontWeight: typography.weights.medium },
});
