import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { appendUploadFile, authApi, UploadableFile } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { Badge } from '../../components/Badge';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, spacing, typography } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { getMediaUrl } from '../../utils/media';

export function EditProfileScreen() {
  const { user, refreshMe } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.profile?.whatsapp || '');
  const [telegram, setTelegram] = useState(user?.profile?.telegram || '');
  const [country, setCountry] = useState(user?.profile?.country || '');
  const [city, setCity] = useState(user?.profile?.city || '');
  const [citizenship, setCitizenship] = useState(user?.profile?.citizenship || '');
  const [avatarFile, setAvatarFile] = useState<UploadableFile | null>(null);
  const [loading, setLoading] = useState(false);

  const currentAvatar = avatarFile?.uri || getMediaUrl(user?.profile?.avatar || null);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее, чтобы выбрать фото.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setAvatarFile({
        uri: asset.uri,
        name: asset.fileName || 'avatar.jpg',
        type: asset.mimeType || 'image/jpeg',
        file: (asset as any).file,
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('profile.phone', phone);
      formData.append('profile.whatsapp', whatsapp);
      formData.append('profile.telegram', telegram);
      formData.append('profile.country', country);
      formData.append('profile.city', city);
      formData.append('profile.citizenship', citizenship);
      formData.append('profile.language', user?.profile?.language || 'ru');
      if (avatarFile) appendUploadFile(formData, 'profile.avatar', avatarFile);
      await authApi.updateMeFormData(formData);
      await refreshMe();
      Alert.alert('Готово', 'Профиль обновлён.');
    } catch (error) {
      Alert.alert('Не удалось обновить профиль', getApiErrorMessage(error, 'Проверьте данные и попробуйте ещё раз.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero style={styles.hero}>
        <Badge label="Профиль" variant="mint" icon="profile" />
        <Text style={styles.title}>Редактировать данные</Text>
        <Text style={styles.subtitle}>Актуальные контакты помогут менеджеру быстрее отвечать по заявкам и документам.</Text>
      </RedGradientHero>

      <AppCard style={styles.avatarCard}>
        <Pressable style={styles.avatarBox} onPress={pickAvatar}>
          {currentAvatar ? <Image source={{ uri: currentAvatar }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><SvgIcon name="profile" size={42} color="#B91C1C" /></View>}
          <Text style={styles.avatarText}>Изменить фото</Text>
        </Pressable>
      </AppCard>

      <AppCard style={styles.formCard}>
        <Text style={styles.sectionTitle}>Основные данные</Text>
        <View style={styles.nameRow}>
          <AppInput wrapperStyle={styles.nameInput} label="Имя" value={firstName} onChangeText={setFirstName} />
          <AppInput wrapperStyle={styles.nameInput} label="Фамилия" value={lastName} onChangeText={setLastName} />
        </View>
        <AppInput label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <AppInput label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
        <AppInput label="Telegram" value={telegram} onChangeText={setTelegram} placeholder="@username" />
        <AppInput label="Страна" value={country} onChangeText={setCountry} />
        <AppInput label="Город" value={city} onChangeText={setCity} />
        <AppInput label="Гражданство" value={citizenship} onChangeText={setCitizenship} />
        <AppButton title="Сохранить изменения" onPress={handleSave} loading={loading} style={styles.button} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FEF7F5' },
  hero: { minHeight: 260, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  avatarCard: { alignItems: 'center', marginBottom: spacing.lg, borderColor: '#FFDDDD' },
  avatarBox: { alignItems: 'center' },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.border },
  avatarPlaceholder: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFDDDD' },
  avatarText: { marginTop: spacing.sm, color: '#B91C1C', fontWeight: typography.weights.heavy },
  formCard: { marginBottom: spacing.xl, borderColor: '#FFDDDD' },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.md },
  nameRow: { flexDirection: 'row', gap: spacing.sm },
  nameInput: { flex: 1 },
  button: { marginTop: spacing.sm },
});
