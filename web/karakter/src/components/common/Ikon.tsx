import { Shield, Swords, Zap, type LucideIcon } from 'lucide-react';

// Single place that maps app icon names to the icon set (lucide-react).
// Add new icons here; components never import from lucide-react directly.
const IKONOK = {
  pajzs: Shield,
  energia: Zap,
  manőver: Swords,
} satisfies Record<string, LucideIcon>;

export type IkonNév = keyof typeof IKONOK;

/** Decorative SVG icon: inherits text color, hidden from screen readers (label the parent instead). */
export function Ikon({ név, méret = 18, className }: { név: IkonNév; méret?: number; className?: string }) {
  const Komponens = IKONOK[név];
  return <Komponens size={méret} className={className} aria-hidden="true" />;
}
