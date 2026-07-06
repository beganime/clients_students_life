import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { questionnaireApi } from '../../api/endpoints';
import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { Badge } from '../../components/Badge';
import { ErrorState } from '../../components/ErrorState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';
import { ApplicantQuestionnaire } from '../../types/api';
import { getApiErrorMessage } from '../../utils/apiError';
import { getMediaUrl } from '../../utils/media';

const TEXT_FIELDS: Array<keyof ApplicantQuestionnaire> = [
  'full_name',
  'birth_date',
  'gender',
  'citizenship',
  'marital_status',
  'residence_country',
  'residence_region',
  'residence_city',
  'residence_street',
  'residence_house',
  'residence_postal_code',
  'passport_number',
  'passport_issued_by',
  'passport_issue_date',
  'passport_expiry_date',
  'phone',
  'email',
  'extra_phone',
  'imo',
  'telegram',
  'preferred_contact_method',
  'parent_full_name',
  'parent_relation',
  'parent_contacts',
  'parent_workplace',
  'family_members',
  'education_level',
  'school_class',
  'school_name',
  'school_country',
  'school_city',
  'graduation_year',
  'education_status',
  'desired_program',
  'admission_goal',
  'desired_city',
  'desired_country',
  'desired_language',
  'desired_education_level',
  'admission_urgency',
  'has_visa',
  'visa_country',
  'visa_city',
  'visa_valid_until',
  'has_international_passport',
  'hobbies',
  'applicant_comment',
  'referral_source',
];

const EDUCATION_LEVELS = ['Учусь в школе', 'Среднее общее образование', 'Среднее специальное образование', 'Среднее профессиональное образование', 'Бакалавриат', 'Специалитет', 'Магистратура', 'Другое'];
const SCHOOL_CLASSES = ['6 класс', '7 класс', '8 класс', '9 класс', '10 класс', '11 класс', '12 класс'];
const ACHIEVEMENTS = ['дипломы', 'грамоты', 'спортивные разряды', 'сертификаты курсов', 'олимпиады', 'другое', 'ничего нет'];
const LANGUAGE_OPTIONS = ['русский', 'английский', 'туркменский', 'турецкий', 'китайский', 'немецкий', 'французский', 'другой'];
const LANGUAGE_LEVELS = ['базовый', 'средний', 'хороший', 'свободно', 'родной'];
const DESIRED_LEVELS = ['школа', 'колледж', 'бакалавриат', 'специалитет', 'магистратура', 'аспирантура', 'языковые курсы', 'подготовительный курс'];
const HELP_OPTIONS = ['выбором вуза', 'подачей документов', 'визой', 'переводом документов', 'общежитием', 'встречей в аэропорту', 'полным сопровождением'];
const CONTACT_METHODS = ['звонок', 'Imo', 'Telegram', 'email'];
const URGENCY_OPTIONS = ['в этом году', 'в следующем году', 'пока только интересуюсь'];
const PASSPORT_OPTIONS = ['да', 'нет', 'в процессе оформления'];
const REFERRAL_OPTIONS = ['Instagram', 'TikTok', 'Telegram', 'знакомые', 'офис', 'сайт', 'другое'];

export function ApplicantQuestionnaireScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<ApplicantQuestionnaire>>({});
  const [facePhotoUri, setFacePhotoUri] = useState<string | null>(null);

  const questionnaireQuery = useQuery({
    queryKey: ['my-questionnaire'],
    queryFn: questionnaireApi.getMyQuestionnaire,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (questionnaireQuery.data) {
      setForm(questionnaireQuery.data);
    }
  }, [questionnaireQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => questionnaireApi.saveMyQuestionnaire(buildPayload(form, facePhotoUri)),
    onSuccess: data => {
      setFacePhotoUri(null);
      setForm(data);
      queryClient.setQueryData(['my-questionnaire'], data);
      Alert.alert('Анкета сохранена', 'Данные отправлены менеджеру и обновлены в кабинете.');
    },
    onError: error => Alert.alert('Не удалось сохранить анкету', getApiErrorMessage(error)),
  });

  const attachmentMutation = useMutation({
    mutationFn: questionnaireApi.uploadAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-questionnaire'] });
      Alert.alert('Файл загружен', 'Подтверждающий документ прикреплен к анкете.');
    },
    onError: error => Alert.alert('Не удалось загрузить файл', getApiErrorMessage(error)),
  });

  const update = (field: keyof ApplicantQuestionnaire, value: string | boolean | string[] | ApplicantQuestionnaire['languages']) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleListValue = (field: 'achievements' | 'help_needed', value: string) => {
    const current = Array.isArray(form[field]) ? [...(form[field] as string[])] : [];
    const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
    update(field, next);
  };

  const toggleLanguage = (language: string) => {
    const current = Array.isArray(form.languages) ? [...form.languages] : [];
    const exists = current.find(item => item.language === language);
    update(
      'languages',
      exists
        ? current.filter(item => item.language !== language)
        : [...current, { language, level: 'средний' }],
    );
  };

  const setLanguageLevel = (language: string, level: string) => {
    const current = Array.isArray(form.languages) ? [...form.languages] : [];
    update('languages', current.map(item => item.language === language ? { ...item, level } : item));
  };

  const pickFacePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к фото, чтобы загрузить изображение лица.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setFacePhotoUri(result.assets[0].uri);
    }
  };

  const pickAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    attachmentMutation.mutate({
      uri: asset.uri,
      name: asset.name || `questionnaire-file-${Date.now()}`,
      type: asset.mimeType || 'application/octet-stream',
    });
  };

  const photoUrl = useMemo(
    () => facePhotoUri || getMediaUrl(form.face_photo || null),
    [facePhotoUri, form.face_photo],
  );

  const handleSave = () => {
    if (!form.data_processing_consent) {
      Alert.alert('Нужно согласие', 'Перед сохранением анкеты подтвердите согласие на обработку персональных данных.');
      return;
    }
    saveMutation.mutate();
  };

  if (questionnaireQuery.isLoading) {
    return (
      <Screen scroll style={styles.screen}>
        <LoadingSkeleton rows={6} height={120} />
      </Screen>
    );
  }

  if (questionnaireQuery.isError) {
    return (
      <Screen scroll style={styles.screen}>
        <ErrorState onAction={() => questionnaireQuery.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.screen} refreshing={questionnaireQuery.isRefetching} onRefresh={() => questionnaireQuery.refetch()}>
      <RedGradientHero backgroundImage={bannerImages.application} style={styles.hero}>
        <Badge label="Личный кабинет" variant="mint" icon="document" />
        <Text style={styles.heroTitle}>Анкета абитуриента</Text>
        <Text style={styles.heroText}>Заполните данные для подготовки документов и сопровождения поступления.</Text>
      </RedGradientHero>

      <Section title="Личные данные">
        <Pressable style={styles.photoRow} onPress={pickFacePhoto}>
          {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.facePhoto} /> : <View style={styles.facePhotoPlaceholder}><SvgIcon name="profile" size={34} color={colors.secondary} /></View>}
          <View style={styles.photoTextBox}>
            <Text style={styles.photoTitle}>Фотография лица</Text>
            <Text style={styles.photoHint}>Загрузите фото. При выборе можно обрезать его по квадрату.</Text>
          </View>
        </Pressable>
        <Field label="Полное ФИО" value={form.full_name} onChangeText={value => update('full_name', value)} />
        <Field label="Дата рождения" placeholder="YYYY-MM-DD" value={form.birth_date || ''} onChangeText={value => update('birth_date', value)} />
        <ChoiceGroup value={form.gender || ''} options={[{ label: 'Мужской', value: 'male' }, { label: 'Женский', value: 'female' }]} onChange={value => update('gender', value)} />
        <Field label="Гражданство" value={form.citizenship} onChangeText={value => update('citizenship', value)} />
        <Field label="Семейное положение" value={form.marital_status} onChangeText={value => update('marital_status', value)} />
      </Section>

      <Section title="Адрес проживания">
        <Field label="Страна" value={form.residence_country} onChangeText={value => update('residence_country', value)} />
        <Field label="Область / регион" value={form.residence_region} onChangeText={value => update('residence_region', value)} />
        <Field label="Город / населенный пункт" value={form.residence_city} onChangeText={value => update('residence_city', value)} />
        <Field label="Улица" value={form.residence_street} onChangeText={value => update('residence_street', value)} />
        <Field label="Дом / квартира" value={form.residence_house} onChangeText={value => update('residence_house', value)} />
        <Field label="Почтовый индекс" value={form.residence_postal_code} onChangeText={value => update('residence_postal_code', value)} />
      </Section>

      <Section title="Паспортные данные">
        <Field label="Паспорт серия и номер" value={form.passport_number} onChangeText={value => update('passport_number', value)} />
        <Field label="Где оформлен паспорт" value={form.passport_issued_by} onChangeText={value => update('passport_issued_by', value)} />
        <Field label="Дата начала действия" placeholder="YYYY-MM-DD" value={form.passport_issue_date || ''} onChangeText={value => update('passport_issue_date', value)} />
        <Field label="Дата окончания действия" placeholder="YYYY-MM-DD" value={form.passport_expiry_date || ''} onChangeText={value => update('passport_expiry_date', value)} />
        <SelectChips label="Есть действующий загранпаспорт" options={PASSPORT_OPTIONS} value={form.has_international_passport || ''} onChange={value => update('has_international_passport', value)} />
      </Section>

      <Section title="Контакты абитуриента">
        <Field label="Основной телефон" value={form.phone} onChangeText={value => update('phone', value)} />
        <Field label="Email" value={form.email} keyboardType="email-address" onChangeText={value => update('email', value)} />
        <Field label="Дополнительный телефон" value={form.extra_phone} onChangeText={value => update('extra_phone', value)} />
        <Field label="Imo" value={form.imo} onChangeText={value => update('imo', value)} />
        <Field label="Telegram" value={form.telegram} onChangeText={value => update('telegram', value)} />
        <SelectChips label="Предпочтительный способ связи" options={CONTACT_METHODS} value={form.preferred_contact_method || ''} onChange={value => update('preferred_contact_method', value)} />
      </Section>

      <Section title="Родители / законные представители">
        <Field label="ФИО родителя" value={form.parent_full_name} onChangeText={value => update('parent_full_name', value)} />
        <Field label="Кем является" value={form.parent_relation} onChangeText={value => update('parent_relation', value)} />
        <Field label="Контакты родителя" value={form.parent_contacts} onChangeText={value => update('parent_contacts', value)} />
        <Field label="Кем и где работает" value={form.parent_workplace} onChangeText={value => update('parent_workplace', value)} />
        <Field label="В семье имеется" value={form.family_members} onChangeText={value => update('family_members', value)} />
      </Section>

      <Section title="Образование">
        <SelectChips label="Уровень образования" options={EDUCATION_LEVELS} value={form.education_level || ''} onChange={value => update('education_level', value)} />
        {form.education_level === 'Учусь в школе' ? <SelectChips label="Класс" options={SCHOOL_CLASSES} value={form.school_class || ''} onChange={value => update('school_class', value)} /> : null}
        <Field label="Учебное заведение" value={form.school_name} onChangeText={value => update('school_name', value)} />
        <Field label="Страна учебного заведения" value={form.school_country} onChangeText={value => update('school_country', value)} />
        <Field label="Город учебного заведения" value={form.school_city} onChangeText={value => update('school_city', value)} />
        <Field label="Год окончания" value={form.graduation_year} onChangeText={value => update('graduation_year', value)} />
        <Field label="Статус, если еще учитесь" value={form.education_status} onChangeText={value => update('education_status', value)} />
      </Section>

      <Section title="Достижения и дополнительные документы">
        <Checklist options={ACHIEVEMENTS} selected={form.achievements || []} onToggle={value => toggleListValue('achievements', value)} />
        <AppButton title="Загрузить подтверждающий файл" variant="outline" onPress={pickAttachment} loading={attachmentMutation.isPending} />
        {form.attachments?.length ? (
          <View style={styles.attachmentsList}>
            {form.attachments.map(item => (
              <Text key={item.id} style={styles.attachmentText}>{item.original_name || 'Файл'} · {new Date(item.created_at).toLocaleDateString('ru-RU')}</Text>
            ))}
          </View>
        ) : null}
      </Section>

      <Section title="Языки">
        <Checklist options={LANGUAGE_OPTIONS} selected={(form.languages || []).map(item => item.language)} onToggle={toggleLanguage} />
        {(form.languages || []).map(item => (
          <SelectChips
            key={item.language}
            label={`Уровень: ${item.language}`}
            options={LANGUAGE_LEVELS}
            value={item.level}
            onChange={value => setLanguageLevel(item.language, value)}
          />
        ))}
      </Section>

      <Section title="Поступление">
        <Field label="Желаемая программа / Вуз" maxLength={255} value={form.desired_program} onChangeText={value => update('desired_program', value)} />
        <Field label="Цель поступления" multiline value={form.admission_goal} onChangeText={value => update('admission_goal', value)} />
        <Field label="Желаемый город" value={form.desired_city} onChangeText={value => update('desired_city', value)} />
        <Field label="Желаемая страна" value={form.desired_country} onChangeText={value => update('desired_country', value)} />
        <Field label="Желаемый язык обучения" value={form.desired_language} onChangeText={value => update('desired_language', value)} />
        <SelectChips label="Желаемый уровень обучения" options={DESIRED_LEVELS} value={form.desired_education_level || ''} onChange={value => update('desired_education_level', value)} />
        <SelectChips label="Срочность поступления" options={URGENCY_OPTIONS} value={form.admission_urgency || ''} onChange={value => update('admission_urgency', value)} />
        <Text style={styles.subLabel}>Нужна помощь с</Text>
        <Checklist options={HELP_OPTIONS} selected={form.help_needed || []} onToggle={value => toggleListValue('help_needed', value)} />
      </Section>

      <Section title="Виза">
        <SelectChips label="Виза имеется?" options={['да', 'нет']} value={form.has_visa || ''} onChange={value => update('has_visa', value)} />
        {form.has_visa === 'да' ? (
          <>
            <Field label="Страна оформления визы" value={form.visa_country} onChangeText={value => update('visa_country', value)} />
            <Field label="Город оформления визы" value={form.visa_city} onChangeText={value => update('visa_city', value)} />
            <Field label="Срок действия визы" placeholder="YYYY-MM-DD" value={form.visa_valid_until || ''} onChangeText={value => update('visa_valid_until', value)} />
          </>
        ) : null}
      </Section>

      <Section title="Дополнительная информация">
        <Field label="Любимые хобби" multiline value={form.hobbies} onChangeText={value => update('hobbies', value)} />
        <Field label="Комментарий абитуриента" multiline value={form.applicant_comment} onChangeText={value => update('applicant_comment', value)} />
        <SelectChips label="Откуда узнали о Student’s Life" options={REFERRAL_OPTIONS} value={form.referral_source || ''} onChange={value => update('referral_source', value)} />
      </Section>

      <AppCard style={styles.consentCard}>
        <Pressable style={styles.consentRow} onPress={() => update('data_processing_consent', !form.data_processing_consent)}>
          <View style={[styles.checkbox, form.data_processing_consent && styles.checkboxActive]}>
            {form.data_processing_consent ? <SvgIcon name="check" size={15} color={colors.white} strokeWidth={2.6} /> : null}
          </View>
          <Text style={styles.consentText}>Я согласен/согласна на обработку персональных данных для оформления поступления.</Text>
        </Pressable>
        <AppButton title="Открыть текст согласия" variant="ghost" onPress={() => navigation.navigate('DataConsent')} />
      </AppCard>

      <View style={styles.actions}>
        <AppButton title="Сохранить анкету" onPress={handleSave} loading={saveMutation.isPending} />
        {form.generated_document_url ? (
          <AppButton title="Скачать документ анкеты" variant="outline" onPress={() => Linking.openURL(form.generated_document_url || '')} />
        ) : null}
      </View>
    </Screen>
  );
}

