// Single source of truth for cross-locale URL mapping.
//
// The site serves ES without a prefix and EN under /en, and the projects
// segment is localized (proyectos <-> projects). Given any pathname, this
// returns its equivalent URL in both locales — used by SEO.astro for the
// canonical/hreflang tags and by Sidebar.astro for the language switcher, so
// the two can never drift apart.
export interface LocaleAlternates {
  es: string;
  en: string;
}

export function getLocaleAlternates(pathname: string): LocaleAlternates {
  if (pathname.startsWith('/en/projects/')) {
    const slug = pathname.replace('/en/projects/', '');
    return { es: `/proyectos/${slug}`, en: `/en/projects/${slug}` };
  }
  if (pathname.startsWith('/proyectos/')) {
    const slug = pathname.replace('/proyectos/', '');
    return { es: `/proyectos/${slug}`, en: `/en/projects/${slug}` };
  }
  if (pathname === '/cv' || pathname === '/en/cv') {
    return { es: '/cv', en: '/en/cv' };
  }
  if (pathname === '/proyectos' || pathname === '/en/projects') {
    return { es: '/proyectos', en: '/en/projects' };
  }
  return { es: '/', en: '/en/' };
}
