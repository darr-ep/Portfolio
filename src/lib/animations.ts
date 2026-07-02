import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import CustomEase from 'gsap/CustomEase';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, CustomEase);
gsap.ticker.lagSmoothing(0);

export { ScrollTrigger };

// ── LENIS ─────────────────────────────────────────────────────────────────────

let lenis: Lenis | null = null;
let lenisTickerFn: ((time: number) => void) | null = null;

export function createLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenisTickerFn = (time: number) => { lenis!.raf(time * 1000); };
  gsap.ticker.add(lenisTickerFn);
  lenis.on('scroll', () => ScrollTrigger.update());
  (window as any).lenis = lenis;
}

export function destroyLenis() {
  if (lenisTickerFn) { gsap.ticker.remove(lenisTickerFn); lenisTickerFn = null; }
  lenis?.destroy();
  lenis = null;
  (window as any).lenis = null;
}

// ── PAGE CLEANUP ──────────────────────────────────────────────────────────────

let projectsMM: gsap.MatchMedia | null = null;

export function killPageAnimations() {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  projectsMM?.kill();
  projectsMM = null;
}

// ── ENTER ANIMATION ───────────────────────────────────────────────────────────
// Runs in astro:page-load — blinds are still opening, content animates in behind them.

export function enterAnimation() {
  const tl = gsap.timeline({ delay: 0.05 });

  if (document.querySelector('.hero')) {
    tl.fromTo('.sidebar',
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' }, 0);
    tl.fromTo('.img-bg',
      { opacity: 0, scale: 1.05 },
      { opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out' }, 0.1);
    tl.fromTo('.header-name',
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.15);
    tl.fromTo('.img-fg',
      { opacity: 0, x: 15 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, 0.2);
    tl.fromTo('.title-inner',
      { y: '100%' },
      { y: '0%', stagger: 0.15, duration: 0.8, ease: 'power3.out' }, 0.25);
    tl.fromTo('.spotify-slot',
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, 0.5);
    tl.fromTo('.scroll-explore',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4 }, 0.55);
  }

  return tl;
}

// First-page hero entrance triggered by splash:complete
export function heroEnterFromSplash() {
  const tl = gsap.timeline();
  tl.fromTo('.sidebar',
    { opacity: 0, x: -20 },
    { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, 0);
  tl.fromTo('.img-bg',
    { scale: 1.08, opacity: 0 },
    { scale: 1, opacity: 1, duration: 1.8, ease: 'power2.out' }, 0);
  tl.fromTo('.header-name',
    { opacity: 0, y: -10 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.2);
  tl.fromTo('.img-fg',
    { x: 30, scale: 1.05, opacity: 0 },
    { x: 0, scale: 1, opacity: 1, duration: 1.6, ease: 'power2.out' }, 0.2);
  tl.fromTo('.title-inner',
    { y: '100%' },
    { y: '0%', stagger: 0.18, duration: 1, ease: 'power3.out' }, 0);
  tl.fromTo('.spotify-slot',
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' }, 0.6);
  tl.fromTo('.scroll-explore',
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.7 }, 0.7);
  return tl;
}

// ── SECTION ANIMATIONS ────────────────────────────────────────────────────────

export function initMarquee() {
  if (!document.querySelector('.marquee-inner')) return;
  gsap.to('.marquee-inner', {
    x: '-61%',
    ease: 'none',
    scrollTrigger: {
      trigger: '.marquee',
      scrub: 0.6,
      start: 'top bottom',
      end: 'bottom top',
      invalidateOnRefresh: true,
    },
  });
}

export function initProjects() {
  if (!document.querySelector('.projects-section')) return;

  const items = Array.from(document.querySelectorAll<HTMLElement>('.accordion-item'));
  const headers = Array.from(document.querySelectorAll<HTMLAnchorElement>('.accordion-header'));
  const frontCards = Array.from(document.querySelectorAll<HTMLElement>('.visual-card-front'));
  const backCards = Array.from(document.querySelectorAll<HTMLElement>('.visual-card-back'));

  // Generalized 3D layout: active card centers, earlier cards stack left, later stack right.
  const posClass = (i: number, active: number) =>
    i === active ? 'pos-center' : i < active ? 'pos-left' : 'pos-right';

  const marquees = headers.map((h) => h.querySelector<HTMLElement>('.flow-marquee'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activeIdx = 0;
  // Selection (click) changes the active project: visualizer card + expanded details.
  // The flowing strip is NOT tied to this — it's a hover-only decoration (see below).
  function setActiveProject(idx: number) {
    if (idx === activeIdx && items[idx]?.classList.contains('active')) return;
    activeIdx = idx;
    items.forEach((item, i) => {
      const on = i === idx;
      const body = item.querySelector<HTMLElement>('.accordion-body');
      item.classList.toggle('active', on);
      if (body) gsap.to(body, { height: on ? 'auto' : 0, opacity: on ? 1 : 0, duration: 0.4, ease: 'power2.out' });
    });
    frontCards.forEach((card, i) => { card.className = `visual-card-front ${posClass(i, idx)}`; });
    backCards.forEach((card, i) => { card.className = `visual-card-back ${posClass(i, idx)}`; });
  }

  gsap.set('.accordion-item:not(.active) .accordion-body', { height: 0, opacity: 0 });
  gsap.set('.accordion-item.active .accordion-body', { height: 'auto', opacity: 1 });
  // Normalize the strips with a GSAP-owned transform (y:0, yPercent:101) so later yPercent
  // tweens are not offset by the pixel value GSAP reads from the CSS translateY(101%) matrix.
  marquees.forEach((m) => { if (m) gsap.set(m, { yPercent: 101, y: 0 }); });

  // Clicking a title SELECTS the project (does not navigate). Opening happens via the
  // "Ver más" link or the centered 3D card.
  headers.forEach((header, i) => {
    header.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveProject(i);
    });
  });

  // Clicking the centered 3D card opens the active project via the page transition.
  const visuals = document.querySelector<HTMLElement>('.projects-visuals');
  const onVisualsClick = () => {
    const header = headers[activeIdx];
    const run = (window as any).__runNavTransition;
    // Pending ("coming soon") projects have no href — never navigate to them.
    if (header && run && header.getAttribute('href')) run(header.href, header.getAttribute('data-transition-label') ?? undefined);
  };
  visuals?.addEventListener('click', onVisualsClick);

  projectsMM = gsap.matchMedia();

  // Desktop only: flowing-menu strip on hover (transient) + visualizer tilt.
  projectsMM.add('(min-width: 993px)', () => {
    const cleanups: Array<() => void> = [];

    const SCROLL_SECONDS = 20;
    const STRIP_TWEEN = { duration: 0.6, ease: 'expo.out' };

    headers.forEach((header, i) => {
      const marquee = marquees[i];
      if (!marquee) return;
      const inner = marquee.querySelector<HTMLElement>('.flow-marquee__inner');
      if (!inner) return;

      // Continuous horizontal scroll via GSAP — content is duplicated (8 units), so -50% loops
      // seamlessly. Driving it with GSAP (not CSS) lets the same element also do the vertical
      // parallax below without a transform conflict.
      const scrollTween = reduce
        ? null
        : gsap.to(inner, { xPercent: -50, duration: SCROLL_SECONDS, ease: 'none', repeat: -1 });

      // Strip enters/exits from the edge nearest the cursor (top: -101%, bottom: 101%).
      const edge = (e: MouseEvent) => {
        const r = header.getBoundingClientRect();
        return e.clientY - r.top < r.height / 2 ? -101 : 101;
      };
      // Outer cover and inner content slide from OPPOSITE edges and meet at 0 — the counter-move
      // is what gives the flowing menu its parallax depth.
      const onEnter = (e: MouseEvent) => {
        const ed = edge(e);
        gsap.killTweensOf(marquee);
        gsap.killTweensOf(inner, 'yPercent');
        if (reduce) { gsap.set(marquee, { yPercent: 0, y: 0 }); return; }
        gsap.timeline({ defaults: STRIP_TWEEN })
          .set(marquee, { yPercent: ed, y: 0 }, 0)
          .set(inner, { yPercent: -ed, y: 0 }, 0)
          .to([marquee, inner], { yPercent: 0 }, 0);
      };
      const onLeave = (e: MouseEvent) => {
        const ed = edge(e);
        gsap.killTweensOf(marquee);
        gsap.killTweensOf(inner, 'yPercent');
        if (reduce) { gsap.set(marquee, { yPercent: 101, y: 0 }); return; }
        gsap.timeline({ defaults: STRIP_TWEEN })
          .to(marquee, { yPercent: ed }, 0)
          .to(inner, { yPercent: -ed }, 0);
      };
      header.addEventListener('mouseenter', onEnter);
      header.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        header.removeEventListener('mouseenter', onEnter);
        header.removeEventListener('mouseleave', onLeave);
        scrollTween?.kill();
      });
    });

    // Parallax tilt on the front card layer following the cursor.
    const frontLayer = document.querySelector<HTMLElement>('.visuals-layer-front');
    if (visuals && frontLayer && !reduce) {
      const onMove = (e: MouseEvent) => {
        const r = visuals.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(frontLayer, { rotateY: px * 10, rotateX: -py * 10, duration: 0.5, ease: 'power2.out' });
      };
      const onLeave = () => gsap.to(frontLayer, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power2.out' });
      visuals.addEventListener('mousemove', onMove);
      visuals.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        visuals.removeEventListener('mousemove', onMove);
        visuals.removeEventListener('mouseleave', onLeave);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  });
}

export function initTimeline() {
  if (!document.querySelector('.timeline-line-fill')) return;

  gsap.set('.timeline-line-fill', { scaleY: 0 });
  gsap.to('.timeline-line-fill', {
    scaleY: 1,
    transformOrigin: 'top center',
    ease: 'none',
    scrollTrigger: {
      trigger: '.timeline',
      scrub: true,
      start: 'top center',
      end: 'bottom center',
    },
  });
  gsap.from('.timeline-item', {
    opacity: 0,
    y: 30,
    stagger: 0.2,
    scrollTrigger: {
      trigger: '.timeline',
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: 0.5,
    },
  });
}

export function initDetails() {
  if (!document.querySelector('.details-section')) return;

  gsap.set('.reveal-details-left', { opacity: 0, x: -50 });
  gsap.set('.reveal-details-right', { opacity: 0, x: 50 });
  gsap.to('.reveal-details-left', {
    opacity: 1, x: 0, duration: 1.4, ease: 'power3.out',
    scrollTrigger: { trigger: '.details-layout', start: 'top 80%' },
  });
  gsap.to('.reveal-details-right', {
    opacity: 1, x: 0, duration: 1.4, ease: 'power3.out',
    scrollTrigger: { trigger: '.details-layout', start: 'top 80%' },
  });
}

export function initContact() {
  if (!document.querySelector('.contact-section')) return;

  gsap.set('.reveal-contact-info', { opacity: 0, y: 50 });
  gsap.set('.reveal-contact-form', { opacity: 0, y: 50 });
  gsap.to('.reveal-contact-info', {
    opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.contact-layout', start: 'top 85%' },
  });
  gsap.to('.reveal-contact-form', {
    opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.contact-layout', start: 'top 85%' },
  });
}

function initPixelBlastFade() {
  const wrap = document.querySelector<HTMLElement>('.pixelblast-wrap');
  if (!wrap) return;
  gsap.to(wrap, {
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '40% top',
      scrub: true,
    },
  });
}

export function initPageAnimations() {
  initMarquee();
  initProjects();
  initTimeline();
  initDetails();
  initContact();
  initPixelBlastFade();
}
