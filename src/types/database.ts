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
