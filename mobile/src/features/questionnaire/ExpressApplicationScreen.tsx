import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educationCatalogApi } from '../../api/educationCatalog';
import { bannerImages } from '../../assets/banners';
import { UNIVERSITIES_CACHE_KEY } from '../../hooks/useCatalogWarmup';
import type { University } from '../../types/api';

import {
  buildExpressOnboardingPayload,
  onboardingApi,
  onboardingSubmissionStorage,
  StoredOnboardingSubmission,
} from '../../api/onboarding';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { Badge } from '../../components/Badge';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';
import { getDevicePushToken } from '../../hooks/usePushNotifications';
import { useAuthStore } from '../../store/authStore';
import { OnboardingSubmissionStatus } from '../../types/api';
import { getApiErrorMessage } from '../../utils/apiError';
import { clearOfflineQuestionnaireDraft } from '../../utils/offlineStorage';

const SERVICES = [
  'Подбор вузов и программ',
  'Поступление под ключ',
  'Подача документов',
  'Перевод документов',
  'Консультация',
  'Общежитие и встреча',
];
const STEPS = ['Вуз и программа', 'Поддержка', 'Документы и связь', 'Проверка'];
const LEVELS = ['Подготовительный курс', 'Бакалавриат', 'Специалитет', 'Магистратура', 'Другое'];
const FUNDING = ['Бюджет', 'Контракт', 'Ещё не решил'];
const LANGUAGES = ['Русский', 'Английский', 'Другой', 'Ещё не решил'];
const PASSPORTS = ['Готов', 'Оформляется', 'Пока нет'];

