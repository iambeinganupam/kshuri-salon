// ─────────────────────────────────────────────────────────────────────────────
// Lucide icon name → component map for service-category roots.
//
// The DB stores icon names as short strings (e.g. "scissors", "sparkles")
// instead of bundling components, so the same string can drive web + native
// rendering. This map resolves them for the web. Add new keys as new roots
// arrive in the taxonomy; an unrecognised icon falls back to `Tag`.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Scissors,
  Sparkles,
  Flower,
  Flower2,
  Gem,
  Palette,
  Wand2,
  Brush,
  Tag,
  Smile,
  Heart,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  scissors: Scissors,
  sparkles: Sparkles,
  flower: Flower2,        // outlined floral; Flower is too dense visually
  'flower-alt': Flower,
  gem: Gem,
  palette: Palette,
  wand: Wand2,
  brush: Brush,
  smile: Smile,
  heart: Heart,
  tag: Tag,
};

export function resolveCategoryIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Tag;
  return CATEGORY_ICON_MAP[name] ?? Tag;
}
