/**
 * Pure projection/normalization for the CV's "problem → impact" content.
 * Framework-free (no astro/supabase/react imports) so it stays Vitest-testable
 * in isolation; `cv.pdf.ts` is the only caller and does the raw Supabase read
 * + `sort_order` sort before handing rows here.
 */

/** Fixed number of impact bullets the admin editor exposes per locale. */
export const CV_IMPACT_SLOTS = 4;

export interface CvImpactBullet {
  lead: string;
  body: string;
}

export interface CvProjectRow {
  title_es: string;
  title_en: string;
  description_es: string;
  description_en: string;
  tech: string[] | null;
  cv_visible: boolean | null;
  cv_problem_es: string | null;
  cv_problem_en: string | null;
  cv_impact_es: unknown;
  cv_impact_en: unknown;
}

export interface CvProjectView {
  title: string;
  description: string;
  tech: string[];
  /** '' when absent. */
  problem: string;
  /** [] when absent or malformed. */
  impact: CvImpactBullet[];
}

type Lang = 'es' | 'en';

function textOrEmpty(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function normalizeImpact(raw: unknown): CvImpactBullet[] {
  if (!Array.isArray(raw)) return [];

  const bullets: CvImpactBullet[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;

    const candidate = item as Record<string, unknown>;
    const lead = typeof candidate.lead === 'string' ? candidate.lead.trim() : '';
    const body = typeof candidate.body === 'string' ? candidate.body.trim() : '';

    if (!lead && !body) continue;

    bullets.push({ lead, body });
    if (bullets.length >= CV_IMPACT_SLOTS) break;
  }

  return bullets;
}

/**
 * Filters rows to `cv_visible === true` and resolves each to a locale-picked,
 * malformed-data-tolerant view. Order of the input array is preserved — the
 * caller is responsible for sorting by `sort_order` beforehand.
 */
export function projectCvProjects(rows: CvProjectRow[], lang: Lang): CvProjectView[] {
  return rows
    .filter((row) => row.cv_visible === true)
    .map((row) => ({
      title: textOrEmpty(lang === 'en' ? row.title_en : row.title_es),
      description: textOrEmpty(lang === 'en' ? row.description_en : row.description_es),
      tech: row.tech ?? [],
      problem: textOrEmpty(lang === 'en' ? row.cv_problem_en : row.cv_problem_es),
      impact: normalizeImpact(lang === 'en' ? row.cv_impact_en : row.cv_impact_es),
    }));
}
