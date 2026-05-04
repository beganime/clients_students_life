import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { authApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
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
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentAvatar = avatarUri || getMediaUrl(user?.profile?.avatar || null);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее, чтобы выбрать фото.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
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

      if (avatarUri) {
        formData.append('profile.avatar', {
          uri: avatarUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
      }

      await authApi.updateMeFormData(formData);
      await refreshMe();
      Alert.alert('Готово', 'Профиль обновлён');
    } catch (error) {
      Alert.alert('Ошибка', getApiErrorMessage(error, 'Не удалось обновить профиль'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>Редактировать профиль</Text>

      <Pressable style={styles.avatarBox} onPress={pickAvatar}>
        {currentAvatar ? <Image source={{ uri: currentAvatar }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder} />}
        <Text style={styles.avatarText}>Изменить фото</Text>
      </Pressable>

      <AppInput label="Имя" value={firstName} onChangeText={setFirstName} />
      <AppInput label="Фамилия" value={lastName} onChangeText={setLastName} />
      <AppInput label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <AppInput label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
      <AppInput label="Telegram" value={telegram} onChangeText={setTelegram} placeholder="@username" />
      <AppInput label="Страна" value={country} onChangeText={setCountry} />
      <AppInput label="Город" value={city} onChangeText={setCity} />
      <AppInput label="Гражданство" value={citizenship} onChangeText={setCitizenship} />

      <AppButton title="Сохранить" onPress={handleSave} loading={loading} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 20,
  },
  avatarBox: {
    alignItems: 'center',
    marginBottom: 22,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FDECEC',
  },
  avatarText: {
    marginTop: 10,
    color: colors.secondary,
    fontWeight: '900',
  },
  button: {
    marginTop: 8,
    marginBottom: 40,
  },
});