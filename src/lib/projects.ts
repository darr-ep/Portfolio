import type { Project } from '../types/database';

/** Generic placeholder shown for projects whose case study isn't written yet. */
export const COMING_SOON_IMAGE = '/assets/coming-soon.svg';

/** Static fallbacks used when a ready project has no uploaded image. */
export const FALLBACK_IMAGES = ['/assets/Proyecto 1.webp', '/assets/Proyecto 2.webp', '/assets/Proyecto 3.webp'];

type ReadinessFields = Pick<Project, 'approach_body_es' | 'approach_body_en'>;

/**
 * A project is "ready" (has a real case study) once its approach body is filled.
 * Until then it renders as a non-clickable "coming soon" card. When content is
 * loaded later, it flips to ready automatically — no flag to maintain.
 */
export function isProjectReady(p: ReadinessFields): boolean {
  return Boolean(p.approach_body_es?.trim() || p.approach_body_en?.trim());
}

/** Resolve the card image: real upload wins; ready-but-imageless falls back; pending shows the placeholder. */
export function resolveCardImage(
  p: Project & { project_images?: { slot_key: string; url: string }[] },
  index: number,
): string {
  if (!isProjectReady(p)) return COMING_SOON_IMAGE;
  return (
    p.main_image ??
    p.project_images?.find((img) => img.slot_key === 'hero')?.url ??
    FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  );
}

export interface ProjectNeighbor {
  title: string;
  href: string;
}

/**
 * Prev/next navigation across ONLY the ready projects, in sort order.
 * Pending projects are skipped, so the arrows light up automatically as
 * case studies get published. Returns nulls when there is nowhere to go.
 */
export function getReadyNeighbors(
  all: Project[],
  currentSlug: string,
  lang: 'es' | 'en',
): { prev: ProjectNeighbor | null; next: ProjectNeighbor | null } {
  const ready = [...all]
    .filter(isProjectReady)
    .sort((a, b) => a.sort_order - b.sort_order);

  const idx = ready.findIndex((p) => p.slug === currentSlug);
  if (idx === -1) return { prev: null, next: null };

  const base = lang === 'en' ? '/en/projects/' : '/proyectos/';
  const toNeighbor = (p: Project | undefined): ProjectNeighbor | null =>
    p ? { title: lang === 'en' ? p.title_en : p.title_es, href: `${base}${p.slug}` } : null;

  return {
    prev: toNeighbor(ready[idx - 1]),
    next: toNeighbor(ready[idx + 1]),
  };
}

export interface RelatedCard {
  title: string;
  category: string;
  image: string;
  href: string;
  ready: boolean;
}

/**
 * The next `count` projects after the current one (wrapping around), for the
 * "more projects" strip at the bottom of a case study. Includes pending
 * projects — they render as non-clickable "coming soon" cards.
 */
export function getRelatedProjects(
  all: (Project & { project_images?: { slot_key: string; url: string }[] })[],
  currentSlug: string,
  lang: 'es' | 'en',
  count = 2,
): RelatedCard[] {
  const sorted = [...all].sort((a, b) => a.sort_order - b.sort_order);
  const idx = sorted.findIndex((p) => p.slug === currentSlug);
  const rotated = idx === -1 ? sorted : [...sorted.slice(idx + 1), ...sorted.slice(0, idx)];
  const base = lang === 'en' ? '/en/projects/' : '/proyectos/';

  return rotated.slice(0, count).map((p, i) => ({
    title: lang === 'en' ? p.title_en : p.title_es,
    category: lang === 'en' ? p.category_en : p.category_es,
    image: resolveCardImage(p, i),
    href: `${base}${p.slug}`,
    ready: isProjectReady(p),
  }));
}
