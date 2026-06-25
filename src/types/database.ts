export interface Project {
  id: string;
  sort_order: number;
  slug: string;
  title_es: string;
  title_en: string;
  category_es: string;
  category_en: string;
  description_es: string;
  description_en: string;
  detailed_content_es: string | null;
  detailed_content_en: string | null;
  tech: string[];
  main_image: string | null;
  timeline_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEntry {
  id: string;
  sort_order: number;
  year: string;
  role_es: string;
  role_en: string;
  company: string;
  description_es: string;
  description_en: string;
  created_at: string;
  updated_at: string;
}

export interface Technology {
  id: string;
  sort_order: number;
  name: string;
  category: string;
  icon: string | null;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role_es: string;
  role_en: string;
  about_es: string;
  about_en: string;
  email: string;
  phone: string;
  location_es: string;
  location_en: string;
  github_url: string;
  linkedin_url: string;
  updated_at: string;
}

export interface Education {
  id: string;
  sort_order: number;
  institution: string;
  degree_es: string;
  degree_en: string;
  period: string;
  description_es: string;
  description_en: string;
  created_at: string;
  updated_at: string;
}

export interface Language {
  id: string;
  sort_order: number;
  name_es: string;
  name_en: string;
  level_es: string;
  level_en: string;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  sort_order: number;
  question_es: string;
  question_en: string;
  answer_es: string;
  answer_en: string;
  created_at: string;
  updated_at: string;
}
