import React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { applicationsApi, contentApi } from '../../api/endpoints';
import { bannerImages, BannerImageKey } from '../../assets/banners';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { CachedImage } from '../../components/CachedImage';
import { SvgIcon } from '../../components/SvgIcon';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { getMediaUrl } from '../../utils/media';

export function StudentHome() {
  const navigation = useNavigation<any>();
  const user = useAuthStore(s => s.user);
  const status = useQuery({ queryKey: ['admission-status', user?.id], queryFn: applicationsApi.getAdmissionStatus, enabled: !!user?.id, staleTime: 60000 });
  const news = useQuery({ queryKey: ['news'], queryFn: contentApi.getNews, staleTime: 5 * 60_000 });
  const latest = news.data?.[0];
  const actions: Array<[string, string, BannerImageKey, string]> = [
    ['Моя анкета', 'Заполните полную анкету или дополните сведения для менеджера.', 'admission', 'ApplicantQuestionnaire'],
    ['Посмотреть вузы', 'Выберите направление и сохраните понравившиеся университеты.', 'universities', 'Universities'],
    ['Мои документы', 'Загрузите файлы и проверьте замечания менеджера.', 'admission', 'MyDocuments'],
    ['Мои экзамены', 'Даты и информация о назначенных экзаменах.', 'program', 'Exams'],
    ['Избранные вузы', 'Ваш сохранённый список университетов.', 'country', 'FavoriteUniversities'],
  ];
  return <Screen scroll refreshing={status.isRefetching || news.isRefetching} onRefresh={() => { void status.refetch(); void news.refetch(); }}>
    <ImageBackground source={bannerImages.home} style={styles.hero} imageStyle={styles.heroImage}><View style={styles.heroShade}>
      <Text style={styles.heroEyebrow}>STUDENTS LIFE · ЛИЧНЫЙ КАБИНЕТ</Text><Text style={styles.title}>Здравствуйте{user?.first_name ? `, ${user.first_name}` : ''}!</Text>
      <Text style={styles.heroText}>Всё о вашем поступлении в одном месте.</Text>
      <View style={styles.heroActions}><AppButton title="Моя анкета" style={styles.heroButton} onPress={() => navigation.navigate('ApplicantQuestionnaire', { formType: 'applicant' })} /><AppButton title="Мой статус" variant="outline" style={styles.heroButton} onPress={() => navigation.navigate('AdmissionStatus')} /></View>
    </View></ImageBackground>
    <Pressable style={styles.statusCard} onPress={() => navigation.navigate('AdmissionStatus')} accessibilityRole="button"><View style={styles.statusIcon}><SvgIcon name="application" size={20} color={colors.primary} /></View><View style={styles.statusCopy}><Text style={styles.statusLabel}>ЭТАП ПОСТУПЛЕНИЯ</Text><Text style={styles.statusValue}>{status.data?.client?.status_label || (status.isError ? 'Не удалось обновить — нажмите для повтора' : 'Уточняется у менеджера')}</Text><Text style={styles.statusMeta}>{status.data?.client?.sl_id || 'Личный кабинет'}</Text></View><SvgIcon name="chevronRight" size={18} color={colors.muted} /></Pressable>
    <Text style={styles.sectionTitle}>Как проходит поступление</Text><View style={styles.steps}>{['Анкета', 'Документы', 'Поступление'].map((label, index) => <View key={label} style={styles.step}><View style={styles.stepCircle}><Text style={styles.stepNumber}>{index + 1}</Text></View><Text style={styles.stepLabel}>{label}</Text></View>)}</View>
    <Text style={styles.sectionTitle}>Всё под рукой</Text>
    <View style={styles.grid}>{actions.map(([title, description, photo, route]) => <Pressable key={route} style={styles.card} onPress={() => navigation.navigate(route, route === 'ApplicantQuestionnaire' ? { formType: 'applicant' } : undefined)} accessibilityRole="button">
      <Image source={bannerImages[photo]} style={styles.image} resizeMode="cover" /><View style={styles.copy}><Text style={styles.heading}>{title}</Text><Text style={styles.cardDetail} numberOfLines={2}>{description}</Text></View>
    </Pressable>)}</View>
    {latest ? <Pressable style={styles.newsCard} onPress={() => navigation.navigate('NewsDetail', { slug: latest.slug })} accessibilityRole="button">{latest.cover_image ? <CachedImage uri={getMediaUrl(latest.cover_image)} style={styles.newsImage} /> : <Image source={bannerImages.news} style={styles.newsImage} />}<View style={styles.newsCopy}><Text style={styles.eyebrow}>ПОСЛЕДНЯЯ НОВОСТЬ</Text><Text style={styles.newsTitle} numberOfLines={2}>{latest.title}</Text><Text style={styles.newsLink}>Читать →</Text></View></Pressable> : null}
    <AppButton title="Все новости и формы" variant="ghost" onPress={() => navigation.navigate('News')} />
  </Screen>;
}
const styles = StyleSheet.create({
  hero: { borderRadius: 21, overflow: 'hidden', minHeight: 194 }, heroImage: { borderRadius: 21 }, heroShade: { flex: 1, backgroundColor: 'rgba(11, 34, 57, 0.76)', padding: 19, justifyContent: 'center' },
  eyebrow: { color: colors.primary, letterSpacing: 1.2, fontSize: 10, fontWeight: '800' }, heroEyebrow: { color: '#FFD9D5', letterSpacing: 1.2, fontSize: 10, fontWeight: '800' },
  title: { color: colors.white, fontSize: 26, fontWeight: '800', marginTop: 10 }, heroText: { color: '#F2F4F6', fontSize: 14, marginTop: 7 },
  heroActions: { flexDirection: 'row', gap: 9, marginTop: 18 }, heroButton: { flex: 1, minHeight: 43 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginTop: 18 },
  statusIcon: { width: 36, height: 36, backgroundColor: '#FFF0EF', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, statusCopy: { flex: 1 }, statusLabel: { color: colors.primary, fontSize: 10, fontWeight: '800' }, statusValue: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 3 }, statusMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 23, marginBottom: 13 }, steps: { flexDirection: 'row', gap: 7 }, step: { flex: 1, alignItems: 'center' }, stepCircle: { width: 31, height: 31, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }, stepNumber: { color: colors.primary, fontWeight: '800', fontSize: 12 }, stepLabel: { color: colors.text, fontSize: 11, fontWeight: '700', marginTop: 7, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 }, card: { width: '48%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }, image: { width: '100%', height: 95 }, copy: { padding: 12 }, heading: { color: colors.text, fontSize: 15, fontWeight: '800' }, cardDetail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  newsCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden', marginTop: 24 }, newsImage: { width: '100%', height: 128 }, newsCopy: { padding: 15 }, newsTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 6 }, newsLink: { color: colors.primary, fontWeight: '800', marginTop: 10 },
});
