import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';
import { renderCvPdf } from '../lib/cv-pdf';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'es';

  const [
    { data: profile },
    { data: timeline },
    { data: projects },
    { data: technologies },
    { data: education },
    { data: languages },
  ] = await Promise.all([
    supabase.from('profile').select('*').single(),
    supabase.from('timeline').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('projects')
      .select('title_es, title_en, description_es, description_en, tech')
      .order('sort_order', { ascending: true }),
    supabase.from('technologies').select('*').order('sort_order', { ascending: true }),
    supabase.from('education').select('*').order('sort_order', { ascending: true }),
    supabase.from('languages').select('*').order('sort_order', { ascending: true }),
  ]);

  const buffer = await renderCvPdf(
    {
      profile: profile ?? null,
      timeline: timeline ?? [],
      projects: projects ?? [],
      technologies: technologies ?? [],
      education: education ?? [],
      languages: languages ?? [],
    },
    lang,
  );

  const filename = lang === 'en' ? 'Edson-Pedraza-CV-EN.pdf' : 'Edson-Pedraza-CV.pdf';

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=600',
    },
  });
};
