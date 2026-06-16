import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { applicationsApi, contentApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { Loading } from '../../components/Loading';
import { LoginRequired } from '../../components/LoginRequired';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';

type R = RouteProp<RootStackParamList, 'ApplicationCreate'>;

type SelectedFile = {
  uri: string;
  name: string;
  type: string;
};

type SubmitStatus = {
  type: 'success' | 'error' | 'info';
  text: string;
} | null;

function makeIdempotencyKey() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

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
  const route = useRoute<R>();

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: contentApi.getServices,
  });

  const countriesQuery = useQuery({
    queryKey: ['countries'],
    queryFn: contentApi.getCountries,
  });

  const universitiesQuery = useQuery({
    queryKey: ['universities'],
    queryFn: () => contentApi.getUniversities(),
  });

  const [serviceId, setServiceId] = useState<number | null>(route.params?.serviceId || null);
  const [targetCountryId, setTargetCountryId] = useState<number | null>(null);
  const [targetUniversityId, setTargetUniversityId] = useState<number | null>(route.params?.universityId || null);

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
  const [status, setStatus] = useState<SubmitStatus>(null);

  const isInitialLoading = servicesQuery.isLoading || countriesQuery.isLoading || universitiesQuery.isLoading;

  useEffect(() => {
    if (route.params?.serviceId) {
      setServiceId(route.params.serviceId);
    }

    if (route.params?.universityId) {
      setTargetUniversityId(route.params.universityId);
    }
  }, [route.params?.serviceId, route.params?.universityId]);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: [
        'application/pdf',
        'image/*',
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
    setStatus(null);

    if (!fullName.trim()) {
      setStatus({
        type: 'error',
        text: 'Введите ФИО студента.',
      });
      return;
    }

    if (!phone && !whatsapp && !telegram && !email) {
      setStatus({
        type: 'error',
        text: 'Укажите хотя бы один способ связи.',
      });
      return;
    }

    try {
      setLoading(true);
      setStatus({
        type: 'info',
        text: 'Отправляем заявку...',
      });

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
        target_country_name: countriesQuery.data?.find(item => item.id === targetCountryId)?.name,
        target_university: targetUniversityId,
        target_university_name: universitiesQuery.data?.find(item => item.id === targetUniversityId)?.name,
        education_level: educationLevel,
        specialty,
        study_language: studyLanguage,
        start_year: startYear,
        comment,
        idempotency_key: makeIdempotencyKey(),
      });

      for (const file of files) {
        await applicationsApi.uploadFile(application.id, file, 'other');
      }

      const syncWarning =
        application.manager_sl_sync_status === 'failed'
          ? ' Заявка сохранена в приложении; менеджер получит ее после восстановления связи с основной CRM.'
          : '';

      setStatus({
        type: 'success',
        text: `Заявка отправлена. Номер заявки: ${application.application_number}`,
      });

      Alert.alert('Заявка отправлена', `Номер заявки: ${application.application_number}`);
      if (syncWarning) {
        setStatus(prev => (prev ? { ...prev, text: `${prev.text}.${syncWarning}` } : prev));
      }

      resetForm();
    } catch (error) {
      setStatus({
        type: 'error',
        text: getApiErrorMessage(error, 'Не удалось отправить заявку'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) return <Loading />;

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.glowRed} />
        <View style={styles.glowBlue} />

        <View style={styles.heroGlass}>
          <View style={styles.heroIconBox}>
            <SvgIcon name="application" size={34} color={colors.white} />
          </View>

          <Text style={styles.kicker}>Заявка</Text>
          <Text style={styles.title}>Подать заявку</Text>
          <Text style={styles.subtitle}>
            Заполните данные, и менеджер Student’s Life свяжется с вами.
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
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
          <SvgIcon name="file" size={20} color={colors.secondary} />
          <Text style={styles.fileButtonText}>Прикрепить документы</Text>
        </Pressable>

        {files.map((file, index) => (
          <View key={`${file.uri}-${index}`} style={styles.fileItem}>
            <SvgIcon name="document" size={17} color={colors.secondary} />
            <Text style={styles.fileName}>{file.name}</Text>
          </View>
        ))}

        {status ? (
          <View
            style={[
              styles.statusBox,
              status.type === 'success' && styles.statusSuccess,
              status.type === 'error' && styles.statusError,
              status.type === 'info' && styles.statusInfo,
            ]}
          >
            <SvgIcon
              name={status.type === 'success' ? 'check' : status.type === 'error' ? 'warning' : 'application'}
              size={18}
              color={
                status.type === 'success'
                  ? colors.success
                  : status.type === 'error'
                    ? colors.danger
                    : colors.secondary
              }
            />
            <Text
              style={[
                styles.statusText,
                status.type === 'success' && styles.statusSuccessText,
                status.type === 'error' && styles.statusErrorText,
                status.type === 'info' && styles.statusInfoText,
              ]}
            >
              {status.text}
            </Text>
          </View>
        ) : null}

        <AppButton title="Отправить заявку" onPress={handleSubmit} loading={loading} style={styles.submitButton} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    paddingBottom: 42,
    backgroundColor: '#F4F7FB',
  },
  hero: {
    minHeight: 270,
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
    marginBottom: 12,
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
    fontWeight: '900',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 30,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  chipsRow: {
    marginBottom: 16,
  },
  chip: {
    maxWidth: 230,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(234,236,240,0.95)',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.muted,
    fontWeight: '800',
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
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(21,101,192,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(21,101,192,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  fileButtonText: {
    color: colors.secondary,
    fontWeight: '900',
  },
  fileItem: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileName: {
    flex: 1,
    color: colors.text,
    fontWeight: '800',
  },
  statusBox: {
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: 'rgba(18,183,106,0.08)',
    borderColor: 'rgba(18,183,106,0.2)',
  },
  statusError: {
    backgroundColor: 'rgba(240,68,56,0.08)',
    borderColor: 'rgba(240,68,56,0.2)',
  },
  statusInfo: {
    backgroundColor: 'rgba(21,101,192,0.08)',
    borderColor: 'rgba(21,101,192,0.2)',
  },
  statusText: {
    flex: 1,
    fontWeight: '800',
    lineHeight: 20,
  },
  statusSuccessText: {
    color: colors.success,
  },
  statusErrorText: {
    color: colors.danger,
  },
  statusInfoText: {
    color: colors.secondary,
  },
  submitButton: {
    marginTop: 4,
    marginBottom: 6,
  },
});
