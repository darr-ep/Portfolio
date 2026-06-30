import React, { useEffect, useRef, useState } from "react";

type EntryType = 'work' | 'freelance' | 'education' | 'project' | 'certification' | 'milestone';

type Entry = {
  period: string;
  company: string;
  role: string;
  description: string;
  entry_type: EntryType;
};

const TYPE_LABELS: Record<EntryType, { es: string; en: string; color: string }> = {
  work:          { es: 'TRABAJO',        en: 'WORK',          color: 'var(--accent)' },
  freelance:     { es: 'FREELANCE',      en: 'FREELANCE',     color: '#7dd3fc' },
  education:     { es: 'EDUCACIÓN',      en: 'EDUCATION',     color: '#86efac' },
  project:       { es: 'PROYECTO',       en: 'PROJECT',       color: '#c4b5fd' },
  certification: { es: 'CERTIFICACIÓN',  en: 'CERTIFICATION', color: '#fda4af' },
  milestone:     { es: 'HITO',           en: 'MILESTONE',     color: 'var(--text-muted)' },
};

export function AceternityTimeline({
  data,
  lang = 'es',
}: {
  data: Entry[];
  lang?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fillHeight, setFillHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrolled = Math.max(0, vh - rect.top);
      const progress = Math.min(scrolled / rect.height, 1);
      setFillHeight(progress * rect.height);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const isEs = lang !== 'en';

  return (
    <div ref={containerRef} style={{ position: "relative", paddingLeft: "1.5rem" }}>
      {/* Track */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "2px",
        background: "var(--border-color)",
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: fillHeight,
          background: "linear-gradient(to bottom, var(--accent), transparent)",
          transition: "height 80ms linear",
        }} />
      </div>

      {data.map((entry, i) => {
        const meta = TYPE_LABELS[entry.entry_type] ?? TYPE_LABELS.work;
        const typeLabel = isEs ? meta.es : meta.en;
        const showBadge = entry.entry_type !== 'work';

        return (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "clamp(1.5rem, 4vw, 4rem)",
              paddingBottom: i < data.length - 1 ? "clamp(3rem, 6vw, 5rem)" : 0,
            }}
          >
            {/* Left: dot + year (sticky) */}
            <div style={{
              position: "sticky",
              top: "5rem",
              alignSelf: "flex-start",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.6rem",
              minWidth: "clamp(70px, 12vw, 120px)",
              paddingTop: "0.15rem",
            }}>
              <div style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "var(--bg-primary)",
                border: `2px solid ${meta.color}`,
                boxShadow: `0 0 10px ${meta.color}55`,
                flexShrink: 0,
                marginLeft: "-8px",
              }} />
              <span style={{
                fontFamily: "var(--font-mono, 'Courier New', monospace)",
                fontSize: "0.7rem",
                color: meta.color,
                letterSpacing: "0.1em",
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                marginTop: "0.25rem",
              }}>
                {entry.period}
              </span>
            </div>

            {/* Right: content */}
            <div style={{ flex: 1, paddingTop: "0.1rem" }}>
              {showBadge && (
                <span style={{
                  display: "inline-block",
                  fontFamily: "var(--font-mono, 'Courier New', monospace)",
                  fontSize: "0.55rem",
                  letterSpacing: "0.2em",
                  color: meta.color,
                  border: `1px solid ${meta.color}55`,
                  borderRadius: "3px",
                  padding: "0.15rem 0.5rem",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase" as const,
                }}>
                  {typeLabel}
                </span>
              )}

              <h3 style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 900,
                fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginBottom: "0.5rem",
              }}>
                {entry.company}
              </h3>

              <p style={{
                fontFamily: "var(--font-mono, 'Courier New', monospace)",
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                marginBottom: "1.25rem",
              }}>
                {entry.role}
              </p>

              <p style={{
                fontSize: "0.9rem",
                lineHeight: 1.75,
                color: "var(--text-secondary)",
                maxWidth: "560px",
              }}>
                {entry.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
