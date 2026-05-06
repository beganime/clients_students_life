import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery } from '@tanstack/react-query';

import { applicationsApi, contentApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { Loading } from '../../components/Loading';
import { LoginRequired } from '../../components/LoginRequired';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';

type SelectedFile = {
  uri: string;
  name: string;
  type: string;
};

export function ApplicationCreateScreen() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <LoginRequired
        title="Чтобы отправить заявку, войдите в аккаунт"
        description="Смотреть услуги, страны, университеты и новости можно без регистрации. Отправка заявки доступна только после входа."
      />
    );
  }

  return <ApplicationCreateForm />;
}

function ApplicationCreateForm() {
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: contentApi.getServices });
  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: contentApi.getCountries });
  const universitiesQuery = useQuery({ queryKey: ['universities'], queryFn: () => contentApi.getUniversities() });

  const [serviceId, setServiceId] = useState<number | null>(null);
  const [targetCountryId, setTargetCountryId] = useState<number | null>(null);
  const [targetUniversityId, setTargetUniversityId] = useState<number | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [citizenship, setCitizenship] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [studyLanguage, setStudyLanguage] = useState('');
  const [startYear, setStartYear] = useState('2026');
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [loading, setLoading] = useState(false);

  const isInitialLoading = servicesQuery.isLoading || countriesQuery.isLoading || universitiesQuery.isLoading;

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: [
        'application/pdf',
        'image/*',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    });

    if (result.canceled) return;

    const pickedFiles = result.assets.map(asset => ({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'application/octet-stream',
    }));

    setFiles(prev => [...prev, ...pickedFiles]);
  };

  const resetForm = () => {
    setServiceId(null);
    setTargetCountryId(null);
    setTargetUniversityId(null);
    setFullName('');
    setPhone('');
    setWhatsapp('');
    setTelegram('');
    setEmail('');
    setCountry('');
    setCitizenship('');
    setEducationLevel('');
    setSpecialty('');
    setStudyLanguage('');
    setStartYear('2026');
    setComment('');
    setFiles([]);
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Ошибка', 'Введите ФИО');
      return;
    }

    if (!phone && !whatsapp && !telegram && !email) {
      Alert.alert('Ошибка', 'Укажите хотя бы один способ связи');
      return;
    }

    try {
      setLoading(true);

      const application = await applicationsApi.createApplication({
        service: serviceId,
        full_name: fullName,
        citizenship,
        country,
        phone,
        whatsapp,
        telegram,
        email,
        preferred_contact_method: whatsapp ? 'whatsapp' : telegram ? 'telegram' : email ? 'email' : 'phone',
        target_country: targetCountryId,
        target_university: targetUniversityId,
        education_level: educationLevel,
        specialty,
        study_language: studyLanguage,
        start_year: startYear,
        comment,
      });

      for (const file of files) {
        await applicationsApi.uploadFile(application.id, file, 'other');
      }

      Alert.alert('Заявка отправлена', `Номер заявки: ${application.application_number}`);
      resetForm();
    } catch (error) {
      Alert.alert('Ошибка', getApiErrorMessage(error, 'Не удалось отправить заявку'));
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) return <Loading />;

  return (
    <Screen scroll>
      <Text style={styles.title}>Подать заявку</Text>
      <Text style={styles.subtitle}>Заполните данные, и менеджер Student’s Life свяжется с вами.</Text>

      <Text style={styles.label}>Выберите услугу</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {(servicesQuery.data || []).map(service => {
          const active = serviceId === service.id;

          return (
            <Pressable
              key={service.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setServiceId(active ? null : service.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{service.title}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <AppInput label="ФИО" value={fullName} onChangeText={setFullName} placeholder="Ali Myradov" />
      <AppInput label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+993..." />
      <AppInput label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="+993..." />
      <AppInput label="Telegram" value={telegram} onChangeText={setTelegram} placeholder="@username" />
      <AppInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="student@example.com" />
      <AppInput label="Гражданство" value={citizenship} onChangeText={setCitizenship} placeholder="Turkmenistan" />
      <AppInput label="Страна проживания" value={country} onChangeText={setCountry} placeholder="Turkmenistan" />

      <Text style={styles.label}>Желаемая страна обучения</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {(countriesQuery.data || []).map(item => {
          const active = targetCountryId === item.id;

          return (
            <Pressable
              key={item.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setTargetCountryId(active ? null : item.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>Желаемый университет</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {(universitiesQuery.data || []).slice(0, 20).map(item => {
          const active = targetUniversityId === item.id;

          return (
            <Pressable
              key={item.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setTargetUniversityId(active ? null : item.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <AppInput label="Текущий уровень образования" value={educationLevel} onChangeText={setEducationLevel} placeholder="Среднее образование / бакалавр" />
      <AppInput label="Желаемая специальность" value={specialty} onChangeText={setSpecialty} placeholder="Medicine" />
      <AppInput label="Язык обучения" value={studyLanguage} onChangeText={setStudyLanguage} placeholder="English / Russian / Chinese" />
      <AppInput label="Год начала обучения" value={startYear} onChangeText={setStartYear} keyboardType="number-pad" placeholder="2026" />

      <AppInput
        label="Комментарий"
        value={comment}
        onChangeText={setComment}
        placeholder="Например: хочу поступить на подкурс в Китай"
        multiline
        style={styles.textarea}
      />

      <Pressable style={styles.fileButton} onPress={handlePickFile}>
        <Text style={styles.fileButtonText}>Прикрепить документы</Text>
      </Pressable>

      {files.map((file, index) => (
        <View key={`${file.uri}-${index}`} style={styles.fileItem}>
          <Text style={styles.fileName}>{file.name}</Text>
        </View>
      ))}

      <AppButton title="Отправить заявку" onPress={handleSubmit} loading={loading} style={styles.submitButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 18,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  chipsRow: {
    marginBottom: 16,
  },
  chip: {
    maxWidth: 220,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.muted,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.white,
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  fileButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  fileButtonText: {
    color: colors.secondary,
    fontWeight: '900',
  },
  fileItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileName: {
    color: colors.text,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 30,
  },
});