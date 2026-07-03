// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://edsonpedraza.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), sitemap()],
  // Behind the VPS nginx proxy, the app only sees a plain-HTTP connection, so Astro's
  // security.checkOrigin (CSRF guard on POST/PUT/PATCH/DELETE) derives its own request URL as
  // http://edsonpedraza.com while the browser's real Origin header is https://edsonpedraza.com —
  // a scheme mismatch that 403s every state-changing form (e.g. admin logout). Without this,
  // Astro also ignores X-Forwarded-Host/Proto entirely (untrusted by default), even though nginx
  // already forwards them correctly.
  security: {
    allowedDomains: [
      { hostname: 'edsonpedraza.com', protocol: 'https' },
      { hostname: 'www.edsonpedraza.com', protocol: 'https' },
    ],
  },
  // Self-hosted + preloaded fonts via Astro's native Fonts API. Replaces the CSS @import of
  // Google Fonts, which loaded late and caused FOUT: until 'Albert Sans' (used at weight 200,
  // which the system fallback can't render) arrived, headings showed the heavier system sans and
  // then swapped — the "weight changes out of nowhere" bug. Self-hosting + <Font preload> serves
  // the exact weights up front, so there's no fallback flash.
  // Declare EVERY weight the site uses (100–900), per font. The previous config only declared the
  // weights from the old @import (≤400/≤600), so headings/labels at 500/600/700/900 fell back to
  // Astro's metric fallback (Arial) and rendered "wrong" — that was the regression. styles: normal
  // only (except Cormorant, the sole italic user) to avoid generating unused italic faces.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [300, 400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Outfit',
      cssVariable: '--font-outfit',
      weights: [300, 400, 500, 600, 700, 900],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Albert Sans',
      cssVariable: '--font-albert-sans',
      weights: [100, 200, 300, 400, 500, 600, 700, 900],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-cormorant',
      weights: [300, 400, 500, 600, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
    },
  ],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    ssr: {
      noExternal: ['gsap'],
    },
    server: {
      allowedHosts: ['accustom-talcum-bullseye.ngrok-free.dev'],
    },
    plugins: [
      {
        name: 'static-asset-cache-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (/\.(png|jpg|jpeg|webp|avif|svg|woff2|woff|ttf)(\?.*)?$/.test(req.url ?? '')) {
              res.setHeader('Cache-Control', 'public, max-age=3600');
            }
            next();
          });
        },
      },
    ],
  },
});
