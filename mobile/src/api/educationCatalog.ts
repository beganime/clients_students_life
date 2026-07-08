import { API_BASE_URL, API_ROOT_URL, MANAGER_SL_API_BASE_URL, MANAGER_SL_ROOT_URL } from '../constants/config';

export const EDUCATION_CATALOG_BASE_URL = MANAGER_SL_API_BASE_URL;

type ListResponse<T> = { count?: number; next?: string | null; previous?: string | null; results?: T[] } | T[];
export type CatalogParams = Record<string, string | number | boolean | undefined>;
export type CatalogPage<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function list<T>(data: ListResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results || [];
}

function page<T>(data: ListResponse<T>): CatalogPage<T> {
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }

  const results = data.results || [];
  return {
    count: data.count ?? results.length,
    next: data.next ?? null,
    previous: data.previous ?? null,
    results,
  };
}

async function request<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  return requestFromBase<T>(EDUCATION_CATALOG_BASE_URL, path, params, API_BASE_URL);
}

async function requestFromBase<T>(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  fallbackBaseUrl?: string,
): Promise<T> {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.append(key, String(value));
  });

  const url = `${baseUrl}${path}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    if (fallbackBaseUrl && fallbackBaseUrl !== baseUrl) {
      return requestFromBase<T>(fallbackBaseUrl, path, params);
    }
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
  if (cleanValue.startsWith('/media/') || cleanValue.startsWith('/static/')) return `${API_ROOT_URL}${cleanValue}`;
  if (cleanValue.startsWith('/')) return `${MANAGER_SL_ROOT_URL || API_ROOT_URL}${cleanValue}`;
  return `${MANAGER_SL_ROOT_URL || API_ROOT_URL}/${cleanValue}`;
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

function normalizeText(value?: unknown) {
  if (Array.isArray(value)) {
    const text = value
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>;
          return [row.title, row.name, row.description].filter(Boolean).join(' - ');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
    return text || undefined;
  }

  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const text = [row.website, row.email, row.phone, row.address].filter(Boolean).join('\n');
    return text || undefined;
  }

  const text = typeof value === 'string' ? value.trim() : value === null || value === undefined ? '' : String(value).trim();
  return text || undefined;
}

function withLimit(params: CatalogParams | undefined, limit: number): CatalogParams {
  if (params?.limit || params?.offset) return params || {};
  return { limit, ...(params || {}) };
}

function toProgram(item: any): any {
  const firstFee = item.fees?.[0];
  const firstIntake = item.intakes?.[0];
  const degree = item.degree_display || item.degree || item.level;
  const university = item.university_detail || item.university || {};
  const universityId = typeof item.university === 'number' ? item.university : item.university_id || university.id;
  const universityName = item.university_name || university.name || item.university_title;
  const countryName = item.country_name || item.country || university.country_name;
  const cityName = item.city_name || item.city || university.city_name;

  return {
    ...item,
    id: item.program_id || item.id,
    program_id: item.program_id || item.id,
    program_title: item.program_title || item.title || item.name,
    university: universityId,
    university_id: universityId,
    university_name: universityName,
    title: item.program_title || item.title || item.name || 'Программа',
    level: degree || 'Уровень уточняется',
    country_name: countryName,
    city_name: cityName,
    tuition_fee: firstFee?.tuition_fee ?? item.tuition_fee,
    currency: firstFee?.currency || item.currency,
    currency_symbol: firstFee?.currency_symbol || item.currency_symbol,
    converted_tuition_fee: item.converted_tuition_fee,
    selected_currency: item.selected_currency,
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
    admission_requirements: normalizeText(item.admission_requirements),
    invitation_info: normalizeText(item.invitation_info),
    expenses_info: normalizeText(item.expenses_info),
    has_dormitory: Boolean(item.has_dormitory || item.dormitory_info),
    dormitory_cost: normalizeText(item.dormitory_cost || item.dormitory_info),
    tuition_from: item.tuition_from || money(firstFee?.tuition_fee, firstFee?.currency),
    languages: item.languages || unique(programs.map((row: any) => row.language)),
    education_levels: item.education_levels || unique(programs.map((row: any) => row.level || row.degree_display || row.degree)),
    public_contacts: normalizeText(item.public_contacts || item.contacts),
    contacts: normalizeText(item.contacts),
    contact_people: item.contact_people || [],
    programs_count: item.programs_count || programs.length,
    programs,
    required_documents: normalizeText(item.required_documents),
  };
}

export const educationCatalogApi = {
  async getCountries(params?: CatalogParams) {
    return list(await request<ListResponse<any>>('/countries/', withLimit(params, 50))).map(toCountry);
  },

  async getCountry(id: number | string) {
    return toCountry(await request<any>(`/countries/${id}/`));
  },

  async getCities(params?: CatalogParams) {
    return list(await request<ListResponse<any>>('/cities/', withLimit(params, 100))).map(toCity);
  },

  async getCity(id: number | string) {
    return toCity(await request<any>(`/cities/${id}/`));
  },

  async getUniversities(params?: CatalogParams) {
    return list(await request<ListResponse<any>>('/universities/', withLimit(params, 12))).map(toUniversity);
  },

  async getAllUniversities(params?: CatalogParams) {
    return getAllPages('/universities/', params, 100, toUniversity);
  },

  async getUniversitiesPage(params?: CatalogParams) {
    const data = page(await request<ListResponse<any>>('/universities/', withLimit(params, 12)));
    return { ...data, results: data.results.map(toUniversity) };
  },

  async getUniversity(id: number | string) {
    return toUniversity(await request<any>(`/universities/${id}/`));
  },

  async getPrograms(params?: CatalogParams) {
    return list(await request<ListResponse<any>>('/programs/', withLimit(params, 50))).map(toProgram);
  },

  async getAllPrograms(params?: CatalogParams) {
    return getAllPages('/programs/', params, 100, toProgram);
  },

  async getProgramsPage(params?: CatalogParams) {
    const data = page(await request<ListResponse<any>>('/programs/', withLimit(params, 12)));
    return { ...data, results: data.results.map(toProgram) };
  },

  async getProgram(id: number | string) {
    return toProgram(await request<any>(`/programs/${id}/`));
  },

  async getServices(params?: CatalogParams) {
    return list(await request<ListResponse<any>>('/services/', withLimit(params, 50)));
  },
};

async function getAllPages<T>(
  path: string,
  params: CatalogParams | undefined,
  limit: number,
  mapper: (item: any) => T,
) {
  const results: T[] = [];
  let offset = Number(params?.offset || 0);
  let guard = 0;

  while (guard < 30) {
    const data = page(await request<ListResponse<any>>(path, { ...(params || {}), limit, offset }));
    results.push(...data.results.map(mapper));
    if (!data.next || data.results.length === 0) break;
    offset += limit;
    guard += 1;
  }

  return results;
}
