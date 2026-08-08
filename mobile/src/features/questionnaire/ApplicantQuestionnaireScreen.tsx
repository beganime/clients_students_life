import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';

import { educationCatalogApi } from '../../api/educationCatalog';
import {
  buildOnboardingPayload,
  onboardingApi,
  onboardingSubmissionStorage,
  StoredOnboardingSubmission,
} from '../../api/onboarding';
import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { Badge } from '../../components/Badge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { getDevicePushToken } from '../../hooks/usePushNotifications';
import { ApplicantQuestionnaire, OnboardingSubmissionStatus, Program, UniversityChoiceDraft } from '../../types/api';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  loadOfflineQuestionnaireDraft,
  saveOfflineQuestionnaireDraft,
} from '../../utils/offlineStorage';

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
const CURRENT_EDUCATION_STATUS_OPTIONS = [
  'школьник',
  'выпускник школы',
  'студент колледжа',
  'выпускник колледжа',
  'студент бакалавриата',
  'выпускник бакалавриата',
  'студент магистратуры',
  'выпускник магистратуры',
  'другое',
];

const QUESTIONNAIRE_FIELD_LABELS: Record<string, string> = {
  form_type: 'Тип заявки',
  full_name: 'Полное ФИО',
  birth_date: 'Дата рождения',
  gender: 'Пол',
  citizenship: 'Гражданство',
  marital_status: 'Семейное положение',
  residence_country: 'Страна проживания',
  residence_region: 'Область / регион',
  residence_city: 'Город / населенный пункт',
  residence_street: 'Улица',
  residence_house: 'Дом / квартира',
  residence_postal_code: 'Почтовый индекс',
  passport_number: 'Паспорт серия и номер',
  passport_issued_by: 'Где оформлен паспорт',
  passport_issue_date: 'Дата начала действия паспорта',
  passport_expiry_date: 'Дата окончания действия паспорта',
  phone: 'Основной номер телефона',
  email: 'Email',
  extra_phone: 'Дополнительный номер телефона',
  imo: 'Imo',
  telegram: 'Telegram',
  preferred_contact_method: 'Предпочтительный способ связи',
  parent_full_name: 'ФИО родителя',
  parent_relation: 'Кем является родитель',
  parent_contacts: 'Контакты родителя',
  parent_workplace: 'Кем и где работает родитель',
  family_members: 'Состав семьи',
  education_level: 'Уровень образования',
  school_class: 'Класс',
  school_name: 'Учебное заведение',
  school_country: 'Страна учебного заведения',
  school_city: 'Город учебного заведения',
  graduation_year: 'Год окончания',
  education_status: 'Текущий статус образования',
  desired_program: 'Желаемая программа / вуз',
  desired_country: 'Желаемая страна поступления',
  desired_city: 'Желаемый город поступления',
  desired_language: 'Желаемый язык обучения',
  desired_education_level: 'Желаемый уровень обучения',
  admission_urgency: 'Срочность поступления',
  data_processing_consent: 'Согласие на обработку персональных данных',
};

export function ApplicantQuestionnaireScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isOnline } = useNetworkStatus();
  const initialFormType = route.params?.formType === 'school_student' ? 'school_student' : 'applicant';
  const [form, setForm] = useState<Partial<ApplicantQuestionnaire>>({
    form_type: initialFormType,
    academic_year: String(new Date().getFullYear() + 1),
    university_choices: [],
  });
  const [offlineDraftSavedAt, setOfflineDraftSavedAt] = useState<string | null>(null);
  const [offlineDraftChecked, setOfflineDraftChecked] = useState(false);
  const [storedSubmission, setStoredSubmission] = useState<StoredOnboardingSubmission | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<OnboardingSubmissionStatus | null>(null);
  const [statusRefreshing, setStatusRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    loadOfflineQuestionnaireDraft()
      .then(draft => {
        if (!active || !draft) return;
        setForm(prev => ({ ...prev, ...draft.form }));
        setOfflineDraftSavedAt(draft.saved_at);
      })
      .finally(() => {
        if (active) setOfflineDraftChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onboardingSubmissionStorage.get().then(stored => {
      setStoredSubmission(stored);
    });
  }, []);

  useEffect(() => {
    if (!storedSubmission) return undefined;
    let active = true;
    const refresh = async () => {
      try {
        const status = await onboardingApi.getStatus(storedSubmission);
        if (active) setSubmissionStatus(status);
      } catch {
        // A temporary status check failure must not hide the local draft.
      }
    };
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [storedSubmission]);

  useEffect(() => {
    if (route.params?.formType) {
      setForm(prev => ({
        ...prev,
        form_type: route.params.formType,
        education_status: route.params.formType === 'school_student' ? 'школьник' : prev.education_status,
      }));
    }
  }, [route.params?.formType]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fcmToken = await getDevicePushToken(true).catch(() => '');
      const payload = { ...buildOnboardingPayload(form), fcm_token: fcmToken };
      if (storedSubmission && storedSubmission.kind === payload.kind && submissionStatus?.status === 'changes_requested') {
        return onboardingApi.resubmit(storedSubmission, payload);
      }
      return onboardingApi.submit(payload);
    },
    onSuccess: async data => {
      const stored = await onboardingSubmissionStorage.get();
      setStoredSubmission(stored);
      setSubmissionStatus(data);
      const draft = await saveOfflineQuestionnaireDraft(form);
      setOfflineDraftSavedAt(draft.saved_at);
      Alert.alert('Анкета отправлена', 'Данные отправлены менеджеру на проверку. Статус можно смотреть на этом экране.');
    },
    onError: error => Alert.alert('Не удалось сохранить анкету', formatQuestionnaireError(error)),
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

  const handleSaveDraft = async () => {
    const draft = await saveOfflineQuestionnaireDraft(form);
    setForm(draft.form);
    setOfflineDraftSavedAt(draft.saved_at);
    Alert.alert('Черновик сохранён', 'Черновик хранится только на этом устройстве и не отправлен на сервер.');
  };

  const handleSave = async () => {
    const currentKind = form.form_type === 'school_student' ? 'school_student' : 'applicant';
    if (
      storedSubmission?.kind === currentKind
      && submissionStatus
      && submissionStatus.status !== 'changes_requested'
    ) {
      Alert.alert('Анкета уже отправлена', 'Дождитесь решения менеджера. Повторная отправка не создастся.');
      return;
    }
    if (!form.data_processing_consent) {
      Alert.alert('Нужно согласие', 'Перед отправкой анкеты подтвердите согласие на обработку персональных данных.');
      return;
    }
    if (!form.full_name?.trim() || !form.phone?.trim() || !Number(form.academic_year)) {
      Alert.alert('Не хватает данных', 'Укажите ФИО, телефон и год поступления.');
      return;
    }
    if (form.form_type !== 'school_student') {
      const choices = form.university_choices || [];
      const programCount = new Set(choices.flatMap(item => item.program_ids)).size;
      if (choices.length < 3 || choices.length > 5 || programCount < 3 || programCount > 6 || choices.some(item => item.program_ids.length === 0)) {
        Alert.alert('Проверьте выбор', 'Нужно выбрать от 3 до 5 вузов, минимум одну программу в каждом вузе и от 3 до 6 программ всего.');
        return;
      }
    }
    if (!isOnline) {
      const nextForm = { ...form, data_processing_consent: true };
      const draft = await saveOfflineQuestionnaireDraft(nextForm);
      setForm(nextForm);
      setOfflineDraftSavedAt(draft.saved_at);
      Alert.alert('Анкета сохранена offline', 'После восстановления интернета нажмите «Синхронизировать».');
      return;
    }
    saveMutation.mutate();
  };

  const handleSyncOfflineDraft = () => {
    if (!isOnline) {
      Alert.alert('Нет интернета', 'Синхронизация будет доступна после подключения.');
      return;
    }
    if (!form.data_processing_consent) {
      Alert.alert('Нужно согласие', 'Подтвердите согласие перед отправкой анкеты.');
      return;
    }
    const currentKind = form.form_type === 'school_student' ? 'school_student' : 'applicant';
    if (storedSubmission?.kind === currentKind && submissionStatus?.status !== 'changes_requested') {
      Alert.alert('Анкета уже отправлена', 'Синхронизация доступна после возврата анкеты менеджером на исправление.');
      return;
    }
    saveMutation.mutate();
  };

  const handleRefreshStatus = async () => {
    if (!storedSubmission || statusRefreshing) return;
    setStatusRefreshing(true);
    try {
      setSubmissionStatus(await onboardingApi.getStatus(storedSubmission));
    } catch (error) {
      Alert.alert('Не удалось обновить статус', getApiErrorMessage(error));
    } finally {
      setStatusRefreshing(false);
    }
  };

  if (!offlineDraftChecked) {
    return (
      <Screen scroll style={styles.screen}>
        <LoadingSkeleton rows={6} height={120} />
      </Screen>
    );
  }

  const isSchoolStudent = form.form_type === 'school_student';
  const activeSubmissionStatus = !storedSubmission?.kind
    || storedSubmission.kind === (isSchoolStudent ? 'school_student' : 'applicant')
    ? submissionStatus
    : null;

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero backgroundImage={bannerImages.application} style={styles.hero}>
        <Badge label="Аккаунт после одобрения" variant="mint" icon="document" />
        <Text style={styles.heroTitle}>Анкета абитуриента</Text>
        <Text style={styles.heroText}>Заполняйте анкету как черновик. На проверку она уйдёт только после отдельной отправки.</Text>
      </RedGradientHero>

      {activeSubmissionStatus ? (
        <AppCard style={styles.statusCard}>
          <Badge
            label={submissionStatusLabel(activeSubmissionStatus.status)}
            variant={activeSubmissionStatus.status === 'approved' ? 'mint' : 'neutral'}
            icon={activeSubmissionStatus.status === 'approved' ? 'check' : 'document'}
          />
          <Text style={styles.statusTitle}>Статус отправленной анкеты</Text>
          {activeSubmissionStatus.sl_id ? <Text style={styles.slId}>Ваш ID: {activeSubmissionStatus.sl_id}</Text> : null}
          {activeSubmissionStatus.review_comment ? (
            <Text style={styles.statusComment}>Комментарий менеджера: {activeSubmissionStatus.review_comment}</Text>
          ) : null}
          {activeSubmissionStatus.admission_status ? (
            <View style={styles.admissionStatus}>
              <Text style={styles.admissionStatusTitle}>Ход поступления</Text>
              {activeSubmissionStatus.admission_status.current_status ? (
                <Text style={styles.statusComment}>Текущий этап: {activeSubmissionStatus.admission_status.current_status}</Text>
              ) : null}
              {activeSubmissionStatus.admission_status.invitation_city ? (
                <Text style={styles.statusComment}>Город приглашения: {activeSubmissionStatus.admission_status.invitation_city}</Text>
              ) : null}
              {activeSubmissionStatus.admission_status.meeting ? (
                <Text style={styles.statusComment}>Встреча: {activeSubmissionStatus.admission_status.meeting}</Text>
              ) : null}
              {activeSubmissionStatus.admission_status.current_location ? (
                <Text style={styles.statusComment}>Сейчас находится: {activeSubmissionStatus.admission_status.current_location}</Text>
              ) : null}
            </View>
          ) : null}
          {activeSubmissionStatus.university_choices?.length ? (
            <View style={styles.admissionStatus}>
              <Text style={styles.admissionStatusTitle}>Выбранные вузы и программы</Text>
              {activeSubmissionStatus.university_choices.map(choice => (
                <Text key={choice.university_id} style={styles.statusComment}>
                  {choice.rank}. {choice.university_name}
                  {choice.programs.length ? ` — ${choice.programs.map(program => program.name).join(', ')}` : ''}
                </Text>
              ))}
            </View>
          ) : null}
          <AppButton title="Обновить статус" variant="outline" onPress={handleRefreshStatus} loading={statusRefreshing} />
          {activeSubmissionStatus.status === 'approved' ? (
            <>
              <Text style={styles.statusComment}>
                Анкета одобрена. Получите пароль у менеджера, подтвердите вход и профиль сохранится на этом телефоне.
              </Text>
              <AppButton
                title="Подтвердить и войти"
                onPress={() => navigation.navigate('Auth', {
                  screen: 'Login',
                  params: {
                    slId: activeSubmissionStatus.sl_id || undefined,
                    fromApprovedOnboarding: true,
                  },
                })}
              />
            </>
          ) : null}
        </AppCard>
      ) : null}

      <Section title="Тип заявки">
        <ChoiceGroup
          value={form.form_type || 'applicant'}
          options={[
            { label: 'Я ещё школьник', value: 'school_student' },
            { label: 'Я абитуриент', value: 'applicant' },
          ]}
          onChange={value => setForm(prev => ({
            ...prev,
            form_type: value as ApplicantQuestionnaire['form_type'],
            education_status: value === 'school_student' ? 'школьник' : prev.education_status,
          }))}
        />
        <Text style={styles.typeHint}>
          {isSchoolStudent
            ? 'Короткая предварительная заявка: без паспортных и визовых данных, чтобы начать подготовку заранее.'
            : 'Полная анкета для поступления с документами, паспортными данными и подготовкой пакета.'}
        </Text>
        <Field
          label="Год поступления"
          value={form.academic_year || ''}
          keyboardType="number-pad"
          onChangeText={value => update('academic_year', value)}
        />
      </Section>

      <Section title="Личные данные">
        <Field label="Полное ФИО" value={form.full_name} onChangeText={value => update('full_name', value)} />
        <Field label="Дата рождения" placeholder="YYYY-MM-DD" value={form.birth_date || ''} onChangeText={value => update('birth_date', value)} />
        {!isSchoolStudent ? (
          <ChoiceGroup value={form.gender || ''} options={[{ label: 'Мужской', value: 'male' }, { label: 'Женский', value: 'female' }]} onChange={value => update('gender', value)} />
        ) : null}
        <Field label="Гражданство" value={form.citizenship} onChangeText={value => update('citizenship', value)} />
        {!isSchoolStudent ? <Field label="Семейное положение" value={form.marital_status} onChangeText={value => update('marital_status', value)} /> : null}
      </Section>

      <Section title="Адрес проживания">
        <Field label="Страна" value={form.residence_country} onChangeText={value => update('residence_country', value)} />
        <Field label="Область / регион" value={form.residence_region} onChangeText={value => update('residence_region', value)} />
        <Field label="Город / населенный пункт" value={form.residence_city} onChangeText={value => update('residence_city', value)} />
        <Field label="Улица" value={form.residence_street} onChangeText={value => update('residence_street', value)} />
        <Field label="Дом / квартира" value={form.residence_house} onChangeText={value => update('residence_house', value)} />
        <Field label="Почтовый индекс" value={form.residence_postal_code} onChangeText={value => update('residence_postal_code', value)} />
      </Section>

      {!isSchoolStudent ? <Section title="Паспортные данные">
        <Field label="Паспорт серия и номер" value={form.passport_number} onChangeText={value => update('passport_number', value)} />
        <Field label="Где оформлен паспорт" value={form.passport_issued_by} onChangeText={value => update('passport_issued_by', value)} />
        <Field label="Дата начала действия" placeholder="YYYY-MM-DD" value={form.passport_issue_date || ''} onChangeText={value => update('passport_issue_date', value)} />
        <Field label="Дата окончания действия" placeholder="YYYY-MM-DD" value={form.passport_expiry_date || ''} onChangeText={value => update('passport_expiry_date', value)} />
        <SelectChips label="Есть действующий загранпаспорт" options={PASSPORT_OPTIONS} value={form.has_international_passport || ''} onChange={value => update('has_international_passport', value)} />
      </Section> : null}

      <Section title="Контакты абитуриента">
        <Field label="Основной номер телефона" value={form.phone} keyboardType="phone-pad" onChangeText={value => update('phone', value)} />
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
        <SelectChips label="Текущий статус образования" options={CURRENT_EDUCATION_STATUS_OPTIONS} value={form.education_status || (isSchoolStudent ? 'школьник' : '')} onChange={value => update('education_status', value)} />
        <SelectChips label="Уровень образования" options={EDUCATION_LEVELS} value={form.education_level || ''} onChange={value => update('education_level', value)} />
        {isSchoolStudent || form.education_status === 'школьник' || form.education_level === 'Учусь в школе' ? <SelectChips label="Класс" options={SCHOOL_CLASSES} value={form.school_class || ''} onChange={value => update('school_class', value)} /> : null}
        <Field label="Учебное заведение" value={form.school_name} onChangeText={value => update('school_name', value)} />
        <Field label="Страна учебного заведения" value={form.school_country} onChangeText={value => update('school_country', value)} />
        <Field label="Город учебного заведения" value={form.school_city} onChangeText={value => update('school_city', value)} />
        <Field label="Год окончания" value={form.graduation_year} onChangeText={value => update('graduation_year', value)} />
      </Section>

      {!isSchoolStudent ? <Section title="Достижения">
        <Checklist options={ACHIEVEMENTS} selected={form.achievements || []} onToggle={value => toggleListValue('achievements', value)} />
        <Text style={styles.typeHint}>Подтверждающие файлы менеджер запросит после одобрения анкеты и создания аккаунта.</Text>
      </Section> : null}

      {!isSchoolStudent ? <Section title="Языки">
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
      </Section> : null}

      <Section title="Поступление">
        {!isSchoolStudent ? (
          <UniversityProgramSelection
            value={form.university_choices || []}
            onChange={value => setForm(prev => ({ ...prev, university_choices: value }))}
            initialUniversityId={route.params?.universityId}
            initialProgramId={route.params?.programId}
          />
        ) : null}
        <Field label="Цель поступления" multiline value={form.admission_goal} onChangeText={value => update('admission_goal', value)} />
        <Field label="Желаемый город" value={form.desired_city} onChangeText={value => update('desired_city', value)} />
        <Field label="Желаемая страна" value={form.desired_country} onChangeText={value => update('desired_country', value)} />
        <Field label="Желаемый язык обучения" value={form.desired_language} onChangeText={value => update('desired_language', value)} />
        <SelectChips label="Желаемый уровень обучения" options={DESIRED_LEVELS} value={form.desired_education_level || ''} onChange={value => update('desired_education_level', value)} />
        <SelectChips label="Срочность поступления" options={URGENCY_OPTIONS} value={form.admission_urgency || ''} onChange={value => update('admission_urgency', value)} />
        <Text style={styles.subLabel}>Нужна помощь с</Text>
        <Checklist options={HELP_OPTIONS} selected={form.help_needed || []} onToggle={value => toggleListValue('help_needed', value)} />
      </Section>

      {!isSchoolStudent ? <Section title="Виза">
        <SelectChips label="Виза имеется?" options={['да', 'нет']} value={form.has_visa || ''} onChange={value => update('has_visa', value)} />
        {form.has_visa === 'да' ? (
          <>
            <Field label="Страна оформления визы" value={form.visa_country} onChangeText={value => update('visa_country', value)} />
            <Field label="Город оформления визы" value={form.visa_city} onChangeText={value => update('visa_city', value)} />
            <Field label="Срок действия визы" placeholder="YYYY-MM-DD" value={form.visa_valid_until || ''} onChangeText={value => update('visa_valid_until', value)} />
          </>
        ) : null}
      </Section> : null}

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

      {(offlineDraftSavedAt || !isOnline) ? (
        <AppCard style={styles.offlineCard}>
          <Text style={styles.offlineTitle}>Оффлайн-режим</Text>
          <Text style={styles.offlineText}>
            {!isOnline
              ? 'Вы сейчас offline. Данные будут синхронизированы после подключения к интернету.'
              : `Найден локальный черновик от ${formatDraftDate(offlineDraftSavedAt)}.`}
          </Text>
          {isOnline && offlineDraftSavedAt && (!submissionStatus || submissionStatus.status === 'changes_requested') ? (
            <AppButton title="Синхронизировать" variant="outline" onPress={handleSyncOfflineDraft} loading={saveMutation.isPending} />
          ) : null}
        </AppCard>
      ) : null}

      <View style={styles.actions}>
        <AppButton title="Отправить на проверку" onPress={handleSave} loading={saveMutation.isPending} />
        <AppButton title="Сохранить черновик" variant="outline" onPress={handleSaveDraft} loading={saveMutation.isPending} />
      </View>
    </Screen>
  );
}

function formatDraftDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatQuestionnaireError(error: unknown) {
  const data = (error as any)?.response?.data;
  const missing = data?.missing_required_fields || data?.errors?.missing_required_fields;
  const labels = data?.missing_required_field_labels || data?.missing_field_labels || data?.errors?.missing_required_field_labels;

  if (Array.isArray(missing) && missing.length) {
    const readableFields = Array.isArray(labels) && labels.length
      ? labels
      : missing.map(field => QUESTIONNAIRE_FIELD_LABELS[field] || field);
    return `Заполните обязательные поля: ${readableFields.join(', ')}`;
  }

  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  return getApiErrorMessage(error);
}

function submissionStatusLabel(status: OnboardingSubmissionStatus['status']) {
  if (status === 'approved') return 'Анкета одобрена';
  if (status === 'in_review') return 'Менеджер проверяет анкету';
  if (status === 'changes_requested') return 'Нужны исправления';
  if (status === 'rejected') return 'Анкета отклонена';
  return 'Анкета на проверке';
}

function UniversityProgramSelection({
  value,
  onChange,
  initialUniversityId,
  initialProgramId,
}: {
  value: UniversityChoiceDraft[];
  onChange: (value: UniversityChoiceDraft[]) => void;
  initialUniversityId?: number;
  initialProgramId?: number;
}) {
  const [search, setSearch] = useState('');
  const [activeUniversityId, setActiveUniversityId] = useState<number | null>(initialUniversityId || null);
  const universitiesQuery = useQuery({
    queryKey: ['onboarding-universities', search],
    queryFn: () => educationCatalogApi.getUniversities({ search, limit: 20 }),
    staleTime: 1000 * 60 * 10,
  });
  const initialUniversityQuery = useQuery({
    queryKey: ['onboarding-university', initialUniversityId],
    queryFn: () => educationCatalogApi.getUniversity(initialUniversityId!),
    enabled: Boolean(initialUniversityId),
    staleTime: 1000 * 60 * 30,
  });
  const programsQuery = useQuery({
    queryKey: ['onboarding-programs', activeUniversityId],
    queryFn: () => educationCatalogApi.getPrograms({ university: activeUniversityId!, limit: 100 }),
    enabled: Boolean(activeUniversityId),
    staleTime: 1000 * 60 * 20,
  });

  useEffect(() => {
    const university = initialUniversityQuery.data;
    if (!university || value.some(item => item.university_id === Number(university.id))) return;
    onChange([
      ...value,
      {
        university_id: Number(university.id),
        university_name: university.name,
        program_ids: [],
        program_names: [],
      },
    ]);
  }, [initialUniversityQuery.data, onChange, value]);

  useEffect(() => {
    if (!initialProgramId || !activeUniversityId || !programsQuery.data) return;
    const program = programsQuery.data.find(item => Number(item.id) === Number(initialProgramId));
    const choice = value.find(item => item.university_id === activeUniversityId);
    if (!program || !choice || choice.program_ids.includes(Number(program.id))) return;
    onChange(value.map(item => item.university_id === activeUniversityId
      ? {
          ...item,
          program_ids: [...item.program_ids, Number(program.id)],
          program_names: [...item.program_names, program.title],
        }
      : item));
  }, [activeUniversityId, initialProgramId, onChange, programsQuery.data, value]);

  const totalPrograms = new Set(value.flatMap(item => item.program_ids)).size;
  const selectUniversity = (university: any) => {
    const universityId = Number(university.id);
    setActiveUniversityId(universityId);
    if (value.some(item => item.university_id === universityId)) return;
    if (value.length >= 5) {
      Alert.alert('Лимит выбора', 'Можно выбрать не больше 5 вузов.');
      return;
    }
    onChange([...value, {
      university_id: universityId,
      university_name: university.name,
      program_ids: [],
      program_names: [],
    }]);
  };
  const toggleProgram = (program: Program) => {
    if (!activeUniversityId) return;
    const programId = Number(program.id);
    const choice = value.find(item => item.university_id === activeUniversityId);
    if (!choice) return;
    const selected = choice.program_ids.includes(programId);
    if (!selected && totalPrograms >= 6) {
      Alert.alert('Лимит выбора', 'Можно выбрать не больше 6 программ.');
      return;
    }
    onChange(value.map(item => item.university_id === activeUniversityId
      ? {
          ...item,
          program_ids: selected ? item.program_ids.filter(id => id !== programId) : [...item.program_ids, programId],
          program_names: selected ? item.program_names.filter((_, index) => item.program_ids[index] !== programId) : [...item.program_names, program.title],
        }
      : item));
  };

  return (
    <View style={styles.universityPicker}>
      <Text style={styles.subLabel}>Выберите 3–5 вузов и 3–6 программ</Text>
      <Text style={styles.selectionCounter}>Вузов: {value.length}/5 · программ: {totalPrograms}/6</Text>
      {value.map(choice => (
        <View key={choice.university_id} style={styles.selectedUniversity}>
          <Pressable style={styles.selectedUniversityMain} onPress={() => setActiveUniversityId(choice.university_id)}>
            <Text style={styles.selectedUniversityTitle}>{choice.university_name}</Text>
            <Text style={styles.selectedUniversityPrograms}>
              {choice.program_names.length ? choice.program_names.join(', ') : 'Выберите минимум одну программу'}
            </Text>
          </Pressable>
          <Pressable onPress={() => {
            onChange(value.filter(item => item.university_id !== choice.university_id));
            if (activeUniversityId === choice.university_id) setActiveUniversityId(null);
          }}>
            <SvgIcon name="close" size={20} color={colors.danger} />
          </Pressable>
        </View>
      ))}

      <Field label="Найти вуз" value={search} onChangeText={setSearch} placeholder="Название вуза" />
      {universitiesQuery.isLoading ? <LoadingSkeleton rows={2} height={54} /> : null}
      <View style={styles.catalogChoices}>
        {(universitiesQuery.data || []).map(university => (
          <Pressable
            key={university.id}
            style={[
              styles.catalogChoice,
              value.some(item => item.university_id === Number(university.id)) && styles.catalogChoiceActive,
            ]}
            onPress={() => selectUniversity(university)}
          >
            <Text style={styles.catalogChoiceText}>{university.name}</Text>
          </Pressable>
        ))}
      </View>

      {activeUniversityId ? (
        <View style={styles.programPicker}>
          <Text style={styles.subLabel}>Программы выбранного вуза</Text>
          {programsQuery.isLoading ? <LoadingSkeleton rows={2} height={48} /> : null}
          <View style={styles.catalogChoices}>
            {(programsQuery.data || []).map(program => {
              const selected = value.find(item => item.university_id === activeUniversityId)?.program_ids.includes(Number(program.id));
              return (
                <Pressable
                  key={program.id}
                  style={[styles.catalogChoice, selected && styles.catalogChoiceActive]}
                  onPress={() => toggleProgram(program)}
                >
                  <Text style={styles.catalogChoiceText}>{program.title}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
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
  statusCard: { marginBottom: spacing.lg, borderColor: 'rgba(13,65,109,0.22)' },
  statusTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  slId: { color: colors.secondary, fontSize: typography.body, fontWeight: typography.weights.heavy, marginTop: spacing.sm },
  statusComment: { color: colors.text, lineHeight: 21, marginTop: spacing.sm },
  admissionStatus: {
    borderTopColor: 'rgba(13,65,109,0.14)',
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  admissionStatusTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: typography.weights.heavy,
  },
  localDraftCard: { marginBottom: spacing.lg, borderColor: 'rgba(184,32,26,0.22)', backgroundColor: 'rgba(184,32,26,0.06)' },
  localDraftTitle: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy, marginBottom: 4 },
  localDraftText: { color: colors.muted, lineHeight: 20, fontWeight: typography.weights.medium },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy, marginBottom: spacing.md },
  typeHint: { color: colors.muted, lineHeight: 20, fontWeight: typography.weights.medium, marginTop: -spacing.xs },
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
  universityPicker: { gap: spacing.sm, marginBottom: spacing.md },
  selectionCounter: { color: colors.secondary, fontWeight: typography.weights.heavy, marginBottom: spacing.xs },
  selectedUniversity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  selectedUniversityMain: { flex: 1 },
  selectedUniversityTitle: { color: colors.text, fontWeight: typography.weights.heavy },
  selectedUniversityPrograms: { color: colors.muted, fontSize: typography.small, lineHeight: 18, marginTop: 3 },
  catalogChoices: { gap: spacing.xs },
  catalogChoice: { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.card },
  catalogChoiceActive: { borderColor: colors.primary, backgroundColor: 'rgba(184,32,26,0.07)' },
  catalogChoiceText: { color: colors.text, fontWeight: typography.weights.bold, lineHeight: 19 },
  programPicker: { gap: spacing.xs, marginTop: spacing.sm },
  checkGrid: { gap: spacing.xs, marginBottom: spacing.md },
  checkItem: { minHeight: 44, borderRadius: radius.md, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  checkItemActive: { borderColor: 'rgba(184,32,26,0.32)', backgroundColor: 'rgba(184,32,26,0.07)' },
  smallCheckbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  checkText: { flex: 1, color: colors.text, fontWeight: typography.weights.bold },
  checkTextActive: { color: colors.primary },
  attachmentsList: { marginTop: spacing.md, gap: spacing.xs },
  attachmentText: { color: colors.muted, fontSize: typography.small, fontWeight: typography.weights.bold },
  consentCard: { marginBottom: spacing.lg },
  offlineCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderColor: 'rgba(13,65,109,0.22)',
    backgroundColor: 'rgba(13,65,109,0.06)',
  },
  offlineTitle: { color: colors.secondary, fontSize: typography.body, fontWeight: typography.weights.heavy },
  offlineText: { color: colors.text, lineHeight: 21, fontWeight: typography.weights.medium },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  consentText: { flex: 1, color: colors.text, lineHeight: 22, fontWeight: typography.weights.bold },
  actions: { gap: spacing.sm },
});
