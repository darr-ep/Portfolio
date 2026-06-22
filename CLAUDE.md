# CLAUDE.md — portfolio-v2

Project-level guidance for AI agents working on this repo. This is the cross-machine memory: engram is local to a single machine, so anything an agent must know on a fresh clone lives HERE.

## What this is

Personal portfolio for Edson Pedraza. Astro 6 in SSR mode with a Node standalone adapter. Heavy motion design: GSAP + Lenis smooth scroll, Astro `ClientRouter` view transitions, Three.js/postprocessing for visual effects. Content (projects, timeline, technologies) is backed by Supabase and editable through a private admin area. Contact form sends mail via Resend.

## Stack

- **Astro 6** — `output: 'server'`, `@astrojs/node` (standalone). See `astro.config.mjs`.
- **i18n** — `es` (default, no prefix) and `en` (`/en/...`). `prefixDefaultLocale: false`.
- **React 19** — `@astrojs/react` for interactive islands only.
- **GSAP 3** — all scroll/timeline animation. Centralized in `src/lib/animations.ts`. `noExternal: ['gsap']` in Vite SSR config.
- **Lenis** — smooth scroll lifecycle, also in `animations.ts`.
- **Three.js + postprocessing** — visual effects.
- **Supabase** (`@supabase/ssr`) — data + auth for the admin area.
- **Resend** — transactional email from the contact form.
- **pnpm** — package manager. Node `>=22.12.0`.

## Commands

```sh
pnpm install      # install deps
pnpm dev          # dev server at localhost:4321
pnpm build        # production build (also compiles client scripts — use this to verify)
pnpm preview      # preview the production build
```

**Verification build:** run `pnpm build`. It compiles client scripts and catches most breakage. Avoid `astro check` — it prompts to install `@astrojs/check` interactively, which blocks non-interactive runs.

## Environment variables

Required (see `.env.example`, not committed):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only, never expose
- `RESEND_API_KEY`

`.env` is gitignored. Never commit secrets.

## Conventions

- **Replies to the user**: warm Rioplatense Spanish (voseo).
- **All artifacts** (code, identifiers, comments, UI copy, commit messages, docs): **English.**
- **Commits**: Conventional Commits. **No `Co-Authored-By` / no AI attribution.**
- **Git identity** on this repo: `darr-ep` / `darr.pedraz@gmail.com`. Set with `git config user.name`/`user.email` after cloning if not inherited globally.
- Verify before asserting. If the user is wrong, explain the technical why with evidence.

## Architecture notes

### Page transitions
`src/layouts/BaseLayout.astro` orchestrates everything: `astro:before-swap` / `astro:after-swap` / `astro:page-load`, a global click handler (`__runNavTransition`, hash scroll, lang switch), and the Venetian-blind curtain (`.pt-blind`). The motion logic (exit/enter animations, section inits, FlowingMenu) lives in `src/lib/animations.ts`. View-transition CSS rules are consolidated in `src/styles/global.css`.

### Projects section
`src/components/public/Projects.astro` uses an interactive **FlowingMenu** (no scroll pin — the pin was the source of jank and was removed). Hover shows a transient ribbon; click SELECTS (swaps the 3D card + expands); the 3D card / "Ver más" OPENS the project. Double-layer parallax: outer ribbon and inner content enter from OPPOSITE edges and meet at 0. Horizontal scroll is driven by GSAP (`xPercent`, `width: max-content`), not CSS.

## Gotchas (learned the hard way)

- **Lenis `force: true`**: `lenis.scrollTo()` is ignored when Lenis is stopped/locked (the Splash calls `lenis.stop()`). Always pass `force: true` and call `l.start()` before scrolling programmatically.
- **GSAP %-transform px bug**: GSAP reads the initial transform from the computed matrix in **pixels**, not %. If CSS sets `translateY(101%)` and you then animate `yPercent`, GSAP adds a phantom px offset. Fix: normalize first with `gsap.set(el, { yPercent: X, y: 0 })`.
- **Pinned section + scroll-to**: to scroll to a section, filter `ScrollTrigger` by `t.pin` — not just any trigger on the element. Animation triggers with `start: 'top center'` are NOT the element's top position.
- **HMR + animations.ts**: Vite's HMR leaves stale listeners after editing `animations.ts`. After such changes, hard reload (`Ctrl+Shift+R`).

## Pending work — page transitions

Bugs identified but not yet confirmed fixed (verify in browser before touching code):

1. **Double enter animation** — entering a project/CV plays the enter animation twice. Prior patch: `gsap.set` instead of `fromTo` in `astro:after-swap`.
2. **"Back to projects"** — should return to the project's section, not the hero. Projects is no longer pinned; the back-link goes to `/#proyectos`.
3. **Exit via sidebar from a project** — should show the destination label (Contact/Services) and land on that section, not the hero.
4. **Lang toggle inside a project/CV** — translation happens almost immediately and replays the enter animation twice; it should show EXIT then ENTER.

## Key files

- `src/layouts/BaseLayout.astro` — transition orchestrator.
- `src/lib/animations.ts` — centralized GSAP/Lenis module.
- `src/components/public/Projects.astro` — FlowingMenu projects section.
- `src/components/public/Sidebar.astro` — nav with `data-transition-label`, lang switcher.
- `src/components/public/Splash.astro` — splash; calls `lenis.stop()`/`start()`.
- `src/styles/global.css` — `::view-transition` rules, Lenis CSS.
- `src/pages/` — routes; `proyectos/[slug]`, `cv`, `en/` mirror, `admin/` (private), `api/contact.ts`.
