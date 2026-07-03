import * as SimpleIcons from 'simple-icons';
import { titleToSlug, slugToVariableName } from 'simple-icons/sdk';

export interface TechIcon {
  svg: string;
  hex: string;
  title: string;
}

// simple-icons has no separate mark for these — they share (or should visually borrow) the
// parent brand's logo. Keep this list to genuine one-to-one substitutions, not a full override system.
const ALIASES: Record<string, string> = {
  'react native': 'react',
};

// Best-effort auto-detect: converts a free-typed stack tag (e.g. "React Native") into
// simple-icons' slug convention and looks up the matching brand icon. Tags with no match
// (e.g. "Expo Router", "Zustand" — not in the catalog) simply render without an icon.
export function getTechIcon(name: string): TechIcon | null {
  const alias = ALIASES[name.trim().toLowerCase()];
  const slug = titleToSlug(alias ?? name);
  const varName = slugToVariableName(slug);
  const icon = (SimpleIcons as unknown as Record<string, TechIcon | undefined>)[varName];
  return icon ?? null;
}
