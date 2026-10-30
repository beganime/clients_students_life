import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { apiClient } from '../../api/client';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';

type Survey = { id: number; title: string; description: string; form_url: string };
export function PollsScreen() {
  const [items, setItems] = useState<Survey[]>([]);
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [opening, setOpening] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setItems([]); setNext(false);
    apiClient.get(`news/forms/?page=${page}`).then(({ data }) => {
      if (active) { setItems(data.results); setNext(Boolean(data.next)); }
    }).catch(() => { if (active) setError('Не удалось загрузить формы. Подключитесь к интернету и повторите.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision]);
  const open = async (item: Survey) => {
    if (opening !== null) return;
    try {
      const url = new URL(item.form_url);
      const allowed = url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') &&
        ((url.hostname === 'forms.gle' && url.pathname.length > 1) ||
         (url.hostname === 'docs.google.com' && url.pathname.startsWith('/forms/d/') && url.pathname.endsWith('/viewform')));
      if (!allowed) throw new Error('Invalid form');
      setOpening(item.id);
      await Linking.openURL(item.form_url);
    } catch {
      Alert.alert('Не удалось открыть форму', 'Проверьте интернет. Если ошибка повторяется, сообщите менеджеру название формы.');
    } finally { setOpening(null); }
  };
  return <Screen scroll refreshing={loading} onRefresh={() => setRevision(value => value + 1)}>
    <Text style={styles.heading}>Анкеты и формы</Text>
    <Text style={styles.body}>Анкеты от Students Life открываются в Google Forms в браузере. Для заполнения нужен интернет.</Text>
    <Text style={styles.body}>Ответы отправляются в Google Forms. Вход в Google может потребоваться по условиям анкеты. Приложение не проверяет факт отправки ответа.</Text>
    {error ? <><Text style={styles.body}>{error}</Text><AppButton title="Повторить" onPress={() => setRevision(value => value + 1)} /></> : null}
    {!loading && !error && items.length === 0 ? <Text style={styles.body}>Новых форм пока нет. Загляните позже.</Text> : null}
    {items.map(item => <AppCard key={item.id} style={styles.card}>
      <Text style={styles.heading}>{item.title}</Text>
      {!!item.description && <Text style={styles.body}>{item.description}</Text>}
      <AppButton title="Заполнить в Google Forms ↗" loading={opening === item.id} disabled={opening !== null} onPress={() => open(item)} />
    </AppCard>)}
    <View style={{ gap: 12 }}>{page > 1 && <AppButton title="Предыдущая страница" disabled={loading} onPress={() => setPage(value => value - 1)} />}{next && !error && <AppButton title="Следующая страница" disabled={loading} onPress={() => setPage(value => value + 1)} />}</View>
  </Screen>;
}
const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginBottom: 16 },
  body: { fontSize: 15, lineHeight: 23, color: colors.muted, marginBottom: 18 },
  card: { marginBottom: 24 },
});
