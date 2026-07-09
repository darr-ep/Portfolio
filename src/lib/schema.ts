import type { Profile, Technology, Education, Project } from '../types/database';

/**
 * JSON-LD (schema.org) builders. Pure functions with no Astro coupling: each
 * returns a plain object ready to be `JSON.stringify`'d into a
 * `<script type="application/ld+json">`. Keeping them here (not inline in the
 * SEO component) makes the structured data testable and reusable across pages.
 *
 * Design: the Person is emitted once with a stable `@id` and every other node
 * (ProfilePage.mainEntity, CreativeWork.author) references it, so search
 * engines and LLMs resolve a single canonical "Edson Pedraza" entity instead
 * of duplicated, disconnected people.
 */

export const SITE_URL = 'https://edsonpedraza.com';

/** Stable node id for the one Person entity the whole site describes. */
export const PERSON_ID = `${SITE_URL}/#person`;

const OG_IMAGE = `${SITE_URL}/assets/og-image.png`;

type Lang = 'es' | 'en';

/** Absolute URL from a site-relative path (`/proyectos/x` → full URL). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/**
 * The Person entity, built from real profile/technologies/education data.
 * `knowsAbout` (the tech list) is the highest-value field for AEO: it's what
 * an LLM parses to answer "what does this developer work with". Returned
 * WITHOUT `@context` so it can be embedded as `mainEntity` of a page node.
 */
export function buildPersonSchema(
  profile: Profile,
  technologies: Technology[],
  education: Education[],
  lang: Lang = 'es',
): Record<string, unknown> {
  const jobTitle = lang === 'en' ? profile.role_en : profile.role_es;
  const about = lang === 'en' ? profile.about_en : profile.about_es;
  const location = lang === 'en' ? profile.location_en : profile.location_es;
  const sameAs = [profile.github_url, profile.linkedin_url].filter(Boolean);

  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: profile.full_name,
    ...(jobTitle ? { jobTitle } : {}),
    ...(about ? { description: about } : {}),
    ...(profile.email ? { email: profile.email } : {}),
    url: SITE_URL,
    image: OG_IMAGE,
    ...(location
      ? { address: { '@type': 'PostalAddress', addressLocality: location } }
      : {}),
    ...(technologies.length ? { knowsAbout: technologies.map((t) => t.name) } : {}),
    ...(education.length
      ? {
          alumniOf: education.map((e) => ({
            '@type': 'EducationalOrganization',
            name: e.institution,
          })),
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/**
 * ProfilePage wrapping the Person as `mainEntity`. This is Google's dedicated
 * type for personal profile / portfolio home pages — the modern, recommended
 * shape for exactly this site.
 */
export function buildProfilePageSchema(
  person: Record<string, unknown>,
  opts: { url: string; name: string; description?: string; dateModified?: string },
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: opts.url,
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    mainEntity: person,
  };
}

/** Generic page node — used by listing pages that aren't a profile. */
export function buildWebPageSchema(opts: {
  type?: 'WebPage' | 'CollectionPage';
  url: string;
  name: string;
  description?: string;
  image?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': opts.type ?? 'WebPage',
    url: opts.url,
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.image ? { image: opts.image } : {}),
  };
}

/**
 * BreadcrumbList from an ordered list of crumbs. Positions are 1-based per the
 * schema.org spec; the last item is the current page.
 */
export function buildBreadcrumbSchema(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * A project case study as a CreativeWork authored by the Person (`@id`
 * reference). CreativeWork is the safe, always-valid choice for a portfolio
 * piece; `keywords` carries the tech stack for topical relevance.
 */
export function buildProjectSchema(
  project: Project,
  opts: { url: string; image?: string; lang?: Lang },
): Record<string, unknown> {
  const lang = opts.lang ?? 'es';
  const name = lang === 'en' ? project.title_en : project.title_es;
  const description = lang === 'en' ? project.description_en : project.description_es;
  const keywords = project.tech?.length ? project.tech.join(', ') : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name,
    ...(description ? { description } : {}),
    url: opts.url,
    ...(opts.image ? { image: opts.image } : {}),
    ...(project.year ? { dateCreated: String(project.year) } : {}),
    ...(project.live_url ? { sameAs: project.live_url } : {}),
    ...(keywords ? { keywords } : {}),
    author: { '@type': 'Person', '@id': PERSON_ID, name: 'Edson Pedraza' },
  };
}
