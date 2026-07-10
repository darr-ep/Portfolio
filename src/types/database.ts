export interface ProjectBeat {
  lead: string;
  body: string;
}

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
  tagline_es: string | null;
  tagline_en: string | null;
  role_es: string | null;
  role_en: string | null;
  live_url: string | null;
  github_url: string | null;
  collaborators: string | null;
  year: number | null;
  approach_title_es: string | null;
  approach_title_en: string | null;
  approach_body_es: string | null;
  approach_body_en: string | null;
  conclusion_es: string | null;
  conclusion_en: string | null;
  beats_es: ProjectBeat[] | null;
  beats_en: ProjectBeat[] | null;
  // Optional: these columns are additive (migration 0001_cv_project_impact.sql)
  // and may not exist on the DB yet. Code reading them must not assume presence.
  cv_visible?: boolean;
  cv_problem_es?: string | null;
  cv_problem_en?: string | null;
  cv_impact_es?: ProjectBeat[] | null;
  cv_impact_en?: ProjectBeat[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  slot_key: 'hero' | 'mockup_main' | 'mockup_secondary' | 'detail';
  storage_path: string;
  url: string;
  alt_es: string | null;
  alt_en: string | null;
  created_at: string;
}

export type TimelineEntryType = 'work' | 'freelance' | 'education' | 'project' | 'certification' | 'milestone';

export interface TimelineEntry {
  id: string;
  sort_order: number;
  year: string;
  role_es: string;
  role_en: string;
  company: string;
  description_es: string;
  description_en: string;
  entry_type: TimelineEntryType;
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
