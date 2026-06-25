import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './StaggeredMenu.css';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  className?: string;
  logoUrl?: string;
  logoUrlLight?: string;
  logoHref?: string;
  /** Current locale is Spanish — controls the language toggle target/label and UI copy. */
  isEs?: boolean;
  /** Destination URL for the language switch. */
  langHref?: string;
  accentColor?: string;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

const SUN_SVG = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.77" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MOON_SVG = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#e3a857', '#1a1a1f'],
  items = [],
  socialItems = [],
  displaySocials = true,
  className,
  logoUrl = '/assets/Logo-Dark.webp',
  logoUrlLight = '/assets/Logo-Light.webp',
  logoHref = '/',
  isEs = true,
  langHref = '/en/',
  accentColor = '#e3a857',
  onMenuOpen,
  onMenuClose
}: StaggeredMenuProps) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const barTopRef = useRef<HTMLSpanElement | null>(null);
  const barMidRef = useRef<HTMLSpanElement | null>(null);
  const barBotRef = useRef<HTMLSpanElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const [isLight, setIsLight] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activePath, setActivePath] = useState('');

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const iconTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);
  const hasHeroRef = useRef(false);
  const prevVisibleRef = useRef(false);
  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);

  // Keep the theme icon in sync with the document, including across ClientRouter swaps.
  useEffect(() => {
    const sync = () => setIsLight(document.documentElement.classList.contains('light'));
    sync();
    document.addEventListener('astro:after-swap', sync);
    return () => document.removeEventListener('astro:after-swap', sync);
  }, []);

  // Track scroll position. At the hero the header is transparent and integrated; once the user
  // scrolls (or on pages with no hero) the trigger becomes a floating circular button.
  useEffect(() => {
    const update = () => setScrolled(!hasHeroRef.current || window.scrollY > 150);
    const detect = () => {
      hasHeroRef.current = !!document.querySelector('.hero');
      update();
    };
    detect();
    window.addEventListener('scroll', update, { passive: true });
    document.addEventListener('astro:after-swap', detect);
    return () => {
      window.removeEventListener('scroll', update);
      document.removeEventListener('astro:after-swap', detect);
    };
  }, []);

  // Track the current path so the active nav item gets its bullet marker.
  useEffect(() => {
    const sync = () => setActivePath((window.location.pathname.replace(/\/$/, '') || '/'));
    sync();
    document.addEventListener('astro:after-swap', sync);
    return () => document.removeEventListener('astro:after-swap', sync);
  }, []);

  // Animate the toggle button in/out on hero pages: hidden at hero top, GSAP entrance on scroll/open.
  useEffect(() => {
    const btn = toggleBtnRef.current;
    if (!btn || !hasHeroRef.current) return;
    const visible = scrolled || open;
    const wasVisible = prevVisibleRef.current;
    prevVisibleRef.current = visible;
    if (visible && !wasVisible) {
      gsap.fromTo(btn, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)', overwrite: true });
    } else if (!visible && wasVisible) {
      gsap.to(btn, {
        scale: 0.6,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        overwrite: true,
        onComplete: () => gsap.set(btn, { clearProps: 'opacity,scale' }),
      });
    }
  }, [scrolled, open]);

  const isActive = useCallback(
    (link: string) => {
      if (link.includes('#')) return false;
      try {
        const p = new URL(link, window.location.origin).pathname.replace(/\/$/, '') || '/';
        return p === activePath;
      } catch {
        return false;
      }
    },
    [activePath]
  );

  const toggleTheme = useCallback(() => {
    const next = !document.documentElement.classList.contains('light');
    document.documentElement.classList.toggle('light', next);
    try {
      localStorage.setItem('theme', next ? 'light' : 'dark');
    } catch {
      /* ignore storage failures */
    }
    setIsLight(next);
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      if (!panel) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      }

      // Hamburger bars: two outer lines offset vertically, the middle one centered.
      if (barTopRef.current) gsap.set(barTopRef.current, { y: -6, rotate: 0, transformOrigin: '50% 50%' });
      if (barMidRef.current) gsap.set(barMidRef.current, { y: 0, rotate: 0, opacity: 1, transformOrigin: '50% 50%' });
      if (barBotRef.current) gsap.set(barBotRef.current, { y: 6, rotate: 0, transformOrigin: '50% 50%' });
    });
    return () => ctx.revert();
  }, [position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
    const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];
    const controls = panel.querySelector('.sm-controls') as HTMLElement | null;

    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 8 });
    if (controls) gsap.set(controls, { opacity: 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(panel, { xPercent: panelStart }, { xPercent: 0, duration: panelDuration, ease: 'power4.out' }, panelInsertTime);

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(
        itemEls,
        { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1, from: 'start' } },
        itemsStart
      );
    }

    const footerStart = panelInsertTime + panelDuration * 0.4;
    if (controls) tl.to(controls, { opacity: 1, duration: 0.5, ease: 'power2.out' }, footerStart);
    if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, footerStart + 0.05);
    if (socialLinks.length) {
      tl.to(
        socialLinks,
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: 'power3.out',
          stagger: { each: 0.08, from: 'start' },
          onComplete: () => gsap.set(socialLinks, { clearProps: 'opacity' })
        },
        footerStart + 0.08
      );
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 8 });
        const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];
        const controls = panel.querySelector('.sm-controls') as HTMLElement | null;
        if (controls) gsap.set(controls, { opacity: 0 });
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
        busyRef.current = false;
      }
    });
  }, [position]);

  // Morph the hamburger into an X (and back) with GSAP.
  const animateIcon = useCallback((opening: boolean) => {
    const top = barTopRef.current;
    const mid = barMidRef.current;
    const bot = barBotRef.current;
    if (!top || !mid || !bot) return;
    iconTweenRef.current?.kill();
    const ease = 'power3.inOut';
    if (opening) {
      gsap.to(top, { y: 0, rotate: 45, duration: 0.4, ease, overwrite: 'auto' });
      gsap.to(mid, { opacity: 0, duration: 0.2, ease, overwrite: 'auto' });
      gsap.to(bot, { y: 0, rotate: -45, duration: 0.4, ease, overwrite: 'auto' });
    } else {
      gsap.to(top, { y: -6, rotate: 0, duration: 0.4, ease, overwrite: 'auto' });
      gsap.to(mid, { opacity: 1, duration: 0.3, ease, overwrite: 'auto' });
      gsap.to(bot, { y: 6, rotate: 0, duration: 0.4, ease, overwrite: 'auto' });
    }
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    animateIcon(target);
  }, [playOpen, playClose, animateIcon, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
      animateIcon(false);
    }
  }, [playClose, animateIcon, onMenuClose]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeMenu]);

  // Listen for hero menu trigger — the "MENU" text button embedded in the hero.
  useEffect(() => {
    const onHeroMenu = () => { if (!openRef.current) toggleMenu(); };
    window.addEventListener('hero:menu-open', onHeroMenu as EventListener);
    return () => window.removeEventListener('hero:menu-open', onHeroMenu as EventListener);
  }, [toggleMenu]);

  return (
    <div
      className={(className ? className + ' ' : '') + 'staggered-menu-wrapper fixed-wrapper'}
      style={accentColor ? { ['--sm-accent' as any]: accentColor } : undefined}
      data-position={position}
      data-open={open || undefined}
      data-scrolled={scrolled || undefined}
    >
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {(() => {
          const raw = colors && colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c'];
          let arr = [...raw];
          if (arr.length >= 3) {
            const mid = Math.floor(arr.length / 2);
            arr.splice(mid, 1);
          }
          return arr.map((c, i) => <div key={i} className="sm-prelayer" style={{ background: c }} />);
        })()}
      </div>

      <header className="staggered-menu-header" aria-label="Main navigation header">
        <a className="sm-logo" href={logoHref} aria-label="Home — Edson Pedraza" data-logo-link onClick={closeMenu}>
          <img src={logoUrl} alt="Edson Pedraza" className="sm-logo-img sm-logo-dark" draggable={false} />
          <img src={logoUrlLight} alt="Edson Pedraza" className="sm-logo-img sm-logo-light" draggable={false} />
        </a>
        <button
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="staggered-menu-panel"
          onClick={toggleMenu}
          type="button"
        >
          <span ref={iconRef} className="sm-icon" aria-hidden="true">
            <span ref={barTopRef} className="sm-bar" />
            <span ref={barMidRef} className="sm-bar" />
            <span ref={barBotRef} className="sm-bar" />
          </span>
        </button>
      </header>

      <aside id="staggered-menu-panel" ref={panelRef} className="staggered-menu-panel" aria-hidden={!open} data-lenis-prevent>
        <div className="sm-panel-inner">
          <span className="sm-panel-label">{isEs ? 'Navegación' : 'Navigation'}</span>

          <ul className="sm-panel-list" role="list">
            {items && items.length ? (
              items.map((it, idx) => (
                <li className="sm-panel-itemWrap" key={it.label + idx}>
                  <a
                    className="sm-panel-item"
                    href={it.link}
                    aria-label={it.ariaLabel}
                    aria-current={isActive(it.link) ? 'page' : undefined}
                    data-transition-label={it.label.toUpperCase()}
                    onClick={closeMenu}
                  >
                    <span className="sm-panel-itemLabel">{it.label}</span>
                  </a>
                </li>
              ))
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item">
                  <span className="sm-panel-itemLabel">No items</span>
                </span>
              </li>
            )}
          </ul>

          <div className="sm-panel-footer">
            <div className="sm-controls">
              <button
                type="button"
                className="sm-control-btn"
                aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                onClick={toggleTheme}
              >
                {isLight ? MOON_SVG : SUN_SVG}
                <span>{isLight ? (isEs ? 'Oscuro' : 'Dark') : (isEs ? 'Claro' : 'Light')}</span>
              </button>

              <a
                className="sm-control-btn lang-switcher"
                href={langHref}
                data-transition-label={isEs ? 'EN' : 'ES'}
                aria-label={isEs ? 'Switch to English' : 'Cambiar a Español'}
                onClick={closeMenu}
              >
                <span className={isEs ? 'sm-lang-opt active' : 'sm-lang-opt'}>ES</span>
                <span className="sm-lang-divider" aria-hidden="true">/</span>
                <span className={!isEs ? 'sm-lang-opt active' : 'sm-lang-opt'}>EN</span>
              </a>
            </div>

            {displaySocials && socialItems && socialItems.length > 0 && (
              <div className="sm-socials" aria-label="Social links">
                <h3 className="sm-socials-title">{isEs ? 'Redes' : 'Socials'}</h3>
                <ul className="sm-socials-list" role="list">
                  {socialItems.map((s, i) => (
                    <li key={s.label + i} className="sm-socials-item">
                      <a href={s.link} target="_blank" rel="noopener noreferrer" className="sm-socials-link">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default StaggeredMenu;
