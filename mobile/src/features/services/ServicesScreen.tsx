import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { contentApi } from '../../api/endpoints';
import { Screen } from '../../components/Screen';
import { SvgIcon, SvgIconName } from '../../components/SvgIcon';
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
          <View style={styles.heroIconBox}>
            <SvgIcon name="services" size={34} color={colors.white} strokeWidth={2.4} />
          </View>

          <Text style={styles.kicker}>Student’s Life Services</Text>
          <Text style={styles.title}>Всё для поступления в одном приложении</Text>
          <Text style={styles.description}>
            Выберите направление: университеты, заявка на поступление, визовая поддержка или дополнительные услуги.
          </Text>
        </View>
      </View>

      <View style={styles.mainGrid}>
        <ServiceActionCard
          iconName="university"
          title="Вузы"
          subtitle="Каталог университетов, стран и программ для поступления."
          badge="Каталог"
          color={colors.secondary}
          onPress={() => navigation.navigate('Universities')}
        />

        <ServiceActionCard
          iconName="application"
          title="Поступить"
          subtitle="Заполните заявку, и менеджер свяжется с вами."
          badge="Заявка"
          color={colors.primary}
          onPress={() => navigation.navigate('ApplicationCreate')}
        />

        <ServiceActionCard
          iconName="visa"
          title="Виза"
          subtitle="Помощь с приглашением, документами и визовым процессом."
          badge="Visa support"
          color={colors.primaryDark}
          onPress={openVisa}
        />
      </View>

      <View style={styles.whyCard}>
        <View style={styles.whyHeader}>
          <View style={styles.whyIconBox}>
            <SvgIcon name="check" size={24} color={colors.success} />
          </View>

          <View style={styles.whyTextBox}>
            <Text style={styles.whyTitle}>Почему это удобно?</Text>
            <Text style={styles.whyText}>
              Все ключевые шаги собраны в одном месте: подбор вуза, заявка, документы, виза и сопровождение.
            </Text>
          </View>
        </View>

        <View style={styles.benefits}>
          <Benefit icon="document" text="Проверка документов" />
          <Benefit icon="chat" text="Связь с менеджером" />
          <Benefit icon="globe" text="Поступление в разные страны" />
        </View>
      </View>

      {servicesQuery.data?.length ? (
        <View style={styles.extraBlock}>
          <Text style={styles.extraKicker}>Дополнительно</Text>
          <Text style={styles.extraTitle}>Все услуги</Text>

          {servicesQuery.data.map(service => (
            <Pressable
              key={service.id}
              style={styles.extraCard}
              onPress={() => navigation.navigate('ServiceDetail', { slug: service.slug })}
            >
              <View style={styles.extraIconBox}>
                <SvgIcon name="services" size={22} color={colors.primary} />
              </View>

              <View style={styles.extraContent}>
                <Text style={styles.extraCardTitle}>{service.title}</Text>
                <Text style={styles.extraCardText} numberOfLines={2}>
                  {service.short_description || 'Подробнее об услуге'}
                </Text>
              </View>

              <SvgIcon name="chevronRight" size={20} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function ServiceActionCard({
  iconName,
  title,
  subtitle,
  badge,
  color,
  onPress,
}: {
  iconName: SvgIconName;
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
        <View style={[styles.iconBox, { backgroundColor: `${color}14` }]}>
          <SvgIcon name={iconName} size={30} color={color} strokeWidth={2.4} />
        </View>

        <Text style={styles.badge}>{badge}</Text>
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>

      <View style={styles.cardLinkRow}>
        <Text style={styles.cardLink}>Перейти</Text>
        <SvgIcon name="chevronRight" size={18} color={colors.secondary} />
      </View>
    </Pressable>
  );
}

function Benefit({ icon, text }: { icon: SvgIconName; text: string }) {
  return (
    <View style={styles.benefitItem}>
      <SvgIcon name={icon} size={17} color={colors.secondary} />
      <Text style={styles.benefitText}>{text}</Text>
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
    minHeight: 285,
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
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primary,
    top: -100,
    right: -85,
    opacity: 0.7,
  },
  glowBlue: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.secondary,
    bottom: -105,
    left: -85,
    opacity: 0.7,
  },
  heroGlass: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginBottom: 14,
  },
  kicker: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  mainGrid: {
    gap: 14,
  },
  actionCard: {
    minHeight: 176,
    borderRadius: 30,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 13 },
    elevation: 6,
  },
  cardGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -60,
    top: -80,
    opacity: 0.15,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
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
  cardLinkRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLink: {
    color: colors.secondary,
    fontWeight: '900',
  },
  whyCard: {
    marginTop: 16,
    borderRadius: 28,
    padding: 18,
    backgroundColor: 'rgba(21,101,192,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(21,101,192,0.16)',
  },
  whyHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  whyIconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(18,183,106,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyTextBox: {
    flex: 1,
  },
  whyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  whyText: {
    color: colors.muted,
    marginTop: 5,
    lineHeight: 20,
    fontWeight: '700',
  },
  benefits: {
    marginTop: 16,
    gap: 9,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  benefitText: {
    color: colors.secondary,
    fontWeight: '900',
  },
  extraBlock: {
    marginTop: 28,
  },
  extraKicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  extraTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 3,
    marginBottom: 14,
  },
  extraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  extraIconBox: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,57,53,0.08)',
  },
  extraContent: {
    flex: 1,
  },
  extraCardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  extraCardText: {
    color: colors.muted,
    marginTop: 5,
    lineHeight: 20,
    fontWeight: '600',
  },
});