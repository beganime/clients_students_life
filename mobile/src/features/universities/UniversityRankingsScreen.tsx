import React, { useMemo } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { RANKINGS_DOCUMENT_FILE_NAME, RANKINGS_DOCUMENT_URL } from './documentDownload';

const DOCUMENT_URL = RANKINGS_DOCUMENT_URL;

const RAW_RANKINGS = `
Беларусь|447|Belarusian State University
Беларусь|851-900|Belarusian National Technical University
Россия|17|Lomonosov Moscow State University
Россия|47|Saint Petersburg State University
Россия|59|Moscow Institute of Physics and Technology
Россия|105|Lomonosov Moscow State University
Россия|133|Lomonosov Moscow State University
Россия|137|National Research University Higher School of Economics (HSE)
Россия|201–250|Bauman Moscow State Technical University
Россия|238|Novosibirsk State University
Россия|284|RUDN University
Россия|290|Bauman Moscow State Technical University
Россия|301-350|MISIS University
Россия|301-350|Moscow State Institute of International Relations
Россия|301-350|Ural Federal University
Россия|301–350|HSE University Russian Federation
Россия|320|Bauman Moscow State Technical University
Россия|351-400|ITMO University
Россия|351-400|Russian Presidential Academy of National Economy and Public Administration (RANEPA)
Россия|351-400|Sechenov University
Россия|351–400|Empress Catherine II Saint Petersburg Mining University
Россия|351–400|Innopolis University
Россия|367|RUDN University
Россия|375|Saint Petersburg State University
Россия|401-450|Peter the Great St. Petersburg Polytechnic University
Россия|401-450|Tomsk Polytechnic University
Россия|450|Kazan Federal University
Россия|451-500|Pavlov First St. Petersburg State Medical University
Россия|451-500|Pirogov Russian National Research Medical University
Россия|461|Novosibirsk State University
Россия|499|Tomsk State University
Россия|501-550|Innopolis University
Россия|501-550|Kazan Federal University
Россия|501–600|Kazan Federal University
Россия|519|Ural Federal University
Россия|591|National Research Nuclear University MEPhI (Moscow Engineering Physics Institute)
Россия|601–800|RUDN University
Россия|601–800|Siberian Federal University
Россия|601–800|Tomsk Polytechnic University
Россия|650|MGIMO University
Россия|651-700|Financial University under the Government of the Russian Federation
Россия|651-700|Moscow Aviation Institute (National Research University)
Россия|688|Tomsk Polytechnic University
Россия|701-800|Bashkir State Medical University
Россия|701-800|Far Eastern Federal University
Россия|701-800|National Research Lobachevsky State University of Nizhny Novgorod
Россия|701-800|Plekhanov Russian University of Economics
Россия|701-800|Saint-Petersburg Mining University
Россия|701-800|Southern Federal University
Россия|711-720|ITMO University
Россия|721-730|National University of Science and Technology MISiS
Россия|731-740|Far Eastern Federal University
Россия|801-900|Gubkin Russian State University of Oil and Gas (National Research University)
Россия|801-900|Russian University of Medicine
Россия|801-900|Siberian Federal University
Россия|801-900|South Ural State University (National Research University)
Россия|801-900|Tyumen State University
Россия|801–1000|Ural Federal University
Россия|851-900|Altai State University
Россия|851-900|I.M. Sechenov First Moscow State Medical University
Россия|901-1000|Mechnikov North-Western State Medical University
Россия|901-1000|Moscow Power Engineering Institute
Россия|901-1000|Privolzhsky Research Medical University
Россия|901-1000|St. Petersburg Electrotechnical University (LETI)
Россия|951-1000|Immanuel Kant Baltic Federal University
Турция|269|Middle East Technical University
Турция|298|Istanbul Technical University
Турция|301–350|Koç University
Турция|323|Koc University
Турция|351–400|Middle East Technical University
Турция|351–400|Sabancı University
Турция|371|Bogazici University
Турция|401–500|Boğaziçi University
Турция|404|Sabanci University
Турция|415|Bilkent University
Турция|501–600|Istanbul Technical University
Турция|571|Hacettepe University
Турция|601–800|Bilkent University
Турция|601–800|Kadir Has University
Турция|601–800|Yıldız Technical University
Турция|628|Istanbul University
Турция|697|Ankara Üniversitesi
Турция|731-740|Yildiz Technical University
Турция|801–1000|Abdullah Gül University
Турция|801–1000|Atatürk University
Турция|801–1000|Bahçeşehir University
Турция|801–1000|Cankaya University
Турция|801–1000|Hacettepe University
Турция|801–1000|Istanbul Medipol University
Турция|801–1000|Ozyegin University
Турция|801-900|Middle East Technical University
Турция|901-950|Gazi Üniversitesi
Турция|901-1000|Bogazici University
Узбекистан|501–600|Tashkent Institute of Irrigation and Agricultural Mechanisation
Узбекистан|721-730|National University of Uzbekistan
Узбекистан|901-950|Tashkent State Technical University
`;

