import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { bannerImages } from '../../assets/banners';
import { AppCard } from '../../components/AppCard';
import { Badge } from '../../components/Badge';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { colors, spacing, typography } from '../../constants/colors';

export function DataConsentScreen() {
  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero backgroundImage={bannerImages.profile} style={styles.hero}>
        <Badge label="Конфиденциальность" variant="mint" icon="lock" />
        <Text style={styles.heroTitle}>Согласие на обработку данных</Text>
        <Text style={styles.heroText}>Как Student’s Life использует данные анкеты абитуриента.</Text>
      </RedGradientHero>

      <AppCard>
        <Text style={styles.text}>
          Ваши персональные данные используются только для подготовки анкеты, оформления документов и сопровождения процесса поступления. Данные не передаются третьим лицам, кроме случаев, когда это необходимо для подачи документов в учебные заведения, оформления приглашения, визы или других услуг, связанных с поступлением. Мы бережно храним ваши данные и используем их только в рамках работы с вашей заявкой.
        </Text>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 230, marginBottom: spacing.lg },
  heroTitle: { color: colors.white, fontSize: 30, lineHeight: 36, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  heroText: { color: 'rgba(255,255,255,0.92)', lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  text: { color: colors.text, fontSize: typography.body, lineHeight: 24, fontWeight: typography.weights.medium },
});
