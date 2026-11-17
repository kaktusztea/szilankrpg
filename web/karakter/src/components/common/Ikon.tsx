import {
  Hand,
  Layers,
  ArrowLeftRight,
  Copy,
  Activity, BookOpen, BowArrow, Check, ChevronDown, ChevronRight, ClipboardList, Download, FileText, Folder,
  Gamepad2, HardHat, Heart, Lightbulb, Link, Lock, Maximize, Package, Pencil, Plus, QrCode, RefreshCw, RotateCcw, ScrollText,
  Save, Share2, Shield, ShieldCheck, Signal, Skull, Smartphone, Sparkles, Sword, Swords, Trash2, Undo2, User, Wrench, X, Zap,
  type LucideIcon,
} from 'lucide-react';

// Single place that maps app icon names to the icon set (lucide-react).
// Add new icons here; components never import from lucide-react directly.
const IKONOK = {
  // UI marks
  bezár: X, pipa: Check, kudarc: X, reset: RotateCcw, visszavon: Undo2, frissít: RefreshCw,
  lenyit: ChevronDown, jobbra: ChevronRight, szerkeszt: Pencil, zár: Lock, infó: Lightbulb,
  teljesképernyő: Maximize, új: Plus, kuka: Trash2,
  // tabs and modes
  aktív: Activity, harc: Sword, távharc: BowArrow, pajzs: Shield, viselve: ShieldCheck, sisak: HardHat, misztikus: Sparkles,
  játék: Gamepad2, szerk: Wrench, karakter: User,
  // combat and game
  manőver: Swords, energia: Zap, halott: Skull, gyógy: Heart, fokozatos: Signal, előtörténet: ScrollText,
  // files and sharing
  mentés: Save, megosztás: Share2, import: Download, csomag: Package, fájl: FileText, mappa: Folder,
  qr: QrCode, link: Link, vágólap: ClipboardList, könyv: BookOpen, telefon: Smartphone,
  másolat: Copy,
  helyettesít: ArrowLeftRight,
  összetett: Layers,
  kézi: Hand,
} satisfies Record<string, LucideIcon>;

/** Own icons (no lucide equivalent), drawn on lucide's 24x24 grid. */
function Kocka({ size, className }: { size: number | string; className: string }) {
  // Six-sided die in perspective, outline (lucide stroke style) with a single pip on the top face:
  // the pip is just enough to read as a die without the clutter of a full pip set.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2 21 7 21 17 12 22 3 17 3 7z" />
      <path d="M3 7 12 12 21 7M12 12v10" />
      <ellipse cx="12" cy="7" rx="1.9" ry="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SAJÁT_IKONOK = { kocka: Kocka };

export type IkonNév = keyof typeof IKONOK | keyof typeof SAJÁT_IKONOK;

/**
 * Decorative SVG icon. Default size 1em: scales with the surrounding font-size (like the emoji it replaces)
 * and inherits the text color. Hidden from screen readers - label the parent instead.
 */
export function Ikon({ név, méret = '1em', className }: { név: IkonNév; méret?: number | string; className?: string }) {
  const osztály = className ? `ikon ${className}` : 'ikon';
  if (név in SAJÁT_IKONOK) {
    const Saját = SAJÁT_IKONOK[név as keyof typeof SAJÁT_IKONOK];
    return <Saját size={méret} className={osztály} />;
  }
  const Komponens = IKONOK[név as keyof typeof IKONOK];
  return <Komponens size={méret} className={osztály} aria-hidden="true" />;
}
