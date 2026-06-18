import axios from 'axios';

import { City, Country, Program, University } from '../types/api';

const CATALOG_API_BASE_URL = 'https://manager-sl.ru/api/client/v1';

const catalogClient = axios.create({
  baseURL: CATALOG_API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

type ListResponse<T> = { results?: T[] } | T[];

function unwrapList<T>(data: ListResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results || [];
}

function money(value?: string | number | null, currency?: string) {
  if (value === null || value === undefined || value === '') return undefined;
  return `${value}${currency ? ` ${currency}` : ''}`;
}

function unique(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map(item => item?.trim()).filter(Boolean) as string[])).join(', ');
}

function normalizeProgram(item: any): Program {
  const firstFee = item.fees?.[0];
  const firstIntake = item.intakes?.[0];

  return {
    ...item,
    title: item.title || item.name || 'Программа',
    level: item.level || item.degree_display || item.degree || 'Уровень уточняется',
    country_name: item.country_name || item.country,
    city_name: item.city_name || item.city,
    tuition_fee: firstFee?.tuition_fee ?? item.tuition_fee,
    currency: firstFee?.currency || item.currency,
    application_deadline: firstIntake?.application_deadline || item.application_deadline,
    start_date: firstIntake?.start_date || item.start_date,
    requirements: item.requirements || item.admission_requirements,
  };
}

function normalizeCountry(item: any): Country {
  return {
    ...item,
    slug: String(item.slug || item.id),
    flag: item.flag || item.flag_url,
    cover_image: item.cover_image || item.cover_image_url || item.image_url || item.flag_url,
    short_description: item.short_description || item.description,
    description_markdown: item.description_markdown || item.description,
  };
}

function normalizeCity(item: any): City {
  return {
    ...item,
    slug: String(item.slug || item.id),
    country_slug: String(item.country_slug || item.country),
    image: item.image || item.image_url || item.cover_image_url,
  };
}

function normalizeUniversity(item: any): University {
  const programs = (item.programs || []).map(normalizeProgram);
  const firstFee = item.fees_summary?.[0] || programs.find((program: any) => program.tuition_fee)?.fees?.[0];

  return {
    ...item,
    slug: String(item.slug || item.id),
    country_slug: String(item.country_slug || item.country || ''),
    city_slug: String(item.city_slug || item.city || ''),
    logo: item.logo || item.logo_url,
    cover_image: item.cover_image || item.cover_image_url || item.cover,
    description_markdown: item.description_markdown || item.description,
    official_website: item.official_website || item.website,
    has_dormitory: Boolean(item.has_dormitory || item.dormitory_info),
    dormitory_cost: item.dormitory_cost || item.dormitory_info,
    tuition_from: item.tuition_from || money(firstFee?.tuition_fee, firstFee?.currency),
    languages: item.languages || unique(programs.map((program: Program) => program.language)),
    education_levels: item.education_levels || unique(programs.map((program: Program) => program.level || program.degree_display || program.degree)),
    programs,
  };
}

export const catalogApi = {
  async getCountries(params?: Record<string, string | number | boolean>) {
    const { data } = await catalogClient.get<ListResponse<any>>('/countries/', { params });
    return unwrapList(data).map(normalizeCountry);
  },

  async getCountry(id: number | string) {
    const { data } = await catalogClient.get<any>(`/countries/${id}/`);
    return normalizeCountry(data);
  },

  async getCities(params?: Record<string, string | number | boolean>) {
    const { data } = await catalogClient.get<ListResponse<any>>('/cities/', { params });
    return unwrapList(data).map(normalizeCity);
  },

  async getCity(id: number | string) {
    const { data } = await catalogClient.get<any>(`/cities/${id}/`);
    return normalizeCity(data);
  },

  async getUniversities(params?: Record<string, string | number | boolean | undefined>) {
    const { data } = await catalogClient.get<ListResponse<any>>('/universities/', { params });
    return unwrapList(data).map(normalizeUniversity);
  },

  async getUniversity(id: number | string) {
    const { data } = await catalogClient.get<any>(`/universities/${id}/`);
    return normalizeUniversity(data);
  },

  async getPrograms(params?: Record<string, string | number | boolean | undefined>) {
    const { data } = await catalogClient.get<ListResponse<any>>('/programs/', { params });
    return unwrapList(data).map(normalizeProgram);
  },

  async getProgram(id: number | string) {
    const { data } = await catalogClient.get<any>(`/programs/${id}/`);
    return normalizeProgram(data);
  },
};
