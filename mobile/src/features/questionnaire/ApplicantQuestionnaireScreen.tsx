import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { useAuthStore } from '../../store/authStore';
import { ApplicantQuestionnaire, OnboardingSubmissionStatus } from '../../types/api';
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
const FUNDING_OPTIONS = [
  { label: 'Гослиния', value: 'government' },
  { label: 'Бюджет', value: 'budget' },
  { label: 'Контракт', value: 'contract' },
  { label: 'Медик', value: 'medical' },
];
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
const ADMISSION_YEARS = Array.from({ length: 11 }, (_, index) => String(new Date().getFullYear() + index));
const GRADUATION_YEARS = Array.from({ length: 30 }, (_, index) => String(new Date().getFullYear() + 5 - index));
const CITIZENSHIPS = ['Туркменистан', 'Россия', 'Беларусь', 'Казахстан', 'Узбекистан', 'Другое'];
const COUNTRIES = ['Туркменистан', 'Россия', 'Беларусь', 'Казахстан', 'Узбекистан', 'Другое'];
const TURKMENISTAN_REGIONS = ['Лебап', 'Мары', 'Ахал', 'Дашогуз', 'Балкан'];
const MARITAL_STATUSES = ['Не женат / не замужем', 'Женат / замужем', 'Разведён / разведена', 'Вдовец / вдова'];
const PARENT_RELATIONS = ['Мать', 'Отец', 'Опекун', 'Брат', 'Сестра', 'Другое'];

