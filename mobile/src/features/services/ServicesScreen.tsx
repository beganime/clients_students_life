import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { contentApi } from '../../api/endpoints';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';

export function ServicesScreen() {
  const navigation = useNavigation<any>();

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: contentApi.getServices,
  });

  const openVisa = () => {
    const visaService = servicesQuery.data?.find(item =>
      item.title.toLowerCase().includes('виз'),
    );

    if (visaService) {
      navigation.navigate('ServiceDetail', { slug: visaService.slug });
      return;
    }

    Alert.alert(
      'Услуга пока не найдена',
      'Добавьте услугу “Виза” через админ-панель или проверьте название услуги.',
    );
  };

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.glowRed} />
        <View style={styles.glowBlue} />

        <View style={styles.heroGlass}>
          <Text style={styles.kicker}>Наши услуги</Text>
          <Text style={styles.title}>Всё для поступления в одном месте</Text>
          <Text style={styles.description}>
            Выберите нужный раздел: каталог вузов, заявка на поступление или визовое сопровождение.
          </Text>
        </View>
      </View>

      <View style={styles.cards}>
        <ServiceActionCard
          icon="🎓"
          title="Вузы"
          subtitle="Каталог университетов, стран и программ"
          badge="Каталог"
          color={colors.secondary}
          onPress={() => navigation.navigate('Universities')}
        />

        <ServiceActionCard
          icon="📝"
          title="Поступить"
          subtitle="Заполнить заявку и отправить её менеджеру"
          badge="Заявка"
          color={colors.primary}
          onPress={() => navigation.navigate('ApplicationCreate')}
        />

        <ServiceActionCard
          icon="🛂"
          title="Виза"
          subtitle="Помощь с приглашением, визой и документами"
          badge="Visa support"
          color={colors.primaryDark}
          onPress={openVisa}
        />
      </View>

      {servicesQuery.data?.length ? (
        <View style={styles.extraBlock}>
          <Text style={styles.extraTitle}>Дополнительные услуги</Text>

          {servicesQuery.data.map(service => (
            <Pressable
              key={service.id}
              style={styles.extraCard}
              onPress={() => navigation.navigate('ServiceDetail', { slug: service.slug })}
            >
              <Text style={styles.extraCardTitle}>{service.title}</Text>
              <Text style={styles.extraCardText} numberOfLines={2}>
                {service.short_description || 'Подробнее об услуге'}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function ServiceActionCard({
  icon,
  title,
  subtitle,
  badge,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={[styles.cardGlow, { backgroundColor: color }]} />

      <View style={styles.cardTop}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.badge}>{badge}</Text>
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>

      <Text style={styles.cardLink}>Перейти →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#F4F7FB',
  },
  hero: {
    minHeight: 250,
    borderRadius: 30,
    backgroundColor: '#101828',
    padding: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: '#101828',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  glowRed: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: colors.primary,
    top: -80,
    right: -70,
    opacity: 0.65,
  },
  glowBlue: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.secondary,
    bottom: -100,
    left: -80,
    opacity: 0.72,
  },
  heroGlass: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  kicker: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: colors.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '900',
  },
  description: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.86)',
    lineHeight: 22,
    fontSize: 15,
  },
  cards: {
    gap: 14,
  },
  actionCard: {
    minHeight: 170,
    borderRadius: 28,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.09,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  cardGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -55,
    top: -80,
    opacity: 0.16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    fontSize: 34,
  },
  badge: {
    overflow: 'hidden',
    backgroundColor: 'rgba(229,57,53,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.16)',
    color: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 18,
  },
  cardSubtitle: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  cardLink: {
    marginTop: 16,
    color: colors.secondary,
    fontWeight: '900',
  },
  extraBlock: {
    marginTop: 30,
  },
  extraTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 14,
  },
  extraCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
  },
  extraCardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  extraCardText: {
    color: colors.muted,
    marginTop: 7,
    lineHeight: 20,
  },
});