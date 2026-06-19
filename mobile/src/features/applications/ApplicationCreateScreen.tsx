import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { educationCatalogApi } from '../../api/educationCatalog';
import { applicationsApi, contentApi } from '../../api/endpoints';
import { bannerImages } from '../../assets/banners';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { Badge } from '../../components/Badge';
import { CTASection } from '../../components/CTASection';
import { Loading } from '../../components/Loading';
import { LoginRequired } from '../../components/LoginRequired';
import { RedGradientHero } from '../../components/RedGradientHero';
import { Screen } from '../../components/Screen';
import { SvgIcon } from '../../components/SvgIcon';
import { colors, radius, spacing, typography } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { City, Country, Program, Service, University } from '../../types/api';
import { getApiErrorMessage } from '../../utils/apiError';

type SelectedFile = { uri: string; name: string; type: string };
type SubmitStatus = { type: 'success' | 'error' | 'info'; text: string } | null;

function makeIdempotencyKey() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
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

  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: contentApi.getServices, staleTime: 1000 * 60 * 20 });
  const countriesQuery = useQuery({
    queryKey: ['catalog', 'countries', 'application'],
    queryFn: () => educationCatalogApi.getCountries(),
    staleTime: 1000 * 60 * 30,
  });

  const [serviceId, setServiceId] = useState<number | null>(toNumber(route.params?.serviceId));
  const [targetCountryId, setTargetCountryId] = useState<number | null>(null);
  const [targetCityId, setTargetCityId] = useState<number | null>(null);
  const [targetUniversityId, setTargetUniversityId] = useState<number | null>(toNumber(route.params?.universityId));
  const [targetProgramId, setTargetProgramId] = useState<number | null>(toNumber(route.params?.programId));
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

  const citiesQuery = useQuery({
    queryKey: ['catalog', 'cities', { country: targetCountryId || 'none' }],
    queryFn: () => educationCatalogApi.getCities(targetCountryId ? { country: targetCountryId } : undefined),
    enabled: Boolean(targetCountryId),
    staleTime: 1000 * 60 * 30,
  });

  const universitiesQuery = useQuery({
    queryKey: ['catalog', 'universities', { country: targetCountryId || 'all', city: targetCityId || 'all' }],
    queryFn: () =>
      educationCatalogApi.getUniversities({
        country: targetCountryId || undefined,
        city: targetCityId || undefined,
      }),
    staleTime: 1000 * 60 * 20,
  });

  const selectedUniversityQuery = useQuery({
    queryKey: ['catalog', 'university', targetUniversityId],
    queryFn: () => educationCatalogApi.getUniversity(targetUniversityId as number),
    enabled: Boolean(targetUniversityId),
    staleTime: 1000 * 60 * 30,
  });

  const programsQuery = useQuery({
    queryKey: ['catalog', 'programs', { university: targetUniversityId || 'none' }],
    queryFn: () => educationCatalogApi.getPrograms({ university: targetUniversityId || undefined }),
    enabled: Boolean(targetUniversityId),
    staleTime: 1000 * 60 * 30,
  });

  const selectedProgramQuery = useQuery({
    queryKey: ['catalog', 'program', targetProgramId],
    queryFn: () => educationCatalogApi.getProgram(targetProgramId as number),
    enabled: Boolean(targetProgramId),
    staleTime: 1000 * 60 * 30,
  });

  const isInitialLoading = servicesQuery.isLoading || countriesQuery.isLoading;

  useEffect(() => {
    if (route.params?.serviceId) setServiceId(toNumber(route.params.serviceId));
    if (route.params?.universityId) setTargetUniversityId(toNumber(route.params.universityId));
    if (route.params?.programId) setTargetProgramId(toNumber(route.params.programId));
  }, [route.params?.serviceId, route.params?.universityId, route.params?.programId]);

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

  useEffect(() => {
    const university = selectedUniversityQuery.data;
    if (!university) return;
    if (university.country) setTargetCountryId(prev => prev || Number(university.country));
    if (university.city) setTargetCityId(prev => prev || Number(university.city));
  }, [selectedUniversityQuery.data]);

  useEffect(() => {
    const program = selectedProgramQuery.data;
    if (!program) return;
    if (program.university) setTargetUniversityId(prev => prev || Number(program.university));
    setSpecialty(prev => prev || program.title || '');
    setEducationLevel(prev => prev || program.level || '');
    setStudyLanguage(prev => prev || program.language || '');
  }, [selectedProgramQuery.data]);

  const selectedCountry = countriesQuery.data?.find(item => item.id === targetCountryId);
  const selectedCity = citiesQuery.data?.find(item => item.id === targetCityId);
  const selectedUniversity =
    selectedUniversityQuery.data || universitiesQuery.data?.find(item => item.id === targetUniversityId);
  const selectedProgram =
    selectedProgramQuery.data || programsQuery.data?.find(item => item.id === targetProgramId);

  const resetForm = () => {
    setServiceId(null);
    setTargetCountryId(null);
    setTargetCityId(null);
    setTargetUniversityId(null);
    setTargetProgramId(null);
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
        target_country_name: selectedCountry?.name,
        target_city: targetCityId,
        target_city_name: selectedCity?.name,
        target_university: targetUniversityId,
        target_university_name: selectedUniversity?.name,
        target_program: targetProgramId,
        target_program_title: selectedProgram?.title,
        education_level: educationLevel,
        specialty,
        study_language: studyLanguage,
        start_year: startYear,
        comment,
        idempotency_key: makeIdempotencyKey(),
      });

      for (const file of files) await applicationsApi.uploadFile(application.id, file, 'other');

      setSuccessNumber(application.application_number);
      setStatus({ type: 'success', text: `Заявка отправлена. Номер: ${application.application_number}` });
      resetForm();
    } catch (error) {
      setStatus({
        type: 'error',
        text: getApiErrorMessage(
          error,
          'Заявка не отправилась. Попробуйте ещё раз или напишите нам в чат.',
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) return <Loading />;

  if (successNumber) {
    return (
      <Screen scroll style={styles.screen}>
        <AppCard style={styles.successCard}>
          <View style={styles.successIcon}>
            <SvgIcon name="check" size={34} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Заявка отправлена</Text>
          <Text style={styles.successText}>
            Номер заявки: {successNumber}. Менеджер свяжется с вами и объяснит следующие шаги.
          </Text>
          <View style={styles.successActions}>
            <AppButton title="Мои заявки" onPress={() => navigation.navigate('MyApplications')} />
            <AppButton title="Открыть чат" variant="outline" onPress={() => navigation.navigate('Chat')} />
            <AppButton
              title="Создать ещё заявку"
              variant="ghost"
              onPress={() => {
                setSuccessNumber('');
                setStatus(null);
              }}
            />
          </View>
        </AppCard>
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.screen}>
      <RedGradientHero backgroundImage={bannerImages.application} style={styles.hero}>
        <Badge label="Заявка ни к чему не обязывает" variant="mint" icon="check" />
        <Text style={styles.title}>Расскажите, куда хотите поступить</Text>
        <Text style={styles.subtitle}>
          Данные из карточки вуза или программы подставятся автоматически, а менеджер проверит детали.
        </Text>
      </RedGradientHero>

      <FormSection
        step="1"
        title="Услуга и направление"
        description="Выберите услугу, страну, город, вуз и программу, если уже знаете желаемый вариант."
      >
        <Text style={styles.label}>Услуга</Text>
        <ChipScroll<Service>
          items={servicesQuery.data || []}
          activeId={serviceId}
          getLabel={item => item.title}
          onPress={item => setServiceId(serviceId === item.id ? null : item.id)}
        />

        <Text style={styles.label}>Страна обучения</Text>
        <ChipScroll<Country>
          items={countriesQuery.data || []}
          activeId={targetCountryId}
          getLabel={item => item.name}
          onPress={item => {
            setTargetCountryId(targetCountryId === item.id ? null : item.id);
            setTargetCityId(null);
            setTargetUniversityId(null);
            setTargetProgramId(null);
          }}
        />

        <Text style={styles.label}>Город</Text>
        <ChipScroll<City>
          items={targetCountryId ? citiesQuery.data || [] : []}
          activeId={targetCityId}
          getLabel={item => item.name}
          onPress={item => {
            setTargetCityId(targetCityId === item.id ? null : item.id);
            setTargetUniversityId(null);
            setTargetProgramId(null);
          }}
          emptyText="Выберите страну, чтобы увидеть города."
        />

        <Text style={styles.label}>Вуз</Text>
        <ChipScroll<University>
          items={(universitiesQuery.data || []).slice(0, 30)}
          activeId={targetUniversityId}
          getLabel={item => item.name}
          onPress={item => {
            setTargetUniversityId(targetUniversityId === item.id ? null : item.id);
            setTargetProgramId(null);
          }}
        />

        <Text style={styles.label}>Программа</Text>
        <ChipScroll<Program>
          items={targetUniversityId ? programsQuery.data || [] : []}
          activeId={targetProgramId}
          getLabel={item => item.title}
          onPress={item => {
            setTargetProgramId(targetProgramId === item.id ? null : item.id);
            setSpecialty(prev => prev || item.title);
            setEducationLevel(prev => prev || item.level);
            setStudyLanguage(prev => prev || item.language || '');
          }}
          emptyText="Выберите вуз, чтобы увидеть программы."
        />
      </FormSection>

      <FormSection
        step="2"
        title="Контакты студента"
        description="Достаточно одного способа связи, но лучше оставить WhatsApp или Telegram."
      >
        <AppInput label="ФИО" value={fullName} onChangeText={setFullName} placeholder="Ali Myradov" />
        <AppInput label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+993..." />
        <AppInput label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="+993..." />
        <AppInput label="Telegram" value={telegram} onChangeText={setTelegram} placeholder="@username" />
        <AppInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="student@example.com" />
      </FormSection>

      <FormSection
        step="3"
        title="Образование и пожелания"
        description="Эти поля помогают менеджеру точнее подобрать программу и проверить требования."
      >
        <AppInput label="Гражданство" value={citizenship} onChangeText={setCitizenship} placeholder="Turkmenistan" />
        <AppInput label="Страна проживания" value={country} onChangeText={setCountry} placeholder="Turkmenistan" />
        <AppInput label="Текущий уровень образования" value={educationLevel} onChangeText={setEducationLevel} placeholder="Среднее образование / бакалавр" />
        <AppInput label="Желаемая специальность" value={specialty} onChangeText={setSpecialty} placeholder="Medicine / IT / Business" />
        <AppInput label="Язык обучения" value={studyLanguage} onChangeText={setStudyLanguage} placeholder="English / Russian / Turkish" />
        <AppInput label="Год начала обучения" value={startYear} onChangeText={setStartYear} keyboardType="number-pad" placeholder="2026" />
        <AppInput label="Комментарий" value={comment} onChangeText={setComment} placeholder="Например: хочу поступить на подготовительный курс" multiline style={styles.textarea} />
      </FormSection>

      <FormSection
        step="4"
        title="Документы"
        description="Можно прикрепить PDF или фото. Если документов пока нет, заявку всё равно можно отправить."
      >
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

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepText}>{step}</Text>
        </View>
        <View style={styles.sectionTitleBox}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </AppCard>
  );
}

function ChipScroll<T extends { id: number }>({
  items,
  activeId,
  getLabel,
  onPress,
  emptyText = 'Пока нет вариантов. Можно отправить заявку без выбора.',
}: {
  items: T[];
  activeId: number | null;
  getLabel: (item: T) => string;
  onPress: (item: T) => void;
  emptyText?: string;
}) {
  if (!items.length) return <Text style={styles.emptyHint}>{emptyText}</Text>;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
      {items.map(item => {
        const active = activeId === item.id;
        return (
          <Pressable key={item.id} style={[styles.chip, active && styles.chipActive]} onPress={() => onPress(item)}>
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
              {getLabel(item)}
            </Text>
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
  hero: { minHeight: 260, marginBottom: spacing.lg },
  title: { color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: typography.weights.heavy, marginTop: spacing.md },
  subtitle: { color: 'rgba(255,255,255,0.92)', fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm, fontWeight: typography.weights.medium },
  sectionCard: { marginBottom: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepCircle: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.white, fontWeight: typography.weights.heavy },
  sectionTitleBox: { flex: 1 },
  sectionTitle: { color: colors.text, fontSize: typography.subtitle, fontWeight: typography.weights.heavy },
  sectionDescription: { color: colors.muted, lineHeight: 20, marginTop: 4, fontWeight: typography.weights.medium },
  sectionContent: { marginTop: spacing.lg },
  label: { color: colors.text, fontSize: typography.small, fontWeight: typography.weights.heavy, marginBottom: spacing.sm },
  chipsRow: { marginBottom: spacing.md },
  chip: {
    maxWidth: 260,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: typography.weights.bold },
  chipTextActive: { color: colors.white },
  emptyHint: { color: colors.mutedLight, fontWeight: typography.weights.bold, marginBottom: spacing.md, lineHeight: 20 },
  textarea: { minHeight: 110, textAlignVertical: 'top', paddingTop: spacing.md },
  fileButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fileButtonText: { color: colors.primary, fontWeight: typography.weights.heavy },
  fileItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fileName: { flex: 1, color: colors.text, fontWeight: typography.weights.bold },
  statusBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1 },
  statusText: { flex: 1, fontWeight: typography.weights.bold, lineHeight: 20 },
  submitButton: { marginBottom: spacing.sm },
  successCard: { alignItems: 'center', marginTop: spacing.xl },
  successIcon: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: 'rgba(16,185,129,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  successTitle: { color: colors.text, fontSize: typography.title, fontWeight: typography.weights.heavy, textAlign: 'center' },
  successText: { color: colors.muted, fontSize: typography.body, lineHeight: 23, textAlign: 'center', marginTop: spacing.sm },
  successActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
});
