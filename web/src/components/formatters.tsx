import type { ReactNode } from 'react';

export function fmtCode(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) => p.startsWith('`') && p.endsWith('`')
    ? <code key={i} style={{ fontFamily: 'monospace', background: '#333', padding: '0 3px', borderRadius: '2px' }}>{p.slice(1, -1)}</code>
    : p
  );
}

export function fmtHatás(h: { operátor: string; cél: string; érték?: number; megjegyzés?: string }, eseményNév: (id: string) => string): string | null {
  if (h.operátor === 'szöveges') return h.megjegyzés || null;
  if (h.operátor === 'letilt') return `❌ Letiltva: ${eseményNév(h.cél)}`;
  if (h.operátor === 'előny' || h.operátor === 'hátrány') return `${h.operátor === 'előny' ? 'Előny' : 'Hátrány'}${(h.érték ?? 0) > 0 ? '+' : ''}${h.érték ?? 0}: ${eseményNév(h.cél)}`;
  if (h.operátor === 'duplázás' || h.operátor === 'arányos') return `×${h.érték ?? 1}: ${eseményNév(h.cél)}`;
  if (h.operátor === 'max_limit') return `max ${h.érték}: ${eseményNév(h.cél)}`;
  if (h.operátor === 'enyhít') return `Enyhítés+${h.érték}: ${eseményNév(h.cél)}`;
  return `${h.operátor} ${h.érték ?? ''}: ${eseményNév(h.cél)}`;
}
