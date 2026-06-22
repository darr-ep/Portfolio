# Portfolio — Edson Pedraza

Personal portfolio built with Astro in SSR mode, featuring motion-driven page transitions, smooth scroll, and a Supabase-backed content layer with a private admin area.

🌐 **Live:** [edsonpedraza.com](https://edsonpedraza.com)

## Features

- **Server-side rendering** with the Astro Node adapter (standalone).
- **Bilingual** (Spanish / English) via Astro's built-in i18n.
- **Motion design** — GSAP timelines, Lenis smooth scroll, and Astro view transitions for seamless page navigation.
- **Three.js** visual effects with postprocessing.
- **Dynamic content** — projects, timeline, and technologies managed through Supabase and editable from a private admin dashboard.
- **Contact form** powered by Resend.
- **SEO** — JSON-LD schemas, custom sitemap, and print-friendly CV page.

## Tech stack

| Area        | Tech                                              |
| ----------- | ------------------------------------------------- |
| Framework   | [Astro 6](https://astro.build) (SSR, Node adapter)|
| UI islands  | React 19                                          |
| Animation   | GSAP 3, Lenis                                      |
| 3D / FX     | Three.js, postprocessing                          |
| Data & Auth | Supabase (`@supabase/ssr`)                        |
| Email       | Resend                                            |
| Tooling     | pnpm, TypeScript                                  |

## Getting started

**Prerequisites:** Node `>=22.12.0` and [pnpm](https://pnpm.io).

```sh
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# then fill in the values (see below)

# 3. Start the dev server
pnpm dev
```

The site runs at `http://localhost:4321`.

### Environment variables

| Variable                    | Description                                  |
| --------------------------- | -------------------------------------------- |
| `SUPABASE_URL`              | Supabase project URL                         |
| `SUPABASE_ANON_KEY`         | Supabase anon (public) key                   |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `RESEND_API_KEY`            | Resend API key for the contact form          |

## Commands

| Command        | Action                                       |
| -------------- | -------------------------------------------- |
| `pnpm dev`     | Start the dev server at `localhost:4321`     |
| `pnpm build`   | Build for production to `./dist/`            |
| `pnpm preview` | Preview the production build locally         |

## Project structure

```text
src/
├── components/public/   # public-facing sections (Hero, Projects, Timeline, ...)
├── layouts/             # BaseLayout (transition orchestrator), AdminLayout
├── lib/                 # animations.ts (GSAP/Lenis), supabase.ts
├── pages/               # routes — es (default), en/ mirror, admin/, api/
├── i18n/                # translation strings
└── styles/              # global.css (view transitions, Lenis)
```

## License

[MIT](./LICENSE)