const QUESTIONNAIRE_FIELD_LABELS: Record<string, string> = {
  form_type: 'Тип заявки',
  full_name: 'Полное ФИО',
  birth_date: 'Дата рождения',
  gender: 'Пол',
  is_conscript: 'Призывник',
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
  education_level: 'Уровень образования',
  school_class: 'Класс',
  school_name: 'Учебное заведение',
  school_country: 'Страна учебного заведения',
  school_city: 'Город учебного заведения',
  graduation_year: 'Год окончания',
  education_status: 'Текущий статус образования',
  desired_program: 'Желаемые направления',
  desired_universities: 'Желаемые вузы',
  admission_goal: 'Цель поступления',
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
  const user = useAuthStore(state => state.user);
  const draftOwner = user?.username || user?.id || 'guest';
  const initialFormType = route.params?.formType === 'school_student' ? 'school_student' : 'applicant';
  const [form, setForm] = useState<Partial<ApplicantQuestionnaire>>({
    form_type: initialFormType,
    academic_year: String(new Date().getFullYear() + 1),
    citizenship: 'Туркменистан',
    residence_country: 'Туркменистан',
    school_country: 'Туркменистан',
    university_choices: [],
  });
  const [offlineDraftSavedAt, setOfflineDraftSavedAt] = useState<string | null>(null);
  const [offlineDraftChecked, setOfflineDraftChecked] = useState(false);
  const [storedSubmission, setStoredSubmission] = useState<StoredOnboardingSubmission | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<OnboardingSubmissionStatus | null>(null);
  const [statusRefreshing, setStatusRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    loadOfflineQuestionnaireDraft(draftOwner)
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
  }, [draftOwner]);

  const initialUniversityQuery = useQuery({
    queryKey: ['questionnaire-initial-university', route.params?.universityId],
    queryFn: () => educationCatalogApi.getUniversity(route.params.universityId),
    enabled: Boolean(route.params?.universityId),
    staleTime: 1000 * 60 * 30,
  });
  const initialProgramQuery = useQuery({
    queryKey: ['questionnaire-initial-program', route.params?.programId],
    queryFn: () => educationCatalogApi.getProgram(route.params.programId),
    enabled: Boolean(route.params?.programId),
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    const universityName = initialUniversityQuery.data?.name;
    const programName = initialProgramQuery.data?.title;
    if (!universityName && !programName) return;
    setForm(previous => ({
      ...previous,
      desired_universities: previous.desired_universities || universityName || '',
      desired_program: previous.desired_program || programName || '',
    }));
  }, [initialProgramQuery.data, initialUniversityQuery.data]);

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
        if (active) {
          setSubmissionStatus(status);
          const choices = (status.university_choices || []).map(choice => ({
            university_id: choice.university_id,
            university_name: choice.university_name,
            program_ids: choice.programs.map(program => program.id),
            program_names: choice.programs.map(program => program.name),
          }));
          setForm(prev => ({
            ...prev,
            ...(status.payload || {}),
            form_type: status.kind,
            academic_year: String(status.academic_year || prev.academic_year || ''),
            full_name: status.full_name || prev.full_name,
            phone: status.phone || prev.phone,
            email: status.email || prev.email,
            birth_date: status.date_of_birth || prev.birth_date,
            citizenship: status.citizenship || prev.citizenship,
            university_choices: choices.length ? choices : prev.university_choices,
          }));
        }
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
      if (storedSubmission && storedSubmission.kind === payload.kind) {
        return onboardingApi.resubmit(storedSubmission, payload);
      }
      return onboardingApi.submit(payload);
    },
    onSuccess: async data => {
      const stored = await onboardingSubmissionStorage.get();
      setStoredSubmission(stored);
      setSubmissionStatus(data);
      const draft = await saveOfflineQuestionnaireDraft(form, draftOwner);
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
    const draft = await saveOfflineQuestionnaireDraft(form, draftOwner);
    setForm(draft.form);
    setOfflineDraftSavedAt(draft.saved_at);
    Alert.alert('Черновик сохранён', 'Черновик хранится только на этом устройстве и не отправлен на сервер.');
  };

  const handleSave = async () => {
    if (!form.data_processing_consent) {
      Alert.alert('Нужно согласие', 'Перед отправкой анкеты подтвердите согласие на обработку персональных данных.');
      return;
    }
    if (!form.full_name?.trim() || !form.phone?.trim() || !Number(form.academic_year)) {
      Alert.alert('Не хватает данных', 'Укажите ФИО, телефон и год поступления.');
      return;
    }
    const commonRequired: Array<keyof ApplicantQuestionnaire> = [
      'birth_date', 'citizenship', 'residence_country', 'residence_city',
      'parent_full_name', 'parent_contacts', 'school_name', 'graduation_year',
      'desired_program', 'desired_universities', 'desired_country', 'admission_goal', 'funding_type',
    ];
    const applicantRequired: Array<keyof ApplicantQuestionnaire> = [
      'gender', 'marital_status', 'residence_region', 'email', 'preferred_contact_method',
      'education_level', 'education_status', 'school_country', 'school_city',
      'desired_city', 'desired_language', 'desired_education_level', 'admission_urgency',
    ];
    const schoolRequired: Array<keyof ApplicantQuestionnaire> = ['school_class', 'education_status'];
    const missingRequired = [
      ...commonRequired,
      ...(form.form_type === 'school_student' ? schoolRequired : applicantRequired),
    ].filter(field => !String(form[field] ?? '').trim());
    if (missingRequired.length) {
      Alert.alert(
        'Заполните обязательные поля',
        missingRequired.map(field => QUESTIONNAIRE_FIELD_LABELS[field] || field).join(', '),
      );
      return;
    }
    if (form.form_type !== 'school_student') {
      if (!form.birth_date || !form.citizenship || !form.marital_status || !form.residence_country || !form.residence_region || !form.residence_city) {
        Alert.alert('Не хватает личных данных', 'Заполните дату рождения, гражданство, семейное положение и адрес проживания.');
        return;
      }
      if (!form.passport_pending && (!form.passport_number || !form.passport_issued_by || !form.passport_issue_date || !form.passport_expiry_date)) {
        Alert.alert('Нужны данные загранпаспорта', 'Заполните обязательные поля или отметьте, что загранпаспорт пока отсутствует либо оформляется.');
        return;
      }
      if (!form.desired_universities?.trim() || !form.desired_program?.trim()) {
        Alert.alert('Проверьте поступление', 'Укажите желаемые вузы и направления обучения.');
        return;
      }
    }
    if (!isOnline) {
      const nextForm = { ...form, data_processing_consent: true };
      const draft = await saveOfflineQuestionnaireDraft(nextForm, draftOwner);
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
  const activeSubmissionStatus = submissionStatus?.stage === 'express' ? null : (!storedSubmission?.kind
    || storedSubmission.kind === (isSchoolStudent ? 'school_student' : 'applicant')
    ? submissionStatus
    : null);

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
                Анкета одобрена. Логин и пароль доступны ниже; можно войти без ручного ввода.
              </Text>
              {activeSubmissionStatus.service_credentials ? (
                <View style={styles.credentialsBox}>
                  <Text style={styles.credentialText}>Логин: {activeSubmissionStatus.service_credentials.mobile_login}</Text>
                  <Text style={styles.credentialText}>Пароль: {activeSubmissionStatus.service_credentials.shared_password}</Text>
                </View>
              ) : null}
              <AppButton
                title="Подтвердить и войти"
                onPress={() => navigation.navigate('Auth', {
                  screen: 'Login',
                  params: {
                    slId: activeSubmissionStatus.service_credentials?.mobile_login || activeSubmissionStatus.sl_id || undefined,
                    password: activeSubmissionStatus.service_credentials?.shared_password,
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
        <DropdownSelect required label="Год поступления" options={ADMISSION_YEARS} value={form.academic_year || ''} onChange={value => update('academic_year', value)} />
      </Section>

      <Section title="Личные данные">
        <Field required maxLength={255} label="Полное ФИО" value={form.full_name} onChangeText={value => update('full_name', value)} />
        <DateField required label="Дата рождения" value={form.birth_date || ''} onChange={value => update('birth_date', value)} maximumDate={new Date()} />
        {!isSchoolStudent ? (
          <View style={styles.selectBlock}>
            <RequiredLabel label="Пол" />
            <ChoiceGroup value={form.gender || ''} options={[{ label: 'Мужской', value: 'male' }, { label: 'Женский', value: 'female' }]} onChange={value => update('gender', value)} />
          </View>
        ) : null}
        {!isSchoolStudent ? (
          <Pressable style={styles.pendingRow} onPress={() => update('is_conscript', !form.is_conscript)}>
            <View style={[styles.checkbox, form.is_conscript && styles.checkboxActive]}>
              {form.is_conscript ? <SvgIcon name="check" size={15} color={colors.white} /> : null}
            </View>
            <Text style={styles.pendingText}>Призывник</Text>
          </Pressable>
        ) : null}
        <DropdownSelect required label="Гражданство" options={CITIZENSHIPS} value={form.citizenship || ''} onChange={value => update('citizenship', value)} allowCustom />
        {!isSchoolStudent ? <DropdownSelect required label="Семейное положение" options={MARITAL_STATUSES} value={form.marital_status || ''} onChange={value => update('marital_status', value)} /> : null}
      </Section>

      <Section title="Адрес проживания">
        <DropdownSelect required label="Страна" options={COUNTRIES} value={form.residence_country || ''} onChange={value => update('residence_country', value)} allowCustom />
        {form.residence_country === 'Туркменистан' ? (
          <DropdownSelect required label="Область" options={TURKMENISTAN_REGIONS} value={form.residence_region || ''} onChange={value => update('residence_region', value)} />
        ) : (
          <Field required maxLength={160} label="Область / регион" value={form.residence_region} onChangeText={value => update('residence_region', value)} />
        )}
        <Field required maxLength={160} label="Город / населенный пункт" value={form.residence_city} onChangeText={value => update('residence_city', value)} />
        <Field maxLength={180} label="Улица (необязательно)" value={form.residence_street} onChangeText={value => update('residence_street', value)} />
        <Field maxLength={80} label="Дом / квартира (необязательно)" value={form.residence_house} onChangeText={value => update('residence_house', value)} />
        <Field maxLength={40} label="Почтовый индекс (необязательно)" value={form.residence_postal_code} onChangeText={value => update('residence_postal_code', value)} />
      </Section>

      {!isSchoolStudent ? <Section title="Паспортные данные">
        <Text style={styles.typeHint}>Укажите данные загранпаспорта. Все поля обязательны, если паспорт уже получен.</Text>
        <Pressable style={styles.pendingRow} onPress={() => update('passport_pending', !form.passport_pending)}>
          <View style={[styles.checkbox, form.passport_pending && styles.checkboxActive]}>
            {form.passport_pending ? <SvgIcon name="check" size={15} color={colors.white} /> : null}
          </View>
          <Text style={styles.pendingText}>Загранпаспорта пока нет или он в процессе оформления</Text>
        </Pressable>
        {!form.passport_pending ? <>
          <Field required maxLength={120} label="Серия и номер загранпаспорта" value={form.passport_number} onChangeText={value => update('passport_number', value)} />
          <Field required maxLength={255} label="Кем выдан загранпаспорт" value={form.passport_issued_by} onChangeText={value => update('passport_issued_by', value)} />
          <DateField required label="Дата выдачи" value={form.passport_issue_date || ''} onChange={value => update('passport_issue_date', value)} maximumDate={new Date()} />
          <DateField required label="Действителен до" value={form.passport_expiry_date || ''} onChange={value => update('passport_expiry_date', value)} minimumDate={new Date()} />
        </> : null}
      </Section> : null}

      <Section title="Контакты абитуриента">
        <Field required maxLength={80} label="Основной номер телефона" value={form.phone} keyboardType="phone-pad" onChangeText={value => update('phone', value)} />
        <Field required={!isSchoolStudent} maxLength={254} label="Email" value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={value => update('email', value)} />
        <Field maxLength={80} label="Дополнительный телефон" value={form.extra_phone} onChangeText={value => update('extra_phone', value)} />
        <Field maxLength={120} label="Imo" value={form.imo} onChangeText={value => update('imo', value)} />
        <Field maxLength={120} label="Telegram" value={form.telegram} onChangeText={value => update('telegram', value)} />
        <SelectChips required={!isSchoolStudent} label="Предпочтительный способ связи" options={CONTACT_METHODS} value={form.preferred_contact_method || ''} onChange={value => update('preferred_contact_method', value)} />
      </Section>

      <Section title="Родители / законные представители">
        <Field required maxLength={255} label="ФИО родителя" value={form.parent_full_name} onChangeText={value => update('parent_full_name', value)} />
        <DropdownSelect label="Кем является" options={PARENT_RELATIONS} value={form.parent_relation || ''} onChange={value => update('parent_relation', value)} allowCustom />
        <Field required maxLength={180} label="Контакты родителя" value={form.parent_contacts} onChangeText={value => update('parent_contacts', value)} />
        <Field maxLength={255} label="Кем и где работает" value={form.parent_workplace} onChangeText={value => update('parent_workplace', value)} />
      </Section>

      <Section title="Образование">
        <SelectChips required label="Текущий статус образования" options={CURRENT_EDUCATION_STATUS_OPTIONS} value={form.education_status || (isSchoolStudent ? 'школьник' : '')} onChange={value => update('education_status', value)} />
        <SelectChips required={!isSchoolStudent} label="Уровень образования" options={EDUCATION_LEVELS} value={form.education_level || ''} onChange={value => update('education_level', value)} />
        {isSchoolStudent || form.education_status === 'школьник' || form.education_level === 'Учусь в школе' ? <SelectChips required label="Класс" options={SCHOOL_CLASSES} value={form.school_class || ''} onChange={value => update('school_class', value)} /> : null}
        <Field required maxLength={255} label="Учебное заведение" value={form.school_name} onChangeText={value => update('school_name', value)} />
        <DropdownSelect required label="Страна учебного заведения" options={COUNTRIES} value={form.school_country || ''} onChange={value => update('school_country', value)} allowCustom />
        <Field required={!isSchoolStudent} maxLength={120} label="Город учебного заведения" value={form.school_city} onChangeText={value => update('school_city', value)} />
        <DropdownSelect required label="Год окончания" options={GRADUATION_YEARS} value={form.graduation_year || ''} onChange={value => update('graduation_year', value)} />
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
        <View style={styles.selectBlock}>
          <RequiredLabel label="Услуга / тип поступления" />
          <ChoiceGroup
            value={form.funding_type || ''}
            options={FUNDING_OPTIONS}
            onChange={value => update('funding_type', value)}
          />
        </View>
        <SearchableProgramSuggestions
          value={form.desired_program || ''}
          onChange={value => update('desired_program', value)}
        />
        <Field
          required
          maxLength={255}
          label="Желаемые направления (можно дополнить вручную)"
          placeholder="Например: лечебное дело и стоматология"
          value={form.desired_program}
          onChangeText={value => update('desired_program', value)}
        />
        <Field
          required
          maxLength={255}
          label="Желаемые вузы"
          placeholder="Например: РУДН / Сеченова / БГМУ"
          value={form.desired_universities}
          onChangeText={value => update('desired_universities', value)}
        />
        <Field required maxLength={1000} label="Цель поступления" multiline value={form.admission_goal} onChangeText={value => update('admission_goal', value)} />
        <Field required={!isSchoolStudent} maxLength={120} label="Желаемый город" value={form.desired_city} onChangeText={value => update('desired_city', value)} />
        <Field required maxLength={120} label="Желаемая страна" value={form.desired_country} onChangeText={value => update('desired_country', value)} />
        <Field required={!isSchoolStudent} maxLength={120} label="Желаемый язык обучения" value={form.desired_language} onChangeText={value => update('desired_language', value)} />
        <SelectChips required={!isSchoolStudent} label="Желаемый уровень обучения" options={DESIRED_LEVELS} value={form.desired_education_level || ''} onChange={value => update('desired_education_level', value)} />
        <SelectChips required={!isSchoolStudent} label="Срочность поступления" options={URGENCY_OPTIONS} value={form.admission_urgency || ''} onChange={value => update('admission_urgency', value)} />
        <Text style={styles.subLabel}>Нужна помощь с</Text>
        <Checklist options={HELP_OPTIONS} selected={form.help_needed || []} onToggle={value => toggleListValue('help_needed', value)} />
      </Section>

      {!isSchoolStudent ? <Section title="Виза">
        <SelectChips label="Виза имеется?" options={['да', 'нет']} value={form.has_visa || ''} onChange={value => update('has_visa', value)} />
        {form.has_visa === 'да' ? (
          <>
            <Field maxLength={120} label="Страна оформления визы" value={form.visa_country} onChangeText={value => update('visa_country', value)} />
            <Field maxLength={120} label="Город оформления визы" value={form.visa_city} onChangeText={value => update('visa_city', value)} />
            <DateField label="Срок действия визы" value={form.visa_valid_until || ''} onChange={value => update('visa_valid_until', value)} />
          </>
        ) : null}
      </Section> : null}

      <Section title="Дополнительная информация">
        <Field maxLength={1000} label="Любимые хобби" multiline value={form.hobbies} onChangeText={value => update('hobbies', value)} />
        <Field maxLength={1000} label="Комментарий абитуриента" multiline value={form.applicant_comment} onChangeText={value => update('applicant_comment', value)} />
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
          <View style={styles.offlineHeader}>
            <View style={styles.offlineIcon}><SvgIcon name="document" size={18} color={colors.secondary} /></View>
            <Text style={styles.offlineTitle}>Оффлайн-режим</Text>
          </View>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AppCard style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </AppCard>
  );
}

function Field(props: React.ComponentProps<typeof AppInput>) {
  const currentLength = typeof props.value === 'string' ? props.value.length : 0;
  const helper = props.helper || (props.multiline && props.maxLength ? `${currentLength}/${props.maxLength}` : undefined);
  return <AppInput {...props} helper={helper} style={[props.multiline && styles.multilineInput, props.style]} />;
}

function RequiredLabel({ label, required = true }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.subLabel}>
      {label}{required ? <Text style={styles.requiredMark}> *</Text> : null}
    </Text>
  );
}

function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();
  return (
    <View style={styles.selectBlock}>
      <RequiredLabel label={label} required={required} />
      <Pressable style={styles.dropdownButton} onPress={() => setOpen(true)}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>{value || 'Выберите дату'}</Text>
        <SvgIcon name="calendar" size={18} color={colors.secondary} />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={parsed}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(_, date) => {
            if (Platform.OS !== 'ios') setOpen(false);
            if (!date) return;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
          }}
        />
      ) : null}
      {open && Platform.OS === 'ios' ? <AppButton title="Готово" variant="ghost" onPress={() => setOpen(false)} /> : null}
    </View>
  );
}