type RankingRow = {
  country: string;
  rank: string;
  university: string;
};

const rankingRows: RankingRow[] = RAW_RANKINGS.trim().split('\n').map(line => {
  const [country, rank, ...universityParts] = line.split('|');

  return {
    country,
    rank,
    university: universityParts.join('|'),
  };
});

export function UniversityRankingsScreen() {
  const countryStats = useMemo(() => {
    const stats = rankingRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.country] = (acc[row.country] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(stats);
  }, []);

  const handleDownload = async () => {
    try {
      await Linking.openURL(DOCUMENT_URL);
    } catch (error) {
      Alert.alert(
        'Не удалось открыть документ',
        `Проверьте интернет или замените файл ${RANKINGS_DOCUMENT_FILE_NAME} в mobile/src/assets/documents/.`,
      );
    }
  };

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero backgroundImage={bannerImages.universities} style={styles.hero}>
        <View style={styles.heroGlass}>
          <Text style={styles.eyebrow}>Вузы 2026–2027</Text>
          <Text style={styles.heroTitle}>Список вузов и рейтинг</Text>
          <Text style={styles.heroText}>
            Фиксированный список университетов по странам с местами в рейтинге. Данные встроены прямо в код страницы.
          </Text>
          <View style={styles.heroActions}>
            <AppButton title="Скачать документ" onPress={handleDownload} />
          </View>
        </View>
      </RedGradientHero>

      <View style={styles.statsRow}>
        {countryStats.map(([country, count]) => (
          <AppCard key={country} style={styles.statCard}>
            <Text style={styles.statValue}>{count}</Text>
            <Text style={styles.statLabel}>{country}</Text>
          </AppCard>
        ))}
      </View>


      <Text style={styles.sectionTitle}>Рейтинг вузов</Text>
      <Text style={styles.sectionText}>
        Таблица прокручивается горизонтально, чтобы длинные названия университетов нормально помещались на телефоне.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.headerCell, styles.countryCell]}>Страна</Text>
            <Text style={[styles.headerCell, styles.rankCell]}>Рейтинг</Text>
            <Text style={[styles.headerCell, styles.universityCell]}>Название университета</Text>
          </View>

          {rankingRows.map((row, index) => (
            <View
              key={`${row.country}-${row.rank}-${row.university}-${index}`}
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.cell, styles.countryCell]}>{row.country}</Text>
              <Text style={[styles.cell, styles.rankCell]}>{row.rank}</Text>
              <Text style={[styles.cell, styles.universityCell]}>{row.university}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  hero: {
    minHeight: 340,
    marginBottom: spacing.lg,
  },
  heroGlass: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: 'rgba(11,18,32,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  eyebrow: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: typography.weights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.88,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: typography.weights.heavy,
    marginTop: spacing.sm,
  },
  heroText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  heroActions: {
    marginTop: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    color: colors.secondary,
    fontSize: 26,
    fontWeight: typography.weights.heavy,
  },
  statLabel: {
    color: colors.muted,
    marginTop: 4,
    fontWeight: typography.weights.bold,
  },
  downloadCard: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  downloadTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: typography.weights.heavy,
  },
  downloadText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    fontWeight: typography.weights.medium,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: typography.weights.heavy,
  },
  sectionText: {
    color: colors.muted,
    lineHeight: 22,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    fontWeight: typography.weights.medium,
  },
  tableScroll: {
    marginBottom: spacing.xl,
  },
  table: {
    minWidth: 780,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  tableRow: {
    minHeight: 56,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.surface,
  },
  tableHeader: {
    minHeight: 48,
    backgroundColor: colors.secondary,
  },
  headerCell: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: typography.weights.heavy,
    padding: spacing.md,
  },
  cell: {
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 19,
    fontWeight: typography.weights.medium,
    padding: spacing.md,
  },
  countryCell: {
    width: 120,
  },
  rankCell: {
    width: 110,
  },
  universityCell: {
    width: 550,
  },
});