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

/** Az alcél (képzettség / Tulajdonság szűkítés) olvasható neve; más prefix (érzék, fortély) a Hatás nevében már szerepel. */
function alcélNév(alcél: string | undefined, képzettségNév?: (id: string) => string | undefined): string | undefined {
  if (!alcél) return undefined;
  const [pre, név] = alcél.split(':');
  if (pre === 'tulajdonság') return név.charAt(0).toUpperCase() + név.slice(1);
  if (pre === 'képzettség') return képzettségNév?.(név) ?? név.charAt(0).toUpperCase() + név.slice(1);
  return undefined;
}

/**
 * Egy hatás-sor felirata. Státusz-hatásnál (`hatás_név`, engine_spec §22.4) a 081-es Hatás neve (+ alcél, + megjegyzés),
 * pl. „Mozgás - feleződik", „Előny+1: Képzettségpróba (Fájdalomtűrés) - áfiumok …"; egyébként (taktika) mód/cél alapján.
 */
export function fmtHatás(
  h: { mód: string; cél: string; érték?: number; megjegyzés?: string; alcél?: string; hatás_név?: string },
  eseményNév: (id: string) => string, képzettségNév?: (id: string) => string | undefined,
): string | null {
  const op = h.mód;
  if (op === 'szöveges') return h.megjegyzés || null;
  if (h.hatás_név) {
    const a = alcélNév(h.alcél, képzettségNév);
    return `${h.hatás_név}${a ? ` (${a})` : ''}${h.megjegyzés ? ` - ${h.megjegyzés}` : ''}`;
  }
  if (op === 'letilt') return `❌ Letiltva: ${eseményNév(h.cél)}`;
  if (op === 'előny' || op === 'hátrány') return `${op === 'előny' ? 'Előny' : 'Hátrány'}${(h.érték ?? 0) > 0 ? '+' : ''}${h.érték ?? 0}: ${eseményNév(h.cél)}`;
  if (op === 'szorzó') return `×${h.érték ?? 1}: ${eseményNév(h.cél)}`;
  if (op === 'max_limit') return `max ${h.érték}: ${eseményNév(h.cél)}`;
  if (op === 'enyhít') return `Enyhítés+${h.érték}: ${eseményNév(h.cél)}`;
  return `${op} ${h.érték ?? ''}: ${eseményNév(h.cél)}`;
}

/**
 * Egy hatás-lista feliratai (null kimarad); az egymás után ismétlődő felirat egyszer - egy több mechanika-sorból álló
 * Hatás (pl. Mozgás - képtelen: mozgás + harci_képesség tiltás) egy sorként látszik.
 */
export function hatásFeliratok(
  hatások: Parameters<typeof fmtHatás>[0][], eseményNév: (id: string) => string, képzettségNév?: (id: string) => string | undefined,
): string[] {
  const ki: string[] = [];
  for (const h of hatások) {
    const t = fmtHatás(h, eseményNév, képzettségNév);
    if (t && t !== ki[ki.length - 1]) ki.push(t);
  }
  return ki;
}
