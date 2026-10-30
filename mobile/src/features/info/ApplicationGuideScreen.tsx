import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

const steps = [
  ['Оставьте экспресс-заявку', 'Укажите свои контакты и направление. Не отправляйте повторную заявку, если первая уже принята.'],
  ['Дождитесь менеджера', 'Команда получает уведомление о заявке. Менеджер связывается с вами и решает, нужно ли открыть личный кабинет. Обработка заявки сама по себе не означает создание кабинета.'],
  ['Войдите в готовый кабинет', 'Разрешите уведомления, чтобы получить сообщение о готовности. Если уведомление не пришло, откройте свою экспресс-заявку и проверьте статус. Когда аккаунт готов, используйте кнопку входа в нём или обратитесь к менеджеру.'],
  ['Заполните полную анкету', 'После входа откройте анкету и проверьте свои данные перед отправкой.'],
  ['Загрузите документы', 'В разделе «Мои документы» отправьте свои файлы. Менеджер проверит их; если понадобятся исправления, загрузите новую версию по его замечаниям.'],
];
export function ApplicationGuideScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <Screen scroll>
    <Text style={styles.title}>От заявки до поступления</Text>
    {steps.map(([title, body], index) => <AppCard key={title} elevated={false} style={styles.card}>
      <Text style={styles.step}>ШАГ {index + 1}</Text>
      <Text style={styles.heading}>{title}</Text><Text style={styles.body}>{body}</Text>
    </AppCard>)}
    <AppButton title="Какие документы подготовить" onPress={() => navigation.navigate('RequiredDocuments')} />
  </Screen>;
}
const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 24 },
  card: { marginBottom: 16 },
  step: { color: colors.primary, fontWeight: '700', fontSize: 12, marginBottom: 10 },
  heading: { color: colors.secondary, fontSize: 19, fontWeight: '700', marginBottom: 10 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 25 },
});
