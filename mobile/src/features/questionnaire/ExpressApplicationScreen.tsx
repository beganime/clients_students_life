import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';

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

export function ExpressApplicationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const login = useAuthStore(state => state.login);
  const kind = route.params?.kind === 'school_student' ? 'school_student' : 'applicant';
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [requestText, setRequestText] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [stored, setStored] = useState<StoredOnboardingSubmission | null>(null);
  const [submission, setSubmission] = useState<OnboardingSubmissionStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [entering, setEntering] = useState(false);

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

  const submitMutation = useMutation({
    mutationFn: async () => {
      const fcmToken = await getDevicePushToken(true).catch(() => '');
      return onboardingApi.submit(buildExpressOnboardingPayload({
        kind,
        academicYear: new Date().getFullYear() + 1,
        fullName,
        phone,
        email,
        requestedServices: services,
        requestText,
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
    if (!fullName.trim() || !phone.trim() || !services.length || !requestText.trim()) {
      Alert.alert('Заполните обязательные поля', 'Нужны ФИО, контакт, хотя бы одна услуга и краткое описание запроса.');
      return;
    }
    submitMutation.mutate();
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
    if (!credentials) return;
    setEntering(true);
    try {
      await login(credentials.mobile_login, credentials.shared_password);
      await clearOfflineQuestionnaireDraft();
      navigation.navigate('App');
    } catch (error) {
      Alert.alert('Не удалось войти', getApiErrorMessage(error));
    } finally {
      setEntering(false);
    }
  };

  const hasCurrentExpress = submission?.stage === 'express';

  return (
    <Screen scroll style={styles.screen}>
      <AppCard style={styles.intro}>
        <Badge label={kind === 'school_student' ? 'Для школьника' : 'Поступление'} variant="neutral" icon="application" />
        <Text style={styles.title}>{kind === 'school_student' ? 'Заявка школьника' : 'Экспресс-заявка'}</Text>
        <Text style={styles.description}>
          Оставьте только основные данные. После проверки менеджер откроет следующий шаг.
        </Text>
      </AppCard>

      {hasCurrentExpress ? (
        <AppCard style={styles.statusCard}>
          <Text style={styles.statusTitle}>{statusLabel(submission.status, kind)}</Text>
          {submission.review_comment ? <Text style={styles.description}>Комментарий: {submission.review_comment}</Text> : null}
          {submission.service_credentials ? (
            <>
              <View style={styles.credentials}>
                <Text style={styles.credentialLine}>Логин: {submission.service_credentials.mobile_login}</Text>
                <Text style={styles.credentialLine}>Пароль: {submission.service_credentials.shared_password}</Text>
              </View>
              <AppButton title="Подтвердить и войти" onPress={handleInstantLogin} loading={entering} />
            </>
          ) : null}
          {submission.can_fill_full_questionnaire && !submission.service_credentials ? (
            <AppButton
              title="Заполнить полную анкету"
              onPress={() => navigation.replace('ApplicantQuestionnaire', { formType: 'applicant' })}
            />
          ) : null}
          <AppButton title="Обновить статус" variant="outline" onPress={handleRefresh} loading={refreshing} />
        </AppCard>
      ) : (
        <AppCard style={styles.form}>
          <AppInput label="ФИО *" value={fullName} onChangeText={setFullName} placeholder="Полностью, как в документах" />
          <AppInput label="Телефон или мессенджер *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+993 ..." />
          <AppInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Какие услуги нужны *</Text>
          <View style={styles.choices}>
            {SERVICES.map(service => {
              const active = services.includes(service);
              return (
                <Pressable
                  key={service}
                  style={[styles.choice, active && styles.choiceActive]}
                  onPress={() => setServices(active ? services.filter(item => item !== service) : [...services, service])}
                >
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active ? <SvgIcon name="check" size={12} color={colors.white} /> : null}
                  </View>
                  <Text style={styles.choiceText}>{service}</Text>
                </Pressable>
              );
            })}
          </View>
          <AppInput
            label="Что вы хотите получить *"
            value={requestText}
            onChangeText={setRequestText}
            multiline
            style={styles.multiline}
            placeholder="Например: хочу поступить на лечебное дело в России, нужна помощь с подбором и документами"
          />
          <AppButton title="Отправить заявку" onPress={handleSubmit} loading={submitMutation.isPending} />
        </AppCard>
      )}
    </Screen>
  );
}

function statusLabel(status: OnboardingSubmissionStatus['status'], kind: 'applicant' | 'school_student') {
  if (status === 'approved') return kind === 'applicant' ? 'Аккаунт открыт' : 'Заявка одобрена';
  if (status === 'changes_requested') return 'Менеджер просит уточнить данные';
  if (status === 'rejected') return 'Заявка отклонена';
  if (status === 'in_review') return 'Менеджер проверяет заявку';
  return 'Заявка ожидает проверки';
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
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
});
