import {
  Activity, BookOpen, BowArrow, Check, ChevronDown, ChevronRight, ClipboardList, Download, FileText, Folder,
  Gamepad2, Heart, IdCard, Lightbulb, Link, Lock, Maximize, Package, Pencil, Plus, QrCode, RefreshCw, RotateCcw,
  Save, Share2, Shield, Signal, Skull, Smartphone, Sparkles, Sword, Swords, Undo2, User, Wrench, X, Zap,
  type LucideIcon,
} from 'lucide-react';

// Single place that maps app icon names to the icon set (lucide-react).
// Add new icons here; components never import from lucide-react directly.
const IKONOK = {
  // UI marks
  bezár: X, pipa: Check, kudarc: X, reset: RotateCcw, visszavon: Undo2, frissít: RefreshCw,
  lenyit: ChevronDown, jobbra: ChevronRight, szerkeszt: Pencil, zár: Lock, infó: Lightbulb,
  teljesképernyő: Maximize, új: Plus,
  // tabs and modes
  aktív: Activity, harc: Sword, távharc: BowArrow, pajzs: Shield, misztikus: Sparkles,
  játék: Gamepad2, szerk: Wrench, karakter: User,
  // combat and game
  manőver: Swords, energia: Zap, halott: Skull, gyógy: Heart, fokozatos: Signal, adatlap: IdCard,
  // files and sharing
  mentés: Save, megosztás: Share2, import: Download, csomag: Package, fájl: FileText, mappa: Folder,
  qr: QrCode, link: Link, vágólap: ClipboardList, könyv: BookOpen, telefon: Smartphone,
} satisfies Record<string, LucideIcon>;

export type IkonNév = keyof typeof IKONOK;

/**
 * Decorative SVG icon. Default size 1em: scales with the surrounding font-size (like the emoji it replaces)
 * and inherits the text color. Hidden from screen readers - label the parent instead.
 */
export function Ikon({ név, méret = '1em', className }: { név: IkonNév; méret?: number | string; className?: string }) {
  const Komponens = IKONOK[név];
  return <Komponens size={méret} className={className ? `ikon ${className}` : 'ikon'} aria-hidden="true" />;
}
