import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';

import { contentApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { Loading } from '../../components/Loading';
import { Screen } from '../../components/Screen';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getMediaUrl } from '../../utils/media';

type R = RouteProp<RootStackParamList, 'ServiceDetail'>;

export function ServiceDetailScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<any>();

  const { data, isLoading } = useQuery({
    queryKey: ['service', route.params.slug],
    queryFn: () => contentApi.getService(route.params.slug),
  });

  if (isLoading) return <Loading />;
  if (!data) return null;

  const imageUrl = getMediaUrl(data.cover_image || data.icon || null);

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.glowRed} />
        <View style={styles.glowBlue} />

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroIconBox}>
            <SvgIcon name="services" size={38} color={colors.white} />
          </View>
        )}

        <View style={styles.heroGlass}>
          <Text style={styles.kicker}>Услуга Student’s Life</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.description}>{data.short_description}</Text>
        </View>
      </View>

      <View style={styles.ctaCard}>
        <View style={styles.ctaIconBox}>
          <SvgIcon name="application" size={28} color={colors.primary} />
        </View>

        <Text style={styles.ctaTitle}>Хотите воспользоваться услугой?</Text>
        <Text style={styles.ctaText}>
          Оставьте заявку, и менеджер Student’s Life свяжется с вами.
        </Text>

        <AppButton
          title={data.button_text || 'Подать заявку'}
          onPress={() => navigation.navigate('ApplicationCreate', { serviceId: data.id })}
        />
      </View>

      <View style={styles.infoGrid}>
        {data.estimated_time ? (
          <InfoCard icon="clock" title="Срок" text={data.estimated_time} />
        ) : null}

        {data.required_documents ? (
          <InfoCard icon="document" title="Документы" text={data.required_documents} />
        ) : null}
      </View>

      {data.description_markdown ? (
        <View style={styles.markdownBox}>
          <Text style={styles.sectionTitle}>Подробнее</Text>
          <Markdown>{data.description_markdown}</Markdown>
        </View>
      ) : null}
    </Screen>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: SvgIconName;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIconBox}>
        <SvgIcon name={icon} size={22} color={colors.secondary} />
      </View>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    paddingBottom: 42,
    backgroundColor: '#F4F7FB',
  },
  hero: {
    minHeight: 305,
    borderRadius: 34,
    backgroundColor: '#101828',
    padding: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#101828',
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  glowRed: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary,
    top: -90,
    right: -80,
    opacity: 0.68,
  },
  glowBlue: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.secondary,
    bottom: -110,
    left: -85,
    opacity: 0.7,
  },
  heroImage: {
    position: 'absolute',
    right: 18,
    top: 18,
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroIconBox: {
    position: 'absolute',
    right: 18,
    top: 18,
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroGlass: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  kicker: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
  },
  description: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 22,
  },
  ctaCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    marginBottom: 16,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  ctaIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,57,53,0.1)',
    marginBottom: 12,
  },
  ctaTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  ctaText: {
    color: colors.muted,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 16,
    fontWeight: '700',
  },
  infoGrid: {
    gap: 12,
  },
  infoCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  infoIconBox: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: 'rgba(21,101,192,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  infoText: {
    color: colors.muted,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '700',
  },
  markdownBox: {
    marginTop: 18,
    borderRadius: 26,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    marginBottom: 12,
  },
});