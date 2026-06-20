import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';

export const prerender = false;

const SITE = 'https://edsonpedraza.com';

export const GET: APIRoute = async () => {
  const { data: projects } = await supabase
    .from('projects')
    .select('slug');

  const slugs = projects?.map((p: { slug: string }) => p.slug).filter(Boolean) ?? [];

  const staticPages: Array<{ es: string; en: string | null }> = [
    { es: '/', en: '/en/' },
    { es: '/cv', en: null },
  ];

  const urlEntries: string[] = [];

  for (const page of staticPages) {
    if (page.en) {
      urlEntries.push(buildBilingual(SITE, page.es, page.en));
    } else {
      urlEntries.push(buildMono(SITE, page.es, 'es'));
    }
  }

  for (const slug of slugs) {
    urlEntries.push(buildBilingual(SITE, `/proyectos/${slug}`, `/en/projects/${slug}`));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

function buildBilingual(site: string, esPath: string, enPath: string): string {
  return `  <url>
    <loc>${site}${esPath}</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${site}${esPath}" />
    <xhtml:link rel="alternate" hreflang="en" href="${site}${enPath}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${esPath}" />
  </url>
  <url>
    <loc>${site}${enPath}</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${site}${esPath}" />
    <xhtml:link rel="alternate" hreflang="en" href="${site}${enPath}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${esPath}" />
  </url>`;
}

function buildMono(site: string, path: string, lang: string): string {
  return `  <url>
    <loc>${site}${path}</loc>
    <xhtml:link rel="alternate" hreflang="${lang}" href="${site}${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${path}" />
  </url>`;
}