function DropdownSelect({
  label,
  options,
  value,
  onChange,
  allowCustom = false,
  required = false,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  allowCustom?: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const custom = allowCustom && Boolean(value) && (value === 'Другое' || !options.includes(value));
  return (
    <View style={styles.selectBlock}>
      <RequiredLabel label={label} required={required} />
      <Pressable style={styles.dropdownButton} onPress={() => setOpen(current => !current)}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>{value || 'Выберите значение'}</Text>
        <SvgIcon name="chevronRight" size={18} color={colors.secondary} />
      </Pressable>
      {open ? (
        <View style={styles.dropdownOptions}>
          {options.map(option => (
            <Pressable
              key={option}
              style={[styles.dropdownOption, value === option && styles.dropdownOptionActive]}
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <Text style={styles.dropdownOptionText}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {custom ? (
        <Field
          label="Введите свой вариант"
          value={value === 'Другое' ? '' : value}
          onChangeText={onChange}
          autoFocus={value === 'Другое'}
        />
      ) : null}
    </View>
  );
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

function SelectChips({ label, options, value, onChange, required = false }: { label: string; options: string[]; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <View style={styles.selectBlock}>
      <RequiredLabel label={label} required={required} />
      <ChoiceGroup value={value} options={options.map(item => ({ label: item, value: item }))} onChange={onChange} />
    </View>
  );
}

function SearchableProgramSuggestions({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [search, setSearch] = useState('');
  const programsQuery = useQuery({
    queryKey: ['questionnaire-program-search', search],
    queryFn: () => educationCatalogApi.getProgramsPage({ search: search.trim(), limit: 8 }),
    enabled: search.trim().length >= 2,
  });

  const addProgram = (title: string) => {
    const selected = value.split(/\s*\/\s*/).map(item => item.trim()).filter(Boolean);
    if (!selected.some(item => item.toLocaleLowerCase() === title.toLocaleLowerCase())) {
      onChange([...selected, title].join(' / ').slice(0, 255));
    }
    setSearch('');
  };

  return (
    <View style={styles.selectBlock}>
      <RequiredLabel label="Найти программу в каталоге" required={false} />
      <AppInput
        value={search}
        onChangeText={setSearch}
        maxLength={255}
        placeholder="Начните вводить, например: лечебное дело"
      />
      {search.trim().length >= 2 ? (
        <View style={styles.dropdownOptions}>
          {[...(programsQuery.data?.results || [])]
            .sort((left, right) => Number(Boolean(right.priority_offer)) - Number(Boolean(left.priority_offer)))
            .map(program => (
            <Pressable key={program.id} style={styles.dropdownOption} onPress={() => addProgram(program.title)}>
              <View style={styles.programSuggestionHeader}>
                <Text style={styles.dropdownOptionText}>{program.title}</Text>
                {program.priority_offer ? <Text style={styles.priorityLabel}>ПРИОРИТЕТ</Text> : null}
              </View>
              {program.university_name ? <Text style={styles.programUniversity}>{program.university_name}</Text> : null}
              {program.priority_offer ? (
                <Text style={styles.priorityPrice}>Приоритет программы «Бюджет»</Text>
              ) : null}
            </Pressable>
          ))}
          {!programsQuery.isLoading && !(programsQuery.data?.results || []).length ? (
            <Text style={styles.searchEmpty}>Совпадений нет — укажите направление вручную ниже.</Text>
          ) : null}
        </View>
      ) : null}
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
  credentialsBox: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, padding: spacing.md, marginTop: spacing.md, gap: spacing.xs },
  credentialText: { color: colors.text, fontWeight: typography.weights.heavy },
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
  dropdownButton: { minHeight: 54, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  dropdownText: { flex: 1, color: colors.text, fontSize: typography.body, fontWeight: typography.weights.medium },
  dropdownPlaceholder: { color: colors.mutedLight },
  dropdownOptions: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.xs, backgroundColor: colors.card },
  dropdownOption: { minHeight: 44, paddingHorizontal: spacing.md, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownOptionActive: { backgroundColor: colors.surface },
  dropdownOptionText: { color: colors.text, fontWeight: typography.weights.bold },
  programUniversity: { color: colors.muted, fontSize: typography.small, marginTop: 3 },
  programSuggestionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  priorityLabel: { color: colors.primary, fontSize: 10, fontWeight: typography.weights.heavy, letterSpacing: 0.5 },
  priorityPrice: { color: colors.secondary, fontSize: typography.small, fontWeight: typography.weights.bold, marginTop: 3 },
  searchEmpty: { color: colors.muted, padding: spacing.md, lineHeight: 20 },
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
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  offlineTitle: { color: colors.text, fontSize: typography.body, fontWeight: typography.weights.heavy },
  offlineHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  offlineIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  offlineText: { color: colors.text, lineHeight: 21, fontWeight: typography.weights.medium },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pendingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pendingText: { flex: 1, color: colors.text, lineHeight: 21, fontWeight: typography.weights.bold },
  consentText: { flex: 1, color: colors.text, lineHeight: 22, fontWeight: typography.weights.bold },
  requiredMark: { color: colors.danger },
  actions: { gap: spacing.sm },
});