function buildPayload(form: Partial<ApplicantQuestionnaire>, facePhotoUri: string | null) {
  const useFormData = Boolean(facePhotoUri);
  if (!useFormData) {
    const payload: Partial<ApplicantQuestionnaire> = {};
    TEXT_FIELDS.forEach(field => {
      const value = form[field];
      if (value !== undefined && value !== null && value !== '') {
        (payload as Record<string, unknown>)[field] = value;
      }
    });
    payload.achievements = form.achievements || [];
    payload.languages = form.languages || [];
    payload.help_needed = form.help_needed || [];
    payload.data_processing_consent = Boolean(form.data_processing_consent);
    return payload;
  }

  const data = new FormData();
  TEXT_FIELDS.forEach(field => {
    const value = form[field];
    if (value !== undefined && value !== null && value !== '') {
      data.append(field, String(value));
    }
  });
  data.append('achievements', JSON.stringify(form.achievements || []));
  data.append('languages', JSON.stringify(form.languages || []));
  data.append('help_needed', JSON.stringify(form.help_needed || []));
  data.append('data_processing_consent', form.data_processing_consent ? 'true' : 'false');
  if (facePhotoUri) {
    data.append('face_photo', {
      uri: facePhotoUri,
      name: `face-photo-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any);
  }
  return data;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AppCard style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </AppCard>
  );
}

function Field(props: React.ComponentProps<typeof AppInput>) {
  return <AppInput {...props} style={[props.multiline && styles.multilineInput, props.style]} />;
}

function ChoiceGroup({ value, options, onChange }: { value: string; options: Array<{ label: string; value: string }>; onChange: (value: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map(item => (
        <Pressable key={item.value} style={[styles.chip, value === item.value && styles.chipActive]} onPress={() => onChange(item.value)}>
          <Text style={[styles.chipText, value === item.value && styles.chipTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SelectChips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.selectBlock}>
      <Text style={styles.subLabel}>{label}</Text>
      <ChoiceGroup value={value} options={options.map(item => ({ label: item, value: item }))} onChange={onChange} />
    </View>
  );
}

function Checklist({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <View style={styles.checkGrid}>
      {options.map(item => {
        const active = selected.includes(item);
        return (
          <Pressable key={item} style={[styles.checkItem, active && styles.checkItemActive]} onPress={() => onToggle(item)}>
            <View style={[styles.smallCheckbox, active && styles.checkboxActive]}>
              {active ? <SvgIcon name="check" size={12} color={colors.white} strokeWidth={2.8} /> : null}
            </View>
            <Text style={[styles.checkText, active && styles.checkTextActive]}>{item}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 250, marginBottom: spacing.lg },
  heroTitle: { color: colors.white, fontSize: 31, lineHeight: 37, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  heroText: { color: 'rgba(255,255,255,0.92)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.md },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  facePhoto: { width: 86, height: 86, borderRadius: radius.lg, backgroundColor: colors.border },
  facePhotoPlaceholder: { width: 86, height: 86, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  photoTextBox: { flex: 1 },
  photoTitle: { color: colors.text, fontWeight: typography.weights.heavy },
  photoHint: { color: colors.muted, lineHeight: 19, marginTop: 3, fontSize: typography.small },
  multilineInput: { minHeight: 92, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: { minHeight: 36, borderRadius: radius.md, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: typography.weights.bold, fontSize: typography.small },
  chipTextActive: { color: colors.white },
  selectBlock: { marginBottom: spacing.md },
  subLabel: { color: colors.text, fontSize: typography.small, fontWeight: typography.weights.bold, marginBottom: spacing.xs },
  checkGrid: { gap: spacing.xs, marginBottom: spacing.md },
  checkItem: { minHeight: 44, borderRadius: radius.md, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  checkItemActive: { borderColor: 'rgba(184,32,26,0.32)', backgroundColor: 'rgba(184,32,26,0.07)' },
  smallCheckbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  checkText: { flex: 1, color: colors.text, fontWeight: typography.weights.bold },
  checkTextActive: { color: colors.primary },
  attachmentsList: { marginTop: spacing.md, gap: spacing.xs },
  attachmentText: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold },
  consentCard: { marginBottom: spacing.lg },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  consentText: { flex: 1, color: colors.text, lineHeight: 22, fontWeight: typography.weights.bold },
  actions: { gap: spacing.sm },
});
