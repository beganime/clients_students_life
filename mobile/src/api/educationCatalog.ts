export const EDUCATION_CATALOG_BASE_URL = 'https://manager-sl.ru/api/client/v1';

type ListResponse<T> = { results?: T[] } | T[];

function list<T>(data: ListResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results || [];
}

async function request<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.append(key, String(value));
  });
  const url = `${EDUCATION_CATALOG_BASE_URL}${path}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Catalog API error: ${response.status}`);
  return response.json();
}

function money(value?: string | number | null, currency?: string) {
  if (value === null || value === undefined || value === '') return undefined;
  return `${value}${currency ? ` ${currency}` : ''}`;
}

function unique(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map(item => item?.trim()).filter(Boolean) as string[])).join(', ');
}

function toProgram(item: any): any {
  const firstFee = item.fees?.[0];
  const firstIntake = item.intakes?.[0];
  return { ...item, title: item.title || item.name || 'Программа', level: item.level || item.degree_display || item.degree || 'Уровень уточняется', country_name: item.country_name || item.country, city_name: item.city_name || item.city, tuition_fee: firstFee?.tuition_fee ?? item.tuition_fee, currency: firstFee?.currency || item.currency, application_deadline: firstIntake?.application_deadline || item.application_deadline, start_date: firstIntake?.start_date || item.start_date, requirements: item.requirements || item.admission_requirements };
}

function toCountry(item: any): any {
  return { ...item, slug: String(item.slug || item.id), flag: item.flag || item.flag_url, cover_image: item.cover_image || item.cover_image_url || item.image_url || item.flag_url, short_description: item.short_description || item.description, description_markdown: item.description_markdown || item.description };
}

function toCity(item: any): any {
  return { ...item, slug: String(item.slug || item.id), country_slug: String(item.country_slug || item.country), image: item.image || item.image_url || item.cover_image_url };
}

function toUniversity(item: any): any {
  const programs = (item.programs || []).map(toProgram);
  const firstFee = item.fees_summary?.[0] || programs.find((row: any) => row.tuition_fee)?.fees?.[0];
  return { ...item, slug: String(item.slug || item.id), country_slug: String(item.country_slug || item.country || ''), city_slug: String(item.city_slug || item.city || ''), logo: item.logo || item.logo_url, cover_image: item.cover_image || item.cover_image_url || item.cover, description_markdown: item.description_markdown || item.description, official_website: item.official_website || item.website, has_dormitory: Boolean(item.has_dormitory || item.dormitory_info), dormitory_cost: item.dormitory_cost || item.dormitory_info, tuition_from: item.tuition_from || money(firstFee?.tuition_fee, firstFee?.currency), languages: item.languages || unique(programs.map((row: any) => row.language)), education_levels: item.education_levels || unique(programs.map((row: any) => row.level || row.degree_display || row.degree)), programs };
}

export const educationCatalogApi = {
  async getCountries(params?: Record<string, string | number | boolean>) { return list(await request<ListResponse<any>>('/countries/', params)).map(toCountry); },
  async getCountry(id: number | string) { return toCountry(await request<any>(`/countries/${id}/`)); },
  async getCities(params?: Record<string, string | number | boolean>) { return list(await request<ListResponse<any>>('/cities/', params)).map(toCity); },
  async getCity(id: number | string) { return toCity(await request<any>(`/cities/${id}/`)); },
  async getUniversities(params?: Record<string, string | number | boolean | undefined>) { return list(await request<ListResponse<any>>('/universities/', params)).map(toUniversity); },
  async getUniversity(id: number | string) { return toUniversity(await request<any>(`/universities/${id}/`)); },
  async getPrograms(params?: Record<string, string | number | boolean | undefined>) { return list(await request<ListResponse<any>>('/programs/', params)).map(toProgram); },
  async getProgram(id: number | string) { return toProgram(await request<any>(`/programs/${id}/`)); },
};