export function ExpressApplicationScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const route = useRoute<any>();
  const login = useAuthStore(state => state.login);
  const activateOnboarding = useAuthStore(state => state.activateOnboarding);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const kind = route.params?.kind === 'school_student' ? 'school_student' : 'applicant';
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [requestText, setRequestText] = useState('');
  const [step, setStep] = useState(0);
  const [universitySearch, setUniversitySearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');
  const [showUniversities, setShowUniversities] = useState(false);
  const [showPrograms, setShowPrograms] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<{ id: number; name: string } | null>(null);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [needHelpChoosing, setNeedHelpChoosing] = useState(kind === 'school_student');
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear() + 1));
  const [educationLevel, setEducationLevel] = useState(kind === 'school_student' ? 'Школа' : '');
  const [fundingType, setFundingType] = useState('');
  const [desiredLanguage, setDesiredLanguage] = useState('');
  const [city, setCity] = useState('');
  const [preferredContact, setPreferredContact] = useState('');
  const [passportStatus, setPassportStatus] = useState('');
  const [consent, setConsent] = useState(false);
  const [debouncedUniversity, setDebouncedUniversity] = useState('');
  const [debouncedProgram, setDebouncedProgram] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [stored, setStored] = useState<StoredOnboardingSubmission | null>(null);
  const [submission, setSubmission] = useState<OnboardingSubmissionStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUniversity(universitySearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [universitySearch]);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProgram(programSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [programSearch]);
  const universitiesQuery = useQuery({
    queryKey: ['express-universities', debouncedUniversity],
    queryFn: () => {
      const cached = queryClient.getQueryData<University[]>(UNIVERSITIES_CACHE_KEY);
      if (cached?.length) {
        const search = debouncedUniversity.toLocaleLowerCase('ru-RU');
        return Promise.resolve(cached.filter(item => !search || `${item.name} ${item.abbreviation || ''}`.toLocaleLowerCase('ru-RU').includes(search)).slice(0, 8));
      }
      return educationCatalogApi.getUniversities({ search: debouncedUniversity, limit: 8 });
    },
    enabled: step === 0 && !needHelpChoosing && showUniversities,
    staleTime: 30 * 60_000,
  });
  const programsQuery = useQuery({
    queryKey: ['express-programs', selectedUniversity?.id, debouncedProgram],
    queryFn: () => educationCatalogApi.getPrograms({ university: selectedUniversity?.id, search: debouncedProgram, limit: 12 }),
    enabled: step === 0 && !!selectedUniversity?.id && !needHelpChoosing && showPrograms,
    staleTime: 30 * 60_000,
  });

  const refreshStatus = async (current: StoredOnboardingSubmission) => {
    try {
      const status = await onboardingApi.getStatus(current);
      setSubmission(status);
      return status;
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        await onboardingSubmissionStorage.clear();
        setStored(null);
        setSubmission(null);
        return null;
      }
      throw error;
    }
  };

  useEffect(() => {
    onboardingSubmissionStorage.get().then(current => {
      if (!current || current.kind !== kind) return;
      setStored(current);
      refreshStatus(current).catch(() => undefined);
    });
  }, [kind]);

  useFocusEffect(useCallback(() => {
    if (!stored) return;
    let active = true;
    const update = () => {
      onboardingApi.getStatus(stored).then(status => {
        if (active) setSubmission(status);
      }).catch(() => undefined);
    };
    update();
    const appState = AppState.addEventListener('change', state => { if (state === 'active') update(); });
    const received = Notifications.addNotificationReceivedListener(update);
    const opened = Notifications.addNotificationResponseReceivedListener(update);
    return () => { active = false; appState.remove(); received.remove(); opened.remove(); };
  }, [stored]));

  const submitMutation = useMutation({
    mutationFn: async () => {
      const fcmToken = await getDevicePushToken(true).catch(() => '');
      return onboardingApi.submit(buildExpressOnboardingPayload({
        kind,
        academicYear: Number(academicYear),
        fullName,
        phone,
        email,
        requestedServices: services,
        requestText,
        university: needHelpChoosing ? '' : selectedUniversity?.name,
        program: needHelpChoosing ? '' : selectedProgram,
        educationLevel,
        desiredLanguage,
        fundingType,
        city,
        preferredContact,
        passportStatus,
        fcmToken,
      }));
    },
    onSuccess: async data => {
      const current = await onboardingSubmissionStorage.get();
      setStored(current);
      setSubmission(data);
      Alert.alert('Спасибо за вашу заявку!', 'Мы получили её и скоро свяжемся с вами.');
    },
    onError: error => Alert.alert('Не удалось отправить заявку', getApiErrorMessage(error)),
  });

  const handleSubmit = () => {
    if (!consent) {
      Alert.alert('Нужно согласие', 'Откройте условия обработки данных и подтвердите согласие.');
      return;
    }
    if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email.trim())) {
      Alert.alert('Укажите Email', 'Введите действующий адрес, например name@gmail.com.');
      return;
    }
    if (!fullName.trim() || !phone.trim() || !services.length || !requestText.trim()) {
      Alert.alert('Заполните обязательные поля', 'Нужны ФИО, контакт, хотя бы одна услуга и краткое описание запроса.');
      return;
    }
    submitMutation.mutate();
  };

  const nextStep = () => {
    if (step === 0) {
      const year = Number(academicYear);
      if (!educationLevel || !Number.isInteger(year) || year < new Date().getFullYear() || year > new Date().getFullYear() + 10 || (!needHelpChoosing && (!selectedUniversity || !selectedProgram))) {
        Alert.alert('Выберите направление', 'Укажите уровень, год, вуз и программу либо выберите помощь с подбором.');
        return;
      }
    }
    if (step === 1 && !services.length) {
      Alert.alert('Выберите поддержку', 'Отметьте хотя бы одну нужную услугу.');
      return;
    }
    if (step === 2 && (!fullName.trim() || !phone.trim() || !email.trim() || !requestText.trim())) {
      Alert.alert('Заполните контакты', 'Нужны ФИО, телефон, Email и описание вашего запроса.');
      return;
    }
    if (step === 2 && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email.trim())) {
      Alert.alert('Проверьте Email', 'Например: name@gmail.com.');
      return;
    }
    setStep(value => Math.min(3, value + 1));
  };

  const handleRefresh = async () => {
    if (!stored) return;
    setRefreshing(true);
    try {
      await refreshStatus(stored);
    } catch (error) {
      Alert.alert('Не удалось обновить статус', getApiErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };

  const handleInstantLogin = async () => {
    const credentials = submission?.service_credentials;
    if (!stored || (!credentials && !submission?.sl_id)) return;
    setEntering(true);
    try {
      try {
        await activateOnboarding(stored);
      } catch (activationError) {
        if (!credentials?.shared_password) throw activationError;
        await login(credentials.mobile_login, credentials.shared_password);
      }
      await clearOfflineQuestionnaireDraft();
      navigation.navigate('ApplicantQuestionnaire', { formType: 'applicant' });
    } catch (error) {
      Alert.alert('Не удалось войти', getApiErrorMessage(error));
    } finally {
      setEntering(false);
    }
  };

  const hasCurrentExpress = submission?.stage === 'express';

  return (
    <Screen scroll style={styles.screen}>
      <ImageBackground source={bannerImages.admission} imageStyle={styles.heroImage} style={styles.hero}>
        <View style={styles.heroTint}>
          <Text style={styles.heroEyebrow}>STUDENTS LIFE · ПОСТУПЛЕНИЕ</Text>
          <Text style={styles.heroTitle}>{kind === 'school_student' ? 'Заявка школьника' : 'Ваш путь в университет'}</Text>
          <Text style={styles.heroSubtitle}>Расскажите о планах за 4 коротких шага. Менеджер поможет с дальнейшим оформлением.</Text>
        </View>
      </ImageBackground>

      {hasCurrentExpress ? (
        <AppCard style={styles.statusCard}>
          <Text style={styles.statusTitle}>{statusLabel(submission.status, kind)}</Text>
          {submission.review_comment ? <Text style={styles.description}>Комментарий: {submission.review_comment}</Text> : null}
          {(submission.service_credentials || submission.sl_id) && stored && !isAuthenticated ? (
            <>
              <View style={styles.credentials}>
                <Text style={styles.credentialLine}>Аккаунт одобрен</Text>
                <Text style={styles.credentialHint}>Подтвердите вход на этом устройстве. Пароль в приложении не показывается.</Text>
              </View>
              <AppButton title="Подтвердить и войти" onPress={handleInstantLogin} loading={entering} />
            </>
          ) : null}
          {submission.can_fill_full_questionnaire && (isAuthenticated || !submission.service_credentials) ? (
            <AppButton
              title={isAuthenticated ? 'Открыть полную анкету' : 'Заполнить полную анкету'}
              onPress={() => navigation.navigate('ApplicantQuestionnaire', { formType: 'applicant' })}
            />
          ) : null}
          <AppButton title="Обновить статус" variant="outline" onPress={handleRefresh} loading={refreshing} />
        </AppCard>
      ) : (
        <>
          <View style={styles.stepper}>{STEPS.map((label, index) => <Pressable key={label} style={styles.stepItem} onPress={() => { if (index < step) setStep(index); }} accessibilityRole="button" accessibilityLabel={`Шаг ${index + 1}: ${label}`}>
            <View style={[styles.stepCircle, index <= step && styles.stepCircleActive]}><Text style={[styles.stepNumber, index <= step && styles.stepNumberActive]}>{index < step ? '✓' : index + 1}</Text></View>
            <Text style={[styles.stepLabel, index === step && styles.stepLabelActive]} numberOfLines={2}>{label}</Text>
          </Pressable>)}</View>
          <AppCard style={styles.form}>
            <Text style={styles.sectionEyebrow}>ШАГ {step + 1} ИЗ 4</Text>
            <Text style={styles.sectionTitle}>{STEPS[step]}</Text>
            {step === 0 ? <>
              <Text style={styles.label}>Уровень обучения *</Text>
              <View style={styles.chipRow}>{(kind === 'school_student' ? ['Школа', 'Подготовительный курс'] : LEVELS).map(value => <ChoiceChip key={value} title={value} active={educationLevel === value} onPress={() => setEducationLevel(value)} />)}</View>
              <AppInput label="Год поступления *" value={academicYear} onChangeText={setAcademicYear} keyboardType="number-pad" maxLength={4} placeholder="2027" />
              <Pressable style={styles.helpChoice} onPress={() => { setNeedHelpChoosing(!needHelpChoosing); setSelectedUniversity(null); setSelectedProgram(''); }} accessibilityRole="checkbox" accessibilityState={{ checked: needHelpChoosing }}><SvgIcon name={needHelpChoosing ? 'check' : 'search'} size={18} color={colors.primary} /><Text style={styles.helpText}>Помогите мне подобрать вуз и программу</Text></Pressable>
              {!needHelpChoosing ? <>
                <AppInput label="Университет *" value={universitySearch} onFocus={() => setShowUniversities(true)} onChangeText={value => { setUniversitySearch(value); setSelectedUniversity(null); setSelectedProgram(''); setShowUniversities(true); }} placeholder="Начните вводить название вуза" autoCorrect={false} />
                {selectedUniversity ? <Text style={styles.selected}>Выбран: {selectedUniversity.name}</Text> : showUniversities ? <View style={styles.resultList}>
                  {universitiesQuery.isLoading ? <Text style={styles.muted}>Ищем университеты…</Text> : null}
                  {universitiesQuery.isError ? <Text style={styles.muted}>Каталог сейчас недоступен. Выберите помощь с подбором или повторите позже.</Text> : null}
                  {(universitiesQuery.data || []).slice(0, 8).map(university => <Pressable key={university.id} style={styles.result} onPress={() => { setSelectedUniversity({ id: university.id, name: university.name }); setUniversitySearch(university.name); setShowUniversities(false); setProgramSearch(''); setShowPrograms(false); }}><Text style={styles.resultText}>{university.name}</Text><SvgIcon name="chevronRight" size={17} color={colors.muted} /></Pressable>)}
                </View> : null}
                {selectedUniversity ? <>
                  <AppInput label="Программа *" value={programSearch} onFocus={() => setShowPrograms(true)} onChangeText={value => { setProgramSearch(value); setSelectedProgram(''); setShowPrograms(true); }} placeholder="Поиск направления" autoCorrect={false} />
                  {selectedProgram ? <Text style={styles.selected}>Выбрана: {selectedProgram}</Text> : showPrograms ? <View style={styles.resultList}>
                    {programsQuery.isLoading ? <Text style={styles.muted}>Ищем программы…</Text> : null}
                    {(programsQuery.data || []).slice(0, 10).map(program => <Pressable key={program.id} style={styles.result} onPress={() => { setSelectedProgram(program.title); setProgramSearch(program.title); setShowPrograms(false); }}><Text style={styles.resultText}>{program.title}</Text><SvgIcon name="chevronRight" size={17} color={colors.muted} /></Pressable>)}
                    {programsQuery.isError ? <Text style={styles.muted}>Программы пока недоступны. Можете выбрать помощь с подбором.</Text> : null}
                  </View> : null}
                </> : null}
              </> : <Text style={styles.muted}>Менеджер предложит подходящие вузы и направления после вашего обращения.</Text>}
            </> : null}
            {step === 1 ? <>
              <Text style={styles.label}>Как планируете поступать?</Text>
              <View style={styles.chipRow}>{FUNDING.map(value => <ChoiceChip key={value} title={value} active={fundingType === value} onPress={() => setFundingType(value)} />)}</View>
              <Text style={styles.label}>Желаемый язык обучения</Text>
              <View style={styles.chipRow}>{LANGUAGES.map(value => <ChoiceChip key={value} title={value} active={desiredLanguage === value} onPress={() => setDesiredLanguage(value)} />)}</View>
              <Text style={styles.label}>С чем нужна помощь? *</Text>
              <View style={styles.choices}>{SERVICES.map(service => <Pressable key={service} style={[styles.choice, services.includes(service) && styles.choiceActive]} onPress={() => setServices(services.includes(service) ? services.filter(item => item !== service) : [...services, service])} accessibilityRole="checkbox" accessibilityState={{ checked: services.includes(service) }}><View style={[styles.checkbox, services.includes(service) && styles.checkboxActive]}>{services.includes(service) ? <SvgIcon name="check" size={12} color={colors.white} /> : null}</View><Text style={styles.choiceText}>{service}</Text></Pressable>)}</View>
            </> : null}
            {step === 2 ? <>
              <Text style={styles.muted}>Документы можно загрузить в личном кабинете после его открытия. Для заявки пока нужны ваши контакты.</Text>
              <Text style={styles.label}>Загранпаспорт</Text><View style={styles.chipRow}>{PASSPORTS.map(value => <ChoiceChip key={value} title={value} active={passportStatus === value} onPress={() => setPassportStatus(value)} />)}</View>
              <AppButton title="Какие документы понадобятся" variant="outline" onPress={() => navigation.navigate('RequiredDocuments')} style={styles.docsButton} />
              <AppInput label="ФИО *" value={fullName} onChangeText={setFullName} placeholder="Как в паспорте" maxLength={255} />
              <AppInput label="Город проживания" value={city} onChangeText={setCity} maxLength={255} />
              <AppInput label="Телефон или мессенджер *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+993 ..." maxLength={40} />
              <AppInput label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={254} />
              <Text style={styles.label}>Удобный способ связи</Text><View style={styles.chipRow}>{['Звонок', 'Telegram', 'Imo', 'Email'].map(value => <ChoiceChip key={value} title={value} active={preferredContact === value} onPress={() => setPreferredContact(value)} />)}</View>
              <AppInput label="Ваш вопрос или цель *" value={requestText} onChangeText={setRequestText} multiline style={styles.multiline} maxLength={1000} placeholder="Например: хочу поступить на лечебное дело и подготовить документы" />
            </> : null}
            {step === 3 ? <>
              <View style={styles.review}><ReviewLine label="Направление" value={`${educationLevel}, ${academicYear}`} /><ReviewLine label="Вуз" value={needHelpChoosing ? 'Помощь с подбором' : selectedUniversity?.name || ''} /><ReviewLine label="Программа" value={needHelpChoosing ? 'Помощь с подбором' : selectedProgram} /><ReviewLine label="Поступление и язык" value={[fundingType, desiredLanguage].filter(Boolean).join(' · ') || 'Уточнит менеджер'} /><ReviewLine label="Поддержка" value={services.join(', ')} /><ReviewLine label="Документы" value={passportStatus ? `Загранпаспорт: ${passportStatus}` : 'Уточнить позже'} /><ReviewLine label="Контакт" value={`${fullName} · ${phone} · ${email}`} /><ReviewLine label="Цель" value={requestText} /></View>
              <Pressable style={styles.helpChoice} onPress={() => setConsent(!consent)} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}><SvgIcon name={consent ? 'check' : 'document'} size={19} color={colors.primary} /><Text style={styles.helpText}>Согласен с обработкой персональных данных</Text></Pressable>
              <AppButton title="Прочитать условия" variant="ghost" onPress={() => navigation.navigate('DataConsent')} />
            </> : null}
            <View style={styles.footerActions}>{step > 0 ? <AppButton title="Назад" variant="outline" onPress={() => setStep(step - 1)} style={styles.backButton} /> : null}<AppButton title={step === 3 ? 'Отправить заявку' : 'Продолжить'} onPress={step === 3 ? handleSubmit : nextStep} loading={submitMutation.isPending} style={styles.continueButton} /></View>
          </AppCard>
        </>
      )}
    </Screen>
  );
}

