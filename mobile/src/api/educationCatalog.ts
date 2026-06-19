import { MANAGER_SL_API_BASE_URL, MANAGER_SL_ROOT_URL } from '../constants/config';

export const EDUCATION_CATALOG_BASE_URL = MANAGER_SL_API_BASE_URL;

type ListResponse<T> = { results?: T[] } | T[];

function list<T>(data: ListResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results || [];
}

async function request<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.append(key, String(value));
  });

  const url = `${EDUCATION_CATALOG_BASE_URL}${path}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Catalog API error: ${response.status}`);
  }

  return response.json();
}

export function resolveCatalogMediaUrl(value?: string | null) {
  if (!value) return null;

  const cleanValue = String(value).trim();
  if (!cleanValue) return null;
  if (/^https?:\/\//i.test(cleanValue)) return cleanValue;
  if (cleanValue.startsWith('//')) return `https:${cleanValue}`;
  if (cleanValue.startsWith('/')) return `${MANAGER_SL_ROOT_URL}${cleanValue}`;
  return `${MANAGER_SL_ROOT_URL}/${cleanValue}`;
}

function money(value?: string | number | null, currency?: string | null) {
  if (value === null || value === undefined || value === '') return undefined;
  return `${value}${currency ? ` ${currency}` : ''}`;
}

function unique(values: Array<string | undefined | null>) {
  return Array.from(
    new Set(values.map(item => item?.trim()).filter(Boolean) as string[]),
  ).join(', ');
}

function normalizeText(value?: string | null) {
  const text = value?.trim();
  return text || undefined;
}

function toProgram(item: any): any {
  const firstFee = item.fees?.[0];
  const firstIntake = item.intakes?.[0];
  const degree = item.degree_display || item.degree || item.level;

  return {
    ...item,
    title: item.title || item.name || 'Программа',
    level: degree || 'Уровень уточняется',
    country_name: item.country_name || item.country,
    city_name: item.city_name || item.city,
    tuition_fee: firstFee?.tuition_fee ?? item.tuition_fee,
    currency: firstFee?.currency || item.currency,
    application_deadline: firstIntake?.application_deadline || item.application_deadline,
    start_date: firstIntake?.start_date || item.start_date,
    intakes: item.intakes || [],
    fees: item.fees || [],
    requirements: normalizeText(item.requirements || item.admission_requirements),
    description_markdown: normalizeText(item.description_markdown || item.description),
    required_documents: normalizeText(item.required_documents),
    university_logo: resolveCatalogMediaUrl(item.university_logo || item.logo_url || item.logo),
    university_cover: resolveCatalogMediaUrl(item.university_cover || item.cover_image_url || item.cover),
  };
}

function toCountry(item: any): any {
  return {
    ...item,
    slug: String(item.slug || item.id),
    flag: resolveCatalogMediaUrl(item.flag || item.flag_url),
    cover_image: resolveCatalogMediaUrl(
      item.cover_image || item.cover_image_url || item.image_url || item.flag_url,
    ),
    short_description: normalizeText(item.short_description || item.description),
    description_markdown: normalizeText(item.description_markdown || item.description),
    cities_count: item.cities_count || 0,
    universities_count: item.universities_count || 0,
  };
}

function toCity(item: any): any {
  return {
    ...item,
    slug: String(item.slug || item.id),
    country_slug: String(item.country_slug || item.country || ''),
    image: resolveCatalogMediaUrl(item.image || item.image_url || item.cover_image_url),
    cover_image: resolveCatalogMediaUrl(item.cover_image || item.cover_image_url || item.image_url),
    description_markdown: normalizeText(item.description_markdown || item.description),
    universities_count: item.universities_count || 0,
  };
}

function toUniversity(item: any): any {
  const programs = (item.programs || []).map(toProgram);
  const firstFee = item.fees_summary?.[0] || programs.find((row: any) => row.tuition_fee)?.fees?.[0];

  return {
    ...item,
    slug: String(item.slug || item.id),
    country_slug: String(item.country_slug || item.country || ''),
    city_slug: String(item.city_slug || item.city || ''),
    logo: resolveCatalogMediaUrl(item.logo || item.logo_url),
    cover_image: resolveCatalogMediaUrl(item.cover_image || item.cover_image_url || item.cover),
    description_markdown: normalizeText(item.description_markdown || item.description),
    official_website: item.official_website || item.website,
    has_dormitory: Boolean(item.has_dormitory || item.dormitory_info),
    dormitory_cost: item.dormitory_cost || item.dormitory_info,
    tuition_from: item.tuition_from || money(firstFee?.tuition_fee, firstFee?.currency),
    languages: item.languages || unique(programs.map((row: any) => row.language)),
    education_levels: item.education_levels || unique(programs.map((row: any) => row.level || row.degree_display || row.degree)),
    public_contacts: item.public_contacts || item.contacts,
    programs_count: item.programs_count || programs.length,
    programs,
  };
}

export const educationCatalogApi = {
  async getCountries(params?: Record<string, string | number | boolean>) {
    return list(await request<ListResponse<any>>('/countries/', params)).map(toCountry);
  },

  async getCountry(id: number | string) {
    return toCountry(await request<any>(`/countries/${id}/`));
  },

  async getCities(params?: Record<string, string | number | boolean>) {
    return list(await request<ListResponse<any>>('/cities/', params)).map(toCity);
  },

  async getCity(id: number | string) {
    return toCity(await request<any>(`/cities/${id}/`));
  },

  async getUniversities(params?: Record<string, string | number | boolean | undefined>) {
    return list(await request<ListResponse<any>>('/universities/', params)).map(toUniversity);
  },

  async getUniversity(id: number | string) {
    return toUniversity(await request<any>(`/universities/${id}/`));
  },

  async getPrograms(params?: Record<string, string | number | boolean | undefined>) {
    return list(await request<ListResponse<any>>('/programs/', params)).map(toProgram);
  },

  async getProgram(id: number | string) {
    return toProgram(await request<any>(`/programs/${id}/`));
  },

  async getServices(params?: Record<string, string | number | boolean | undefined>) {
    return list(await request<ListResponse<any>>('/services/', params));
  },
};
