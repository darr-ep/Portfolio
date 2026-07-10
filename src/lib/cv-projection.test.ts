import { describe, it, expect } from 'vitest';
import { projectCvProjects, CV_IMPACT_SLOTS, type CvProjectRow } from './cv-projection';

const baseRow: CvProjectRow = {
  title_es: 'O2 Flow',
  title_en: 'O2 Flow EN',
  tagline_es: 'Tagline es.',
  tagline_en: 'Tagline en.',
  tech: ['React Native', 'Supabase'],
  cv_visible: true,
  cv_problem_es: 'El equipo perdía tiempo coordinando turnos.',
  cv_problem_en: 'The team wasted time coordinating shifts.',
  cv_impact_es: [
    { lead: '30%', body: 'menos tiempo de coordinación' },
    { lead: '2x', body: 'más turnos cubiertos' },
  ],
  cv_impact_en: [
    { lead: '30%', body: 'less coordination time' },
    { lead: '2x', body: 'more shifts covered' },
  ],
};

function row(overrides: Partial<CvProjectRow>): CvProjectRow {
  return { ...baseRow, ...overrides };
}

describe('projectCvProjects — visibility filter', () => {
  it('keeps only rows where cv_visible === true', () => {
    const rows = [
      row({ title_es: 'Visible', cv_visible: true }),
      row({ title_es: 'Hidden false', cv_visible: false }),
      row({ title_es: 'Hidden null', cv_visible: null }),
    ];

    const result = projectCvProjects(rows, 'es');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Visible');
  });

  it('excludes rows where cv_visible is undefined-like (falsy, not strictly true)', () => {
    const rows = [row({ cv_visible: 0 as unknown as boolean })];

    const result = projectCvProjects(rows, 'es');

    expect(result).toHaveLength(0);
  });
});

describe('projectCvProjects — locale resolution', () => {
  it('picks the _es fields when lang is es', () => {
    const [view] = projectCvProjects([row({})], 'es');

    expect(view.title).toBe('O2 Flow');
    expect(view.tagline).toBe('Tagline es.');
    expect(view.problem).toBe('El equipo perdía tiempo coordinando turnos.');
  });

  it('picks the _en fields when lang is en', () => {
    const [view] = projectCvProjects([row({})], 'en');

    expect(view.title).toBe('O2 Flow EN');
    expect(view.tagline).toBe('Tagline en.');
    expect(view.problem).toBe('The team wasted time coordinating shifts.');
  });

  it('resolves null tagline to an empty string', () => {
    const [view] = projectCvProjects([row({ tagline_es: null })], 'es');

    expect(view.tagline).toBe('');
  });

  it('resolves null problem to an empty string', () => {
    const [view] = projectCvProjects([row({ cv_problem_es: null })], 'es');

    expect(view.problem).toBe('');
  });

  it('trims whitespace-only problem text down to an empty string', () => {
    const [view] = projectCvProjects([row({ cv_problem_es: '   ' })], 'es');

    expect(view.problem).toBe('');
  });

  it('falls back to an empty tech array when tech is null', () => {
    const [view] = projectCvProjects([row({ tech: null })], 'es');

    expect(view.tech).toEqual([]);
  });
});

describe('projectCvProjects — impact bullet normalization', () => {
  it('coerces a non-array cv_impact into an empty list', () => {
    const [view] = projectCvProjects([row({ cv_impact_es: null })], 'es');

    expect(view.impact).toEqual([]);
  });

  it('coerces a malformed object cv_impact into an empty list', () => {
    const [view] = projectCvProjects([row({ cv_impact_es: { not: 'an array' } })], 'es');

    expect(view.impact).toEqual([]);
  });

  it('skips non-object entries within the array', () => {
    const [view] = projectCvProjects(
      [row({ cv_impact_es: ['nope', 42, null, { lead: '30%', body: 'menos tiempo' }] })],
      'es',
    );

    expect(view.impact).toEqual([{ lead: '30%', body: 'menos tiempo' }]);
  });

  it('drops entries where both lead and body are empty or whitespace', () => {
    const [view] = projectCvProjects(
      [
        row({
          cv_impact_es: [
            { lead: '', body: '' },
            { lead: '   ', body: '   ' },
            { lead: '30%', body: '' },
            { lead: '', body: 'valid body only' },
          ],
        }),
      ],
      'es',
    );

    expect(view.impact).toEqual([
      { lead: '30%', body: '' },
      { lead: '', body: 'valid body only' },
    ]);
  });

  it('trims lead and body text', () => {
    const [view] = projectCvProjects(
      [row({ cv_impact_es: [{ lead: '  30%  ', body: '  menos tiempo  ' }] })],
      'es',
    );

    expect(view.impact).toEqual([{ lead: '30%', body: 'menos tiempo' }]);
  });

  it('coerces missing lead/body fields on an otherwise valid object to empty strings', () => {
    const [view] = projectCvProjects([row({ cv_impact_es: [{ lead: '30%' }] })], 'es');

    expect(view.impact).toEqual([{ lead: '30%', body: '' }]);
  });

  it('preserves the order of valid bullets', () => {
    const [view] = projectCvProjects(
      [
        row({
          cv_impact_es: [
            { lead: '1st', body: 'a' },
            { lead: '2nd', body: 'b' },
            { lead: '3rd', body: 'c' },
          ],
        }),
      ],
      'es',
    );

    expect(view.impact.map((b) => b.lead)).toEqual(['1st', '2nd', '3rd']);
  });

  it('caps the impact list at CV_IMPACT_SLOTS entries', () => {
    expect(CV_IMPACT_SLOTS).toBe(4);

    const [view] = projectCvProjects(
      [
        row({
          cv_impact_es: [
            { lead: '1', body: 'a' },
            { lead: '2', body: 'b' },
            { lead: '3', body: 'c' },
            { lead: '4', body: 'd' },
            { lead: '5', body: 'e' },
          ],
        }),
      ],
      'es',
    );

    expect(view.impact).toHaveLength(4);
    expect(view.impact.map((b) => b.lead)).toEqual(['1', '2', '3', '4']);
  });
});

describe('projectCvProjects — ordering across rows', () => {
  it('preserves the input row order (caller is responsible for sort_order)', () => {
    const rows = [
      row({ title_es: 'First' }),
      row({ title_es: 'Second' }),
      row({ title_es: 'Third' }),
    ];

    const result = projectCvProjects(rows, 'es');

    expect(result.map((v) => v.title)).toEqual(['First', 'Second', 'Third']);
  });
});