function ChoiceChip({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: active }} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{title}</Text></Pressable>;
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return <View style={styles.reviewLine}><Text style={styles.reviewLabel}>{label}</Text><Text style={styles.reviewValue}>{value}</Text></View>;
}

function statusLabel(status: OnboardingSubmissionStatus['status'], kind: 'applicant' | 'school_student') {
  if (status === 'processed') return 'Заявка обработана. Менеджер свяжется с вами';
  if (status === 'approved') return kind === 'applicant' ? 'Аккаунт открыт' : 'Заявка одобрена';
  if (status === 'changes_requested') return 'Менеджер просит уточнить данные';
  if (status === 'rejected') return 'Заявка отклонена';
  if (status === 'in_review') return 'Менеджер проверяет заявку';
  return 'Заявка ожидает проверки';
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { borderRadius: 22, overflow: 'hidden', minHeight: 168, marginBottom: 22 },
  heroImage: { borderRadius: 22 },
  heroTint: { flex: 1, backgroundColor: 'rgba(11, 34, 57, 0.76)', padding: 22, justifyContent: 'center' },
  heroEyebrow: { color: '#FFD9D5', fontSize: 11, letterSpacing: 1.5, fontWeight: '800', marginBottom: 10 },
  heroTitle: { color: colors.white, fontSize: 27, fontWeight: '800', lineHeight: 32 },
  heroSubtitle: { color: '#F5F6F8', lineHeight: 21, marginTop: 8, maxWidth: 330 },
  stepper: { flexDirection: 'row', marginBottom: 19, gap: 2 },
  stepItem: { flex: 1, alignItems: 'center', minWidth: 0 },
  stepCircle: { height: 32, width: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  stepCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNumber: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  stepNumberActive: { color: colors.white },
  stepLabel: { color: colors.muted, fontSize: 10, textAlign: 'center', lineHeight: 14, marginTop: 7 },
  stepLabelActive: { color: colors.primaryDark, fontWeight: '800' },
  sectionEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 7, marginBottom: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 19 },
  chip: { paddingVertical: 10, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 11, backgroundColor: colors.white },
  chipActive: { borderColor: colors.primary, backgroundColor: '#FFF0EF' },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.primaryDark, fontWeight: '800' },
  helpChoice: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
  helpText: { flex: 1, color: colors.text, fontWeight: '600', lineHeight: 20 },
  muted: { color: colors.muted, lineHeight: 21, marginBottom: 14 },
  resultList: { marginTop: -9, marginBottom: 15 },
  result: { minHeight: 49, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  resultText: { color: colors.text, flex: 1, lineHeight: 20 },
  selected: { color: colors.primaryDark, fontSize: 13, fontWeight: '700', marginTop: -7, marginBottom: 18 },
  docsButton: { marginBottom: 18 },
  review: { borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 20 },
  reviewLine: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewLabel: { color: colors.muted, fontSize: 12 },
  reviewValue: { color: colors.text, lineHeight: 21, fontWeight: '700', marginTop: 3 },
  footerActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  backButton: { flex: 1 },
  continueButton: { flex: 2 },
  intro: { marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  description: { color: colors.muted, lineHeight: 22, marginTop: spacing.sm },
  form: { marginBottom: spacing.lg },
  label: { color: colors.text, fontSize: typography.small, fontWeight: typography.weights.bold, marginBottom: spacing.xs },
  choices: { gap: spacing.xs, marginBottom: spacing.md },
  choice: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card },
  choiceActive: { borderColor: colors.primary },
  checkbox: { width: 21, height: 21, borderRadius: 6, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { flex: 1, color: colors.text, fontWeight: typography.weights.bold },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  statusCard: { gap: spacing.md, marginBottom: spacing.lg },
  statusTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  credentials: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  credentialLine: { color: colors.text, fontWeight: typography.weights.heavy },
  credentialHint: { color: colors.muted, lineHeight: 20 },
});
