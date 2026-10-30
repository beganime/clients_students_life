import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { documentPackages } from './documentPackages';

export function RequiredDocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const [search, setSearch] = useState('');
  const [opened, setOpened] = useState<string | null>(null);
  const query = search.trim().toLocaleLowerCase('ru');
  const packages = documentPackages.filter(item => `${item.title} ${item.items.join(' ')}`.toLocaleLowerCase('ru').includes(query));
  return (
    <Screen scroll>
      <Text style={styles.title}>Подготовьте документы</Text>
      <Text style={styles.description}>Выберите направление. Список Students Life доступен и без интернета. Индивидуальные требования уточните у своего менеджера.</Text>
      <TextInput accessibilityLabel="Поиск пакета документов" placeholder="Например, магистратура или Китай" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} maxLength={100} style={styles.search} />
      {packages.length === 0 && <Text style={styles.description}>Ничего не найдено. Попробуйте другое название.</Text>}
      {packages.map(item => {
        const expanded = opened === item.id;
        return <AppCard key={item.id} elevated={false} style={styles.card}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setOpened(expanded ? null : item.id)} style={styles.heading}>
            <View style={styles.headingText}><Text style={styles.name}>{item.title}</Text><Text style={styles.count}>{item.items.length} пунктов</Text></View>
            <Text style={styles.symbol}>{expanded ? '−' : '+'}</Text>
          </Pressable>
          {expanded && <View style={styles.items}>{item.items.map((text, index) => <View key={text} style={styles.item}><Text style={styles.number}>{index + 1}</Text><Text style={styles.itemText}>{text}</Text></View>)}</View>}
        </AppCard>;
      })}
      <Text style={styles.description}>Этот список — для подготовки. Загрузка и проверка файлов доступны в личном кабинете, в разделе «Мои документы».</Text>
      <AppButton title={authenticated ? 'Загрузить мои документы' : 'Оставить экспресс-заявку'} onPress={() => authenticated ? navigation.navigate('MyDocuments') : navigation.navigate('ExpressApplication', { kind: 'applicant' })} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 23, color: colors.muted, marginBottom: 20 },
  search: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, color: colors.text, marginBottom: 20, fontSize: 15 },
  card: { marginBottom: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 12 },
  headingText: { flex: 1 },
  name: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: colors.secondary },
  count: { fontSize: 13, color: colors.muted, marginTop: 6 },
  symbol: { fontSize: 26, color: colors.primary },
  items: { marginTop: 20, gap: 16 },
  item: { flexDirection: 'row', gap: 12 },
  number: { color: colors.primary, fontWeight: '700', width: 22, lineHeight: 23 },
  itemText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 23 },
});
