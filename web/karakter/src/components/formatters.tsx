import type { ReactNode } from 'react';

/** Ár-szorzó megjelenítés: max 1 tizedes, egész ha egész (pl. 5, 0.5, 13). */
export function árFormátum(ár: number): string {
  return String(Math.round(ár * 10) / 10);
}

export function fmtCode(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) => p.startsWith('`') && p.endsWith('`')
    ? <code key={i} className="fmt-code">{p.slice(1, -1)}</code>
    : p
  );
}

/** Hatás-szöveg: a `kód` formázás + az „Előny+N" / „Hátrány-N" tokenek előjel-színezése (Aktív fül). */
export function fmtHatásSzöveg(text: string): ReactNode[] {
  return fmtCode(text).flatMap<ReactNode>((n, i) => typeof n !== 'string' ? [n] :
    n.split(/((?:Előny|Hátrány)[+-]?\d+)/g).map((p, j) => j % 2 === 0 ? p
      : <span key={`${i}-${j}`} className={p.startsWith('Előny') ? 'fmt-elony' : 'fmt-hatrany'}>{p}</span>));
}

export function fmtHatás(h: { mód: string; cél: string; érték?: number; megjegyzés?: string }, eseményNév: (id: string) => string): string | null {
  const op = h.mód;
  if (op === 'szöveges') return h.megjegyzés || null;
  if (op === 'letilt') return `❌ Letiltva: ${eseményNév(h.cél)}`;
  if (op === 'előny' || op === 'hátrány') return `${op === 'előny' ? 'Előny' : 'Hátrány'}${(h.érték ?? 0) > 0 ? '+' : ''}${h.érték ?? 0}: ${eseményNév(h.cél)}`;
  if (op === 'szorzó') return `×${h.érték ?? 1}: ${eseményNév(h.cél)}`;
  if (op === 'max_limit') return `max ${h.érték}: ${eseményNév(h.cél)}`;
  if (op === 'enyhít') return `Enyhítés+${h.érték}: ${eseményNév(h.cél)}`;
  return `${op} ${h.érték ?? ''}: ${eseményNév(h.cél)}`;
}
