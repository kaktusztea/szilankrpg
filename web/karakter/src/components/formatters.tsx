import type { ReactNode } from 'react';

export function fmtCode(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) => p.startsWith('`') && p.endsWith('`')
    ? <code key={i} className="fmt-code">{p.slice(1, -1)}</code>
    : p
  );
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
