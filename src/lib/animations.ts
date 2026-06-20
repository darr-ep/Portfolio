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

// ── EXIT ANIMATION ────────────────────────────────────────────────────────────
// Runs in parallel with venetian blinds closing (~0.3s).

export function exitAnimation() {
  const tl = gsap.timeline();

  // Non-hero pages get a subtle fade before the columns cover them.
  // The hero handles its own entrance; no exit animation needed there —
  // the column wipe is the only transition effect on the hero.
  if (!document.querySelector('.hero')) {
    tl.to('main > *', { opacity: 0, y: -20, duration: 0.22, ease: 'power2.in', stagger: 0.03, overwrite: true }, 0);
  }

  return tl;
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
    { y: '0%', stagger: 0.18, duration: 1, ease: 'power3.out' }, 0.4);
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

  const NUM_PROJECTS = 3;
  const positions: string[][] = [
    ['pos-center', 'pos-right', 'pos-left'],
    ['pos-left', 'pos-center', 'pos-right'],
    ['pos-right', 'pos-left', 'pos-center'],
  ];

  function setActiveProject(idx: number) {
    document.querySelectorAll('.accordion-item').forEach((item, i) => {
      const body = item.querySelector('.accordion-body') as HTMLElement | null;
      const header = item.querySelector('.accordion-header');
      if (i === idx) {
        item.classList.add('active');
        header?.setAttribute('aria-expanded', 'true');
        if (body) gsap.to(body, { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' });
      } else {
        item.classList.remove('active');
        header?.setAttribute('aria-expanded', 'false');
        if (body) gsap.to(body, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.out' });
      }
    });
    document.querySelectorAll('.visual-card-front').forEach((card, i) => {
      card.className = `visual-card-front ${positions[idx][i]}`;
    });
    document.querySelectorAll('.visual-card-back').forEach((card, i) => {
      card.className = `visual-card-back ${positions[idx][i]}`;
    });
  }

  gsap.set('.accordion-item:not(.active) .accordion-body', { height: 0, opacity: 0 });
  gsap.set('.accordion-item.active .accordion-body', { height: 'auto', opacity: 1 });

  projectsMM = gsap.matchMedia();

  projectsMM.add('(min-width: 993px)', () => {
    let currentActiveIdx = 0;
    const projectsST = ScrollTrigger.create({
      trigger: '.projects-section',
      pin: true,
      start: 'top top',
      end: '+=150%',
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const idx = Math.min(Math.floor(self.progress * NUM_PROJECTS), NUM_PROJECTS - 1);
        if (idx !== currentActiveIdx) {
          currentActiveIdx = idx;
          setActiveProject(idx);
        }
      },
    });

    document.querySelectorAll('.accordion-header').forEach((header) => {
      header.addEventListener('click', () => {
        const item = header.closest('.accordion-item');
        if (!item) return;
        const idx = parseInt(item.getAttribute('data-index') ?? '0', 10);
        const start = projectsST.start;
        const end = projectsST.end;
        const centers = [0.15, 0.5, 0.85];
        const targetScroll = start + (end - start) * centers[idx];
        if ((window as any).lenis) {
          (window as any).lenis.scrollTo(targetScroll, { duration: 1.0 });
        } else {
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      });
      header.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
          (header as HTMLElement).click();
        }
      });
    });

    return () => { projectsST.kill(); };
  });

  projectsMM.add('(max-width: 992px)', () => {
    const items = document.querySelectorAll('.accordion-item');
    items.forEach((item, i) => {
      const body = item.querySelector('.accordion-body') as HTMLElement | null;
      if (body) {
        body.style.height = i === 0 ? 'auto' : '0';
        body.style.opacity = i === 0 ? '1' : '0';
      }
    });
    items.forEach((item) => {
      const header = item.querySelector('.accordion-header');
      header?.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        items.forEach((other) => {
          other.classList.remove('active');
          const otherBody = other.querySelector('.accordion-body') as HTMLElement | null;
          if (otherBody) { otherBody.style.height = '0'; otherBody.style.opacity = '0'; }
        });
        if (!isActive) {
          item.classList.add('active');
          const body = item.querySelector('.accordion-body') as HTMLElement | null;
          if (body) { body.style.height = 'auto'; body.style.opacity = '1'; }
        }
      });
    });
  });
}

export function initTimeline() {
  if (!document.querySelector('.timeline')) return;

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

export function initPageAnimations() {
  initMarquee();
  initProjects();
  initTimeline();
  initDetails();
  initContact();
}
