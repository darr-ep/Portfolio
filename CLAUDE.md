# CLAUDE.md — portfolio-v2

Project-level guidance for AI agents working on this repo. This is the cross-machine memory: engram is local to a single machine, so anything an agent must know on a fresh clone lives HERE.

## What this is

Personal portfolio for Edson Pedraza. Astro 7 in SSR mode with a Node standalone adapter. Heavy motion design: GSAP + Lenis smooth scroll, Astro `ClientRouter` view transitions, Three.js/postprocessing for visual effects. Content (projects, timeline, technologies) is backed by Supabase and editable through a private admin area. Contact form sends mail via Resend.

## Stack

- **Astro 7** — `output: 'server'`, `@astrojs/node` (standalone). See `astro.config.mjs`.
- **Fonts** — self-hosted via Astro's native Fonts API (`fonts: [...]` in `astro.config.mjs`, `<Font>` in `BaseLayout` head). NOT a Google Fonts `@import` — that caused FOUT (weight visibly changed when the web font swapped in over the system fallback, worst on `font-weight: 200`). CSS vars `--font-heading` etc. reference each font's `cssVariable`.
  - **Declare EVERY weight the site uses (100–900) per font** in the config. The Fonts API only generates the declared weights; any undeclared weight (the site uses 500/600/700/900 heavily) falls back to Astro's metric fallback (Arial) and renders as the wrong typeface. To audit: `rg -o 'font-weight:\s*\d+' -I src`. `styles: ['normal']` for the sans fonts (only Cormorant uses italic). No `<Font preload>`: many weights × preload = preload-everything + console warnings; @font-face are inline and files local, so the browser fetches only used weights.
  - Verify generated faces with `node ./dist/server/entry.mjs` (the dev server is an Astro 7 background daemon that won't spawn in non-TTY shells) then `curl localhost:PORT | rg 'font-weight'`.
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

### Page transitions — current design (fully rewritten 2026-06-22)

`src/layouts/BaseLayout.astro` is the complete orchestrator. All logic lives in a single `<script>` block guarded by `__appInitialized` to survive HMR without re-registering listeners.

**Key state variables:**
- `_isTransitioning` — lock to prevent concurrent transitions
- `_nav: { label, useLogo, ready }` — in-flight nav descriptor; `ready()` is the resolver of `pageReady`
- `MIN_COVER_MS = 1000` — minimum cover duration; prevents fast loads from cutting the exit short

**Two-timeline architecture:**
- **EXIT timeline** — owned by `runNavTransition`. Fades in label/logo with GSAP (`gsap.to(el, { opacity: 1 })`), covers screen with `.pt-blind` columns, then calls `navigate(href)`.
- **REVEAL timeline** — one GSAP timeline, fires only when `Promise.all([pageReady, minTime])` resolves. `pageReady` is set by `astro:page-load` (gated on hero-image `decode()` + 2 rAFs); `minTime` is a `gsap.delayedCall` of 1s. Sequence: fade the cue out (`opacity → 0`, 0.25s), THEN at +0.25s open the blinds + call `enterAnimation()` — so enter's heavy hero work can't share a frame with the fade.

**Label/logo opacity is 100% GSAP (NOT CSS) — updated 2026-06-23.** Earlier the cue used a CSS `.pt-show` class + `transition: opacity 0.2s`. That was REVERTED: a CSS opacity transition needs a main-thread style recalc to START, so a stall at the reveal frame skipped it and snapped the cue to opacity 0 ("text disappears without fading"). The blinds (always GSAP) never had this — so the cue is now GSAP too, the same reliable ticker.
- `ptSet(el, show)` is now just `gsap.set(el, { opacity: show ? 1 : 0 })` (instant re-assert in `after-swap`).
- No `transition` and no `.pt-show` rule on `#transition-label`/`#transition-logo` — only a base `opacity: 0`. Do NOT re-add a CSS transition there: it would re-trigger on every instant `ptSet` and flicker.

**Capture-phase click listener:**
```typescript
document.addEventListener('click', handler, true); // true = capture
```
Runs BEFORE Astro ClientRouter's bubbling listener. `preventDefault()` fires first → no double navigation.

**`lagSmoothing` management:**
- `animations.ts` sets `gsap.ticker.lagSmoothing(0)` globally for Lenis compatibility.
- `runNavTransition` sets `lagSmoothing(100, 16)` for the duration of the transition to cap per-tick advance.
- Restored to `(0)` in `onComplete` of the REVEAL timeline.

**Logo navigation:**
- Links with `data-logo-link` show the logotype (`#transition-logo`) instead of text during transition.
- Same-page logo click scrolls to top; different-page logo click triggers `runNavTransition(href, undefined, true)`.

**Label/logo show during overlay:**
- `#transition-logo` has dark/light variants: `.tl-dark` (default) / `.tl-light` (shown when `html.light`).

### Projects section
`src/components/public/Projects.astro` uses an interactive **FlowingMenu** (no scroll pin — the pin was the source of jank and was removed). Hover shows a transient ribbon; click SELECTS (swaps the 3D card + expands); the 3D card / "Ver más" OPENS the project. Double-layer parallax: outer ribbon and inner content enter from OPPOSITE edges and meet at 0. Horizontal scroll is driven by GSAP (`xPercent`, `width: max-content`), not CSS.

## Gotchas (learned the hard way)

- **Lenis `force: true`**: `lenis.scrollTo()` is ignored when Lenis is stopped/locked (the Splash calls `lenis.stop()`). Always pass `force: true` and call `l.start()` before scrolling programmatically.
- **GSAP %-transform px bug**: GSAP reads the initial transform from the computed matrix in **pixels**, not %. If CSS sets `translateY(101%)` and you then animate `yPercent`, GSAP adds a phantom px offset. Fix: normalize first with `gsap.set(el, { yPercent: X, y: 0 })`.
- **Pinned section + scroll-to**: to scroll to a section, filter `ScrollTrigger` by `t.pin` — not just any trigger on the element. Animation triggers with `start: 'top center'` are NOT the element's top position.
- **HMR + animations.ts**: Vite's HMR leaves stale listeners after editing `animations.ts`. After such changes, hard reload (`Ctrl+Shift+R`).
- **`lagSmoothing(0)` + GSAP opacity tween**: When `lagSmoothing(0)` is active, a single heavy frame (e.g. hero init on page load) causes GSAP to advance a 0.2s tween in one tick — completing it instantly. Fix: use CSS `transition` on compositor-driven properties, or temporarily set `lagSmoothing(100, 16)` around the affected animation.
- **Inline style vs. CSS class**: `gsap.set(el, { opacity: 1 })` writes `style.opacity: 1`. This beats any stylesheet `.pt-show { opacity: 1 }` rule, so removing `.pt-show` afterwards does nothing — the inline style wins. Never mix inline opacity with CSS class–driven fades on the same element.
- **ClientRouter double navigation**: Astro ClientRouter has a bubbling `click` listener on `<a>` elements. If you also have a custom click handler at the document level, BOTH fire — ClientRouter swaps at ~370ms while your cover is still closing at ~900ms. Fix: register your handler in **capture phase** so `preventDefault()` runs before ClientRouter sees the click.
- **`transition:persist` and fresh nodes**: Even with `transition:persist`, the node is NOT always reused (theme mismatch, DOM order change). Always re-assert state in `after-swap` using `ptSet` (not `gsap.set`) to handle both cases (reuse = no-op; fresh = instant re-assert without triggering the CSS fade).
- **`try/finally` in `astro:page-load`**: `_nav.ready()` MUST be called even if `initPageAnimations()` throws. Wrap the whole page-load body in `try { ... } finally { _nav?.ready(); }` — otherwise the page stays covered forever.

## Pending work — page transitions

Status as of 2026-06-22 (verify in browser on a new machine before touching code):

### ✅ Confirmed fixed
1. **Exit transition cut short on fast loads** — `Promise.all([pageReady, minTime])` gate holds reveal for ≥1s.
2. **Double enter animation** — same gate decouples reveal from Astro swap timing.
3. **Destination visible through closing blinds** — capture-phase click listener prevents double navigation.
4. **Label stuck on screen** — dual-timeline owning `_nav` state prevents orphaned state.
5. **Label flicker at transition start** — `ptSet` re-asserts state in `after-swap` without triggering the CSS fade.

### ⚠️ Re-fixed twice 2026-06-22 — was wrongly marked "confirmed fixed"
- **Label/logo fade-OUT skipped on reveal (snaps to opacity 0) + ~230ms dead-black gap + rushed entrance.** The old note claimed the CSS `transition` fade was "compositor-driven, immune to jank". **False.** A CSS opacity transition still needs a main-thread style recalc to START; if the thread stalls >200ms after `remove('pt-show')`, the 0.2s clock elapses before the first repaint, so the label jumps straight to `opacity: 0`. Confirmed from a screen recording: label visible → next frame all black (no fade) → ~230ms of dead black → blinds finally open. The fade-IN (EXIT) always worked because the main thread is free there; only the REVEAL was affected.
  - **Root cause (two converging stalls):** the reveal fired synchronously in `astro:page-load`, right after the heavy SYNCHRONOUS `initPageAnimations()` + `ScrollTrigger.refresh()`, AND `enterAnimation()` immediately tweens the hero `<img>`s (`.img-bg`/`.img-fg` = real `<img>` PNGs, class `.hero-img`) which decode on the main thread on first tick if not ready. Either stall eats the label fade + blinds' first frame.
  - **Fix 1 — gate the reveal on decode:** in the page-load `finally`, wait for `document.querySelectorAll('.hero-img')` `img.decode()` to resolve, then two `requestAnimationFrame`s, THEN resolve `pageReady`. So the reveal runs on a decoded + painted page.
  - **Fix 2 — sequence the reveal:** done, then superseded by Fix 3.
  - **Fix 3 (2026-06-23) — cue fade is now GSAP, not CSS.** Fixes 1+2 fixed the blinds/cover (user confirmed "cortina corrected completely") but the cue STILL snapped because it was still on the CSS path. Moved label/logo opacity to GSAP entirely (EXIT `gsap.to opacity 1`, REVEAL `gsap.to opacity 0` then blinds+enter at +0.25s, `ptSet` = `gsap.set opacity`). Removed the CSS `transition` + `.pt-show` rules. See "Page transitions — current design".
  - `img.decode()` waits download too (cover hides it; 8s safety remains). If detail/project pages still rush, they use a different big image — extend the `.hero-img` selector to cover their hero `<img>`.

### ✅ Fixed 2026-06-25
- **Popstate (browser back/forward) transition.** Back/forward now plays the SAME covered transition with the destination's cue, instead of a plain swap. Implementation in `BaseLayout.astro`:
  - The click EXIT/REVEAL was refactored into reusable helpers — `playExitCover(label, useLogo)` (closes the blinds, resolves a Promise, does NOT navigate), `scheduleReveal(pageReady, minTime, safetyId)`, and `beginCoveredTransition(label, useLogo)` (sets `_nav` + lagSmoothing + safety + schedules reveal). Tween values are unchanged, so click behaves identically.
  - `_pathLabels: Map<normalizedPathname, {label, useLogo}>` is populated on every `runNavTransition` (skipping hash links — they share the home pathname and would clobber the home cue). Browser back/forward to a recorded path replays its cue; home paths (`/`, `/en`) default to the logo; unknown paths cover with blinds only.
  - `astro:before-preparation` listener: only acts on `navigationType === 'traverse'` and bails if `_isTransitioning` (so our own click `navigate()` — which fires `'push'` — is never double-handled). It wraps `event.loader` (the ONLY pre-swap hook on popstate) so the blinds close BEFORE the swap, then loads under cover. The existing `if (!_nav) return` in `after-swap` now sees `_nav` set and re-asserts the covered state.
  - Known minor edge: on `traverse` ClientRouter restores the destination's prior scroll; `enterAnimation()` still runs (matches click behavior). Acceptable for now.
- **Section nav from another URL (`/cv`, `/proyectos`) landing on the hero instead of the target section.** Root cause: `createLenis()` runs in `after-swap`, then the `page-load` hash-scroll ran before any `raf` tick — Lenis's internal `limit` was still 0, so `scrollTo(Y)` clamped to 0 (top/hero). Fix: in the page-load hash block, call `l.start()` + `l.resize()` (measure the document) BEFORE `l.scrollTo(y, { immediate: true, force: true })`, computing `y` the same robust way as the same-page handler (`pin.start` for pinned sections, `rect.top + scrollY` otherwise). This also closed the older "exit via sidebar from a project" item — the sidebar already carried `data-transition-label`, the only real bug was the clamp.

### ↩︎ No longer reproducible (closed without code change)
- **"Back to projects"** — the back-link now targets the dedicated `/proyectos` index page (created after this note was written), with its own transition + "PROYECTOS" cue. The original "lands on the hero" symptom no longer applies.
- **Lang toggle inside a project/CV (double-enter)** — verified 2026-06-25 to no longer reproduce.

## Key files

- `src/layouts/BaseLayout.astro` — transition orchestrator (all logic: listeners, state, `runNavTransition`, `ptSet`).
- `src/lib/animations.ts` — centralized GSAP/Lenis module (`enterAnimation`, `initPageAnimations`, `killPageAnimations`, `createLenis`, `destroyLenis`, `heroEnterFromSplash`).
- `src/components/public/Projects.astro` — FlowingMenu projects section.
- `src/components/public/Sidebar.astro` — nav with `data-transition-label`, lang switcher.
- `src/components/public/Splash.astro` — splash; calls `lenis.stop()`/`start()`.
- `src/styles/global.css` — `::view-transition` rules, Lenis CSS.
- `src/pages/` — routes; `proyectos/[slug]`, `cv`, `en/` mirror, `admin/` (private), `api/contact.ts`.
