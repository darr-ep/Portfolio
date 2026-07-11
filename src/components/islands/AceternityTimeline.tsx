import React, { useEffect, useRef, useState } from "react";

type EntryType = 'work' | 'freelance' | 'education' | 'project' | 'certification' | 'milestone';

type Entry = {
  period: string;
  company: string;
  role: string;
  description: string;
  entry_type: EntryType;
};

// Colors resolve to CSS variables (defined in global.css) so they adapt to the
// active theme. The dark set uses pastels; the light theme darkens them because
// the pale green/rose were invisible on the light background.
const TYPE_META: Record<EntryType, { es: string; en: string; cssVar: string }> = {
  work:          { es: 'TRABAJO',        en: 'WORK',          cssVar: '--tl-work' },
  freelance:     { es: 'FREELANCE',      en: 'FREELANCE',     cssVar: '--tl-freelance' },
  education:     { es: 'EDUCACIÓN',      en: 'EDUCATION',     cssVar: '--tl-education' },
  project:       { es: 'PROYECTO',       en: 'PROJECT',       cssVar: '--tl-project' },
  certification: { es: 'CERTIFICACIÓN',  en: 'CERTIFICATION', cssVar: '--tl-certification' },
  milestone:     { es: 'HITO',           en: 'MILESTONE',     cssVar: '--tl-milestone' },
};

export function AceternityTimeline({
  data,
  lang = 'es',
}: {
  data: Entry[];
  lang?: string;
}) {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [shown, setShown] = useState<boolean[]>(() => data.map(() => false));

  // Reveal each entry with a fade-up as it enters the viewport (replaces the
  // motion that the old animated rail provided).
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = Number((e.target as HTMLElement).dataset.idx);
          setShown((prev) => {
            if (prev[idx]) return prev;
            const next = [...prev];
            next[idx] = true;
            return next;
          });
          io.unobserve(e.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    itemRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const isEs = lang !== 'en';

  return (
    <div>
      {data.map((entry, i) => {
        const meta = TYPE_META[entry.entry_type] ?? TYPE_META.work;
        const typeLabel = isEs ? meta.es : meta.en;
        const color = `var(${meta.cssVar})`;
        const showType = entry.entry_type !== 'work';

        return (
          <div
            key={i}
            ref={(el) => { itemRefs.current[i] = el; }}
            data-idx={i}
            style={{
              opacity: shown[i] ? 1 : 0,
              transform: shown[i] ? "none" : "translateY(26px)",
              transition: "opacity 0.7s cubic-bezier(0.25,1,0.5,1), transform 0.7s cubic-bezier(0.25,1,0.5,1)",
              transitionDelay: `${Math.min(i, 4) * 60}ms`,
            }}
          >
            {/* Divider between entries — the section-header gradient motif. */}
            {i > 0 && (
              <div style={{
                height: "1px",
                background: "linear-gradient(90deg, var(--border-color), transparent)",
                margin: "clamp(2.25rem, 5vw, 3.75rem) 0",
              }} />
            )}

            <div style={{
              display: "flex",
              gap: "clamp(1.25rem, 4vw, 3.5rem)",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}>
              {/* Left: oversized year + colored type accent bar */}
              <div style={{
                minWidth: "clamp(110px, 16vw, 190px)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}>
                <span style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 900,
                  fontSize: "clamp(1.6rem, 3.4vw, 2.7rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}>
                  {entry.period}
                </span>
                <span style={{
                  width: "34px",
                  height: "3px",
                  borderRadius: "999px",
                  background: color,
                }} />
              </div>

              {/* Right: content */}
              <div style={{ flex: 1, minWidth: "min(100%, 260px)", paddingTop: "0.1rem" }}>
                {showType && (
                  <span style={{
                    display: "block",
                    fontFamily: "var(--font-mono, 'Courier New', monospace)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.22em",
                    color,
                    textTransform: "uppercase" as const,
                    marginBottom: "0.7rem",
                  }}>
                    {typeLabel}
                  </span>
                )}

                <h3 style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 900,
                  fontSize: "clamp(1.35rem, 2.6vw, 2.1rem)",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                  marginBottom: "0.5rem",
                }}>
                  {entry.company}
                </h3>

                <p style={{
                  fontFamily: "var(--font-mono, 'Courier New', monospace)",
                  fontSize: "0.64rem",
                  color: "var(--text-muted)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase" as const,
                  marginBottom: "1rem",
                }}>
                  {entry.role}
                </p>

                <p style={{
                  fontSize: "0.9rem",
                  lineHeight: 1.75,
                  color: "var(--text-secondary)",
                  maxWidth: "680px",
                }}>
                  {entry.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
