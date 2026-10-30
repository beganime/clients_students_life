import React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '../../api/endpoints';
import { bannerImages, BannerImageKey } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { CachedImage } from '../../components/CachedImage';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors } from '../../constants/colors';
import { getMediaUrl } from '../../utils/media';

const links: Array<[string, string, BannerImageKey, string]> = [
  ['Университеты', 'Поиск вузов и программ', 'universities', 'Universities'],
  ['Услуги', 'Как мы помогаем', 'services', 'Services'],
  ['Документы', 'Что понадобится', 'admission', 'RequiredDocuments'],
  ['Бюджет', 'Приоритетные направления', 'university', 'GovernmentLinePrices'],
];

export function GuestHome() {
  const navigation = useNavigation<any>();
  const news = useQuery({ queryKey: ['news'], queryFn: contentApi.getNews, staleTime: 5 * 60_000 });
  const latest = news.data?.[0];
  return <Screen scroll refreshing={news.isRefetching} onRefresh={() => { void news.refetch(); }}>
    <ImageBackground source={bannerImages.home} style={styles.hero} imageStyle={styles.heroImage}><View style={styles.heroShade}>
      <Text style={styles.heroEyebrow}>STUDENTS LIFE · ПОСТУПЛЕНИЕ</Text>
      <Text style={styles.heroTitle}>Выберите свой путь в университет</Text>
      <Text style={styles.heroText}>Найдите направление и оставьте заявку. Менеджер подскажет дальнейшие шаги.</Text>
      <AppButton title="Подать заявку" onPress={() => navigation.navigate('ExpressApplication', { kind: 'applicant' })} style={styles.heroButton} />
    </View></ImageBackground>

    <View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>2000+</Text><Text style={styles.statLabel}>студентов</Text></View><View style={styles.stat}><Text style={styles.statValue}>6 лет</Text><Text style={styles.statLabel}>опыта</Text></View><View style={styles.stat}><Text style={styles.statValue}>24/7</Text><Text style={styles.statLabel}>на связи</Text></View></View>

    <Text style={styles.title}>Как это работает</Text>
    <View style={styles.steps}>{['Выберите направление', 'Подайте заявку', 'Получите ответ'].map((label, index) => <View key={label} style={styles.step}><View style={styles.stepCircle}><Text style={styles.stepNumber}>{index + 1}</Text></View><Text style={styles.stepText}>{label}</Text></View>)}</View>

    <Text style={styles.title}>Начните с нужного раздела</Text>
    <View style={styles.grid}>{links.map(([title, description, image, route]) => <Pressable key={route} style={styles.card} onPress={() => navigation.navigate(route)} accessibilityRole="button"><Image source={bannerImages[image]} style={styles.cardImage} /><View style={styles.cardCopy}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardDescription}>{description}</Text></View></Pressable>)}</View>

    {latest ? <Pressable style={styles.newsCard} onPress={() => navigation.navigate('NewsDetail', { slug: latest.slug })} accessibilityRole="button">{latest.cover_image ? <CachedImage uri={getMediaUrl(latest.cover_image)} style={styles.newsImage} /> : <Image source={bannerImages.news} style={styles.newsImage} />}<View style={styles.newsCopy}><Text style={styles.eyebrow}>ПОСЛЕДНЯЯ НОВОСТЬ</Text><Text style={styles.newsTitle} numberOfLines={2}>{latest.title}</Text><Text style={styles.newsLink}>Читать →</Text></View></Pressable> : null}
    <AppButton title="Все новости и формы" variant="ghost" onPress={() => navigation.navigate('News')} />
    <Pressable style={styles.signIn} onPress={() => navigation.navigate('Auth', { screen: 'Login' })} accessibilityRole="button"><SvgIcon name="profile" size={19} color={colors.primary} /><Text style={styles.signInText}>Уже есть личный кабинет? Войти</Text><SvgIcon name="chevronRight" size={17} color={colors.primary} /></Pressable>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { borderRadius: 21, overflow: 'hidden', minHeight: 245 }, heroImage: { borderRadius: 21 }, heroShade: { flex: 1, backgroundColor: 'rgba(11, 34, 57, 0.77)', padding: 21, justifyContent: 'center' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }, heroEyebrow: { color: '#FFD9D5', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }, heroTitle: { color: colors.white, fontSize: 27, fontWeight: '800', lineHeight: 33, marginTop: 10 }, heroText: { color: '#F3F5F7', lineHeight: 21, marginTop: 8 }, heroButton: { alignSelf: 'flex-start', marginTop: 17 },
  stats: { flexDirection: 'row', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginTop: 18 }, stat: { flex: 1, alignItems: 'center' }, statValue: { color: colors.primary, fontSize: 17, fontWeight: '800' }, statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 24, marginBottom: 14 }, steps: { flexDirection: 'row', gap: 7 }, step: { flex: 1, alignItems: 'center' }, stepCircle: { width: 32, height: 32, borderWidth: 1, borderColor: colors.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, stepNumber: { color: colors.primary, fontSize: 12, fontWeight: '800' }, stepText: { color: colors.text, fontSize: 11, textAlign: 'center', lineHeight: 15, marginTop: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 }, card: { width: '48%', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden' }, cardImage: { width: '100%', height: 96 }, cardCopy: { padding: 12 }, cardTitle: { color: colors.text, fontSize: 15, fontWeight: '800' }, cardDescription: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 4 },
  newsCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.white, marginTop: 25 }, newsImage: { width: '100%', height: 130 }, newsCopy: { padding: 15 }, newsTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 7 }, newsLink: { color: colors.primary, marginTop: 9, fontWeight: '800' },
  signIn: { minHeight: 55, paddingHorizontal: 14, flexDirection: 'row', gap: 9, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.white, marginTop: 10 }, signInText: { flex: 1, color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
});
