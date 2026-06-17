import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { applicationsApi, contentApi } from '../../api/endpoints';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { Badge } from '../../components/Badge';
import { CTASection } from '../../components/CTASection';
import { Loading } from '../../components/Loading';
import { LoginRequired } from '../../components/LoginRequired';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, shadows, spacing, typography } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../utils/apiError';

type SelectedFile = { uri: string; name: string; type: string };
type SubmitStatus = { type: 'success' | 'error' | 'info'; text: string } | null;

function makeIdempotencyKey() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function ApplicationCreateScreen() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <LoginRequired
        title="Чтобы отправить заявку, войдите в аккаунт"
        description="Зарегистрированные пользователи видят историю заявок, ответы менеджера и персональные предложения."
      />
    );
  }

  return <ApplicationCreateForm />;
}

function ApplicationCreateForm() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const user = useAuthStore(state => state.user);

  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: contentApi.getServices });
  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: contentApi.getCountries });
  const universitiesQuery = useQuery({ queryKey: ['universities'], queryFn: () => contentApi.getUniversities() });

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
  const [successNumber, setSuccessNumber] = useState('');

  const isInitialLoading = servicesQuery.isLoading || countriesQuery.isLoading || universitiesQuery.isLoading;

  useEffect(() => {
    if (route.params?.serviceId) setServiceId(route.params.serviceId);
    if (route.params?.universityId) setTargetUniversityId(route.params.universityId);
  }, [route.params?.serviceId, route.params?.universityId]);

  useEffect(() => {
    if (!user) return;
    setFullName(prev => prev || [user.first_name, user.last_name].filter(Boolean).join(' '));
    setEmail(prev => prev || user.email || '');
    setPhone(prev => prev || user.profile?.phone || '');
    setWhatsapp(prev => prev || user.profile?.whatsapp || user.profile?.phone || '');
    setTelegram(prev => prev || user.profile?.telegram || '');
    setCountry(prev => prev || user.profile?.country || '');
    setCitizenship(prev => prev || user.profile?.citizenship || '');
  }, [user]);

  const resetForm = () => {
    setServiceId(null);
    setTargetCountryId(null);
    setTargetUniversityId(null);
    setEducationLevel('');
    setSpecialty('');
    setStudyLanguage('');
    setStartYear('2026');
    setComment('');
    setFiles([]);
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/*'],
    });

    if (result.canceled) return;

    const pickedFiles = result.assets.map(asset => ({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'application/octet-stream',
    }));

    setFiles(prev => [...prev, ...pickedFiles]);
  };

  const handleSubmit = async () => {
    setStatus(null);
    setSuccessNumber('');

    if (!fullName.trim()) {
      setStatus({ type: 'error', text: 'Введите ФИО студента.' });
      return;
    }

    if (!phone && !whatsapp && !telegram && !email) {
      setStatus({ type: 'error', text: 'Укажите хотя бы один способ связи.' });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: 'info', text: 'Отправляем заявку...' });

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

      setSuccessNumber(application.application_number);
      setStatus({ type: 'success', text: `Заявка отправлена. Номер: ${application.application_number}` });
      resetForm();
    } catch (error) {
      setStatus({ type: 'error', text: getApiErrorMessage(error, 'Заявка не отправилась. Попробуйте ещё раз или напишите нам в чат.') });
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) return <Loading />;

  if (successNumber) {
    return (
      <Screen scroll style={styles.screen}>
        <AppCard style={styles.successCard}>
          <View style={styles.successIcon}><SvgIcon name="check" size={34} color={colors.success} /></View>
          <Text style={styles.successTitle}>Заявка отправлена</Text>
          <Text style={styles.successText}>Номер заявки: {successNumber}. Менеджер свяжется с вами и объяснит следующие шаги.</Text>
          <View style={styles.successActions}>
            <AppButton title="Мои заявки" onPress={() => navigation.navigate('MyApplications')} />
            <AppButton title="Открыть чат" variant="outline" onPress={() => navigation.navigate('Chat')} />
            <AppButton title="Создать ещё заявку" variant="ghost" onPress={() => { setSuccessNumber(''); setStatus(null); }} />
          </View>
        </AppCard>
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.screen}>
      <View style={[styles.hero, shadows.premium]}>
        <View style={styles.glowBlue} />
        <View style={styles.glowMint} />
        <Badge label="Заявка ни к чему не обязывает" variant="mint" icon="check" />
        <Text style={styles.title}>Расскажите, куда хотите поступить</Text>
        <Text style={styles.subtitle}>Менеджер свяжется с вами, проверит данные и объяснит следующие шаги.</Text>
      </View>

      <FormSection step="1" title="Услуга и направление" description="Выберите услугу, страну и университет, если уже знаете желаемый вариант.">
        <Text style={styles.label}>Выберите услугу</Text>
        <ChipScroll items={servicesQuery.data || []} activeId={serviceId} getLabel={item => item.title} onPress={item => setServiceId(serviceId === item.id ? null : item.id)} />

        <Text style={styles.label}>Желаемая страна обучения</Text>
        <ChipScroll items={countriesQuery.data || []} activeId={targetCountryId} getLabel={item => item.name} onPress={item => setTargetCountryId(targetCountryId === item.id ? null : item.id)} />

        <Text style={styles.label}>Желаемый университет</Text>
        <ChipScroll items={(universitiesQuery.data || []).slice(0, 20)} activeId={targetUniversityId} getLabel={item => item.name} onPress={item => setTargetUniversityId(targetUniversityId === item.id ? null : item.id)} />
      </FormSection>

      <FormSection step="2" title="Контакты студента" description="Достаточно одного способа связи, но лучше оставить WhatsApp или Telegram.">
        <AppInput label="ФИО" value={fullName} onChangeText={setFullName} placeholder="Ali Myradov" />
        <AppInput label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+993..." />
        <AppInput label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="+993..." />
        <AppInput label="Telegram" value={telegram} onChangeText={setTelegram} placeholder="@username" />
        <AppInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="student@example.com" />
      </FormSection>

      <FormSection step="3" title="Образование и пожелания" description="Эти поля помогают менеджеру подобрать программу точнее.">
        <AppInput label="Гражданство" value={citizenship} onChangeText={setCitizenship} placeholder="Turkmenistan" />
        <AppInput label="Страна проживания" value={country} onChangeText={setCountry} placeholder="Turkmenistan" />
        <AppInput label="Текущий уровень образования" value={educationLevel} onChangeText={setEducationLevel} placeholder="Среднее образование / бакалавр" />
        <AppInput label="Желаемая специальность" value={specialty} onChangeText={setSpecialty} placeholder="Medicine / IT / Business" />
        <AppInput label="Язык обучения" value={studyLanguage} onChangeText={setStudyLanguage} placeholder="English / Russian / Turkish" />
        <AppInput label="Год начала обучения" value={startYear} onChangeText={setStartYear} keyboardType="number-pad" placeholder="2026" />
        <AppInput label="Комментарий" value={comment} onChangeText={setComment} placeholder="Например: хочу поступить на подкурс в Китай" multiline style={styles.textarea} />
      </FormSection>

      <FormSection step="4" title="Документы" description="Можно прикрепить PDF или фото. Если документов пока нет — заявку всё равно можно отправить.">
        <Pressable style={styles.fileButton} onPress={handlePickFile}>
          <SvgIcon name="file" size={20} color={colors.primary} />
          <Text style={styles.fileButtonText}>Прикрепить документы</Text>
        </Pressable>
        {files.map((file, index) => (
          <View key={`${file.uri}-${index}`} style={styles.fileItem}>
            <SvgIcon name="document" size={17} color={colors.primary} />
            <Text style={styles.fileName}>{file.name}</Text>
            <Pressable onPress={() => setFiles(prev => prev.filter((_, itemIndex) => itemIndex !== index))}>
              <SvgIcon name="close" size={17} color={colors.mutedLight} />
            </Pressable>
          </View>
        ))}
      </FormSection>

      {status ? <StatusBox type={status.type} text={status.text} /> : null}

      <AppButton title="Отправить заявку" onPress={handleSubmit} loading={loading} style={styles.submitButton} />

      <CTASection
        eyebrow="Важно"
        title="Зарегистрированные пользователи получают больше"
        description="История заявок, ответы менеджера, персональные предложения и скидки остаются в вашем аккаунте."
        primaryText="Открыть чат"
        onPrimaryPress={() => navigation.navigate('Chat')}
        secondaryText="Мои заявки"
        onSecondaryPress={() => navigation.navigate('MyApplications')}
      />
    </Screen>
  );
}

function FormSection({ step, title, description, children }: { step: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.stepCircle}><Text style={styles.stepText}>{step}</Text></View>
        <View style={styles.sectionTitleBox}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </AppCard>
  );
}

function ChipScroll<T extends { id: number }>({ items, activeId, getLabel, onPress }: { items: T[]; activeId: number | null; getLabel: (item: T) => string; onPress: (item: T) => void }) {
  if (!items.length) return <Text style={styles.emptyHint}>Пока нет вариантов. Можно отправить заявку без выбора.</Text>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
      {items.map(item => {
        const active = activeId === item.id;
        return (
          <Pressable key={item.id} style={[styles.chip, active && styles.chipActive]} onPress={() => onPress(item)}>
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{getLabel(item)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function StatusBox({ type, text }: { type: 'success' | 'error' | 'info'; text: string }) {
  const color = type === 'success' ? colors.success : type === 'error' ? colors.danger : colors.primary;
  const icon = type === 'success' ? 'check' : type === 'error' ? 'warning' : 'application';
  return (
    <View style={[styles.statusBox, { borderColor: `${color}33`, backgroundColor: `${color}12` }]}>
      <SvgIcon name={icon} size={18} color={color} />
      <Text style={[styles.statusText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  hero: { minHeight: 300, borderRadius: radius.xl, backgroundColor: colors.primaryDark, padding: spacing.lg, justifyContent: 'flex-end', overflow: 'hidden', marginBottom: spacing.lg },
  glowBlue: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: colors.primary, top: -105, right: -95, opacity: 0.68 },
  glowMint: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.success, left: -90, bottom: -96, opacity: 0.22 },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.84)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  sectionCard: { marginBottom: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.white, fontWeight: typography.weights.heavy },
  sectionTitleBox: { flex: 1 },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  sectionDescription: { color: colors.muted, lineHeight: 20, marginTop: 4, fontWeight: typography.weights.medium },
  sectionContent: { marginTop: spacing.lg },
  label: { color: colors.text, fontSize: typography.small, fontWeight: typography.weights.heavy, marginBottom: spacing.sm },
  chipsRow: { marginBottom: spacing.md },
  chip: { maxWidth: 240, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.card, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: typography.weights.bold },
  chipTextActive: { color: colors.white },
  emptyHint: { color: colors.mutedLight, fontWeight: typography.weights.bold, marginBottom: spacing.md },
  textarea: { minHeight: 110, textAlignVertical: 'top', paddingTop: spacing.md },
  fileButton: { minHeight: 56, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm },
  fileButtonText: { color: colors.primary, fontWeight: typography.weights.heavy },
  fileItem: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fileName: { flex: 1, color: colors.text, fontWeight: typography.weights.bold },
  statusBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1 },
  statusText: { flex: 1, fontWeight: typography.weights.bold, lineHeight: 20 },
  submitButton: { marginBottom: spacing.sm },
  successCard: { alignItems: 'center', marginTop: spacing.xl },
  successIcon: { width: 76, height: 76, borderRadius: 28, backgroundColor: 'rgba(16,185,129,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  successTitle: { color: colors.text, fontSize: typography.title, fontWeight: typography.weights.heavy, textAlign: 'center' },
  successText: { color: colors.muted, fontSize: typography.body, lineHeight: 23, textAlign: 'center', marginTop: spacing.sm },
  successActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
});
