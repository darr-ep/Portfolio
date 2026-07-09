import { describe, it, expect } from 'vitest';
import type { Profile, Technology, Education, Project } from '../types/database';
import {
  SITE_URL,
  PERSON_ID,
  absoluteUrl,
  buildPersonSchema,
  buildProfilePageSchema,
  buildWebPageSchema,
  buildBreadcrumbSchema,
  buildProjectSchema,
} from './schema';

const profile: Profile = {
  id: 'p1',
  full_name: 'Edson Pedraza',
  role_es: 'Desarrollador Full Stack',
  role_en: 'Full Stack Developer',
  about_es: 'Sobre mí en español.',
  about_en: 'About me in English.',
  email: 'hi@example.com',
  phone: '+52 000',
  location_es: 'Tulancingo, MX',
  location_en: 'Tulancingo, Mexico',
  github_url: 'https://github.com/darr-ep',
  linkedin_url: 'https://linkedin.com/in/edson-pedraza',
  updated_at: '2026-06-25T21:53:31.000Z',
};

const technologies: Technology[] = [
  { id: 't1', sort_order: 1, name: 'React', category: 'frontend', icon: null, level: 5, created_at: '', updated_at: '' },
  { id: 't2', sort_order: 2, name: 'Node.js', category: 'backend', icon: null, level: 4, created_at: '', updated_at: '' },
];

const education: Education[] = [
  { id: 'e1', sort_order: 1, institution: 'Universidad X', degree_es: '', degree_en: '', period: '2020', description_es: '', description_en: '', created_at: '', updated_at: '' },
];

const project = {
  slug: 'o2-flow',
  title_es: 'O2 Flow',
  title_en: 'O2 Flow EN',
  description_es: 'Descripción es.',
  description_en: 'Description en.',
  tech: ['React Native', 'Supabase'],
  year: 2025,
  live_url: 'https://o2.example.com',
} as Project;

describe('absoluteUrl', () => {
  it('prefixes the site origin', () => {
    expect(absoluteUrl('/proyectos')).toBe(`${SITE_URL}/proyectos`);
  });
});

describe('buildPersonSchema', () => {
  it('selects Spanish fields by default and maps tech + education', () => {
    const p = buildPersonSchema(profile, technologies, education, 'es');
    expect(p['@id']).toBe(PERSON_ID);
    expect(p['jobTitle']).toBe('Desarrollador Full Stack');
    expect(p['description']).toBe('Sobre mí en español.');
    expect(p['knowsAbout']).toEqual(['React', 'Node.js']);
    expect(p['alumniOf']).toEqual([{ '@type': 'EducationalOrganization', name: 'Universidad X' }]);
    expect(p['sameAs']).toEqual([profile.github_url, profile.linkedin_url]);
  });

  it('selects English fields when lang is en', () => {
    const p = buildPersonSchema(profile, technologies, education, 'en');
    expect(p['jobTitle']).toBe('Full Stack Developer');
    expect(p['description']).toBe('About me in English.');
    expect((p['address'] as Record<string, string>).addressLocality).toBe('Tulancingo, Mexico');
  });

  it('is embeddable: carries @id but no @context', () => {
    const p = buildPersonSchema(profile, technologies, education);
    expect(p['@context']).toBeUndefined();
    expect(p['@id']).toBe(PERSON_ID);
  });

  it('omits empty optional collections and filters falsy sameAs', () => {
    const bare = { ...profile, github_url: '', linkedin_url: '' };
    const p = buildPersonSchema(bare, [], []);
    expect(p['knowsAbout']).toBeUndefined();
    expect(p['alumniOf']).toBeUndefined();
    expect(p['sameAs']).toBeUndefined();
  });
});

describe('buildProfilePageSchema', () => {
  it('wraps the person as mainEntity with a top-level @context', () => {
    const person = buildPersonSchema(profile, technologies, education);
    const page = buildProfilePageSchema(person, { url: `${SITE_URL}/`, name: 'Home', description: 'd', dateModified: profile.updated_at });
    expect(page['@context']).toBe('https://schema.org');
    expect(page['@type']).toBe('ProfilePage');
    expect(page['mainEntity']).toBe(person);
    expect(page['dateModified']).toBe(profile.updated_at);
  });

  it('omits description and dateModified when not provided', () => {
    const page = buildProfilePageSchema({}, { url: `${SITE_URL}/`, name: 'Home' });
    expect(page).not.toHaveProperty('description');
    expect(page).not.toHaveProperty('dateModified');
  });
});

describe('buildWebPageSchema', () => {
  it('defaults to WebPage and honors CollectionPage override', () => {
    expect(buildWebPageSchema({ url: 'x', name: 'n' })['@type']).toBe('WebPage');
    expect(buildWebPageSchema({ type: 'CollectionPage', url: 'x', name: 'n' })['@type']).toBe('CollectionPage');
  });
});

describe('buildBreadcrumbSchema', () => {
  it('emits 1-based positions in order', () => {
    const bc = buildBreadcrumbSchema([
      { name: 'Inicio', url: `${SITE_URL}/` },
      { name: 'Proyectos', url: `${SITE_URL}/proyectos` },
      { name: 'O2 Flow', url: `${SITE_URL}/proyectos/o2-flow` },
    ]);
    const items = bc['itemListElement'] as Array<Record<string, unknown>>;
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(items[2].name).toBe('O2 Flow');
    expect(items[0].item).toBe(`${SITE_URL}/`);
  });
});

describe('buildProjectSchema', () => {
  it('builds a CreativeWork authored by the Person via @id', () => {
    const s = buildProjectSchema(project, { url: `${SITE_URL}/proyectos/o2-flow`, image: 'img.png', lang: 'es' });
    expect(s['@type']).toBe('CreativeWork');
    expect(s['name']).toBe('O2 Flow');
    expect(s['description']).toBe('Descripción es.');
    expect(s['keywords']).toBe('React Native, Supabase');
    expect(s['dateCreated']).toBe('2025');
    expect(s['sameAs']).toBe('https://o2.example.com');
    expect((s['author'] as Record<string, unknown>)['@id']).toBe(PERSON_ID);
  });

  it('uses English fields and omits image/dateCreated when absent', () => {
    const bare = { ...project, year: null, tech: [] } as Project;
    const s = buildProjectSchema(bare, { url: 'u', lang: 'en' });
    expect(s['name']).toBe('O2 Flow EN');
    expect(s['description']).toBe('Description en.');
    expect(s).not.toHaveProperty('image');
    expect(s).not.toHaveProperty('dateCreated');
    expect(s).not.toHaveProperty('keywords');
  });
});
