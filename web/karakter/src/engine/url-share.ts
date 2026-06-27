/**
 * Karakter URL Export/Import (engine_spec §40)
 * Encode: karakter → kompakt JSON → deflate → base64url
 * Decode: base64url → inflate → kompakt JSON → karakter
 */
import { deflate, inflate } from 'pako';
import type { Karakter, Fortely, FegyverPeldany } from './types';
import { DEFAULT_SESSION } from './types';

// ============================================================
// base64url (RFC 4648 §5, no padding)
// ============================================================

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ============================================================
// Kompaktálás (§40.2–40.8)
// ============================================================

const TULAJ_ORDER = ['erő', 'edzettség', 'ügyesség', 'gyorsaság', 'intelligencia', 'emlékezet', 'önuralom', 'érzékenység'] as const;

interface CompactKarakter {
  sv: number;
  n: string;
  bn?: string;
  j?: string;
  t: number;
  l?: string;
  k: number;
  an: string;
  v?: string;
  tu: number[];
  hm: [number, number];
  cm: number;
  kp: [string, number][];
  fo: (string | number)[][];
  fs?: Record<string, boolean | number>;
  ht: (string | string[])[];
  fg: (string | number)[][];
  tf: string[];
  pa?: Record<string, string | number | boolean>;
  pj?: string;
  fl?: { nt: [string, number][] };
}

function compactEncode(k: Karakter): CompactKarakter {
  const c: CompactKarakter = {
    sv: k.schema_version,
    n: k.név,
    t: k.tsz,
    k: k.kor,
    an: k.anyanyelv,
    tu: TULAJ_ORDER.map(key => k.tulajdonságok[key]),
    hm: [k.HM_TÉ, k.HM_VÉ],
    cm: k.CM,
    kp: k.képzettségek.map(kp => [kp.név, kp.szint]),
    fo: k.fortélyok.map(f => {
      const entry: (string | number)[] = [f.név, f.fok];
      if (f.spec_típus) { entry.push(f.spec_típus, f.spec_elem); }
      if (f.kiérdemelt) entry.push(1);
      return entry;
    }),
    ht: [k.hátterek.faj],
    fg: k.fegyverek.map(f => {
      const e: (string | number)[] = [f.alap];
      if (f.név || f.anyag !== 'acél' || f.idea !== 0) e.push(f.név);
      if (f.anyag !== 'acél' || f.idea !== 0) e.push(f.anyag);
      if (f.idea !== 0) e.push(f.idea);
      return e;
    }),
    tf: k.távfegyverek.map(t => t.alap),
  };

  if (k.becenév) c.bn = k.becenév;
  if (k.játékos) c.j = k.játékos;
  if (k.leírás) c.l = k.leírás;
  if (k.vallás) c.v = k.vallás;

  // fortélyok_speciális: csak non-default
  const fs: Record<string, boolean | number> = {};
  if (k.fortélyok_speciális.analfabéta) fs.analfabéta = true;
  if (k.fortélyok_speciális.apró_méretű_lény) fs.apró_méretű_lény = true;
  if (k.fortélyok_speciális.tartós_sérülés_fok) fs.tartós_sérülés_fok = k.fortélyok_speciális.tartós_sérülés_fok;
  if (k.fortélyok_speciális.vakság) fs.vakság = true;
  if (k.fortélyok_speciális.süketség) fs.süketség = true;
  if (Object.keys(fs).length) c.fs = fs;

  // hátterek: leíró és karma
  if (k.hátterek.leíró.length) c.ht.push(k.hátterek.leíró);
  else if (k.hátterek.karma.length) c.ht.push([]);
  if (k.hátterek.karma.length) c.ht.push(k.hátterek.karma);

  // páncél: csak non-default
  if (k.páncél.alap) {
    const pa: Record<string, string | number | boolean> = { alap: k.páncél.alap };
    if (k.páncél.név) pa.név = k.páncél.név;
    if (k.páncél.fémalapanyag) pa.fémalapanyag = k.páncél.fémalapanyag;
    if (k.páncél.idea !== 0) pa.idea = k.páncél.idea;
    if (k.páncél.kidolgozottság !== 'átlagos') pa.kidolgozottság = k.páncél.kidolgozottság;
    if (k.páncél.sisak) pa.sisak = true;
    if (k.páncél.végtagvédettség !== 0) pa.végtagvédettség = k.páncél.végtagvédettség;
    if (k.páncél.méret_illeszkedés !== 'passzol') pa.méret_illeszkedés = k.páncél.méret_illeszkedés;
    if (k.páncél.rongálódás !== 0) pa.rongálódás = k.páncél.rongálódás;
    c.pa = pa;
  }

  // pajzs
  if (k.pajzs.méret) c.pj = k.pajzs.méret;

  // felszerelés
  if (k.felszerelés.nagy_tárgyak.length) {
    c.fl = { nt: k.felszerelés.nagy_tárgyak.map(t => [t.név, t.MGT]) };
  }

  return c;
}

function compactDecode(c: CompactKarakter): Omit<Karakter, 'uid' | 'id_leíró' | 'mentés_dátum' | 'jegyzetek' | 'napló' | 'session'> {
  const tulajdonságok: any = {};
  TULAJ_ORDER.forEach((key, i) => { tulajdonságok[key] = c.tu[i] ?? 0; });

  const fortélyok: Fortely[] = c.fo.map(f => {
    const entry: Fortely = { név: f[0] as string, fok: f[1] as number, spec_típus: '', spec_elem: '' };
    if (f.length >= 4 && typeof f[2] === 'string') {
      entry.spec_típus = f[2] as string;
      entry.spec_elem = f[3] as string;
    }
    // kiérdemelt flag: utolsó elem === 1 (és nem a fok pozíción)
    const last = f[f.length - 1];
    if (last === 1 && f.length > 2 && (f.length === 3 || f.length === 5)) {
      entry.kiérdemelt = true;
    }
    return entry;
  });

  const fegyverek: FegyverPeldany[] = c.fg.map(f => ({
    alap: f[0] as string,
    név: (f[1] as string) ?? '',
    anyag: (f[2] as string) ?? 'acél',
    idea: (f[3] as number) ?? 0,
  }));

  const hátterek = {
    faj: (c.ht[0] as string) || '',
    leíró: (c.ht[1] as string[] | undefined) || [],
    karma: (c.ht[2] as string[] | undefined) || [],
  };

  const páncél = {
    alap: c.pa?.alap as string || '',
    név: c.pa?.név as string || '',
    fémalapanyag: c.pa?.fémalapanyag as string || '',
    idea: (c.pa?.idea as number) || 0,
    kidolgozottság: c.pa?.kidolgozottság as string || 'átlagos',
    sisak: (c.pa?.sisak as boolean) || false,
    végtagvédettség: (c.pa?.végtagvédettség as number) || 0,
    méret_illeszkedés: c.pa?.méret_illeszkedés as string || 'passzol',
    rongálódás: (c.pa?.rongálódás as number) || 0,
  };

  return {
    schema_version: c.sv,
    név: c.n,
    becenév: c.bn || '',
    játékos: c.j || '',
    tsz: c.t,
    leírás: c.l || '',
    kor: c.k,
    anyanyelv: c.an,
    vallás: c.v || '',
    tulajdonságok,
    HM_TÉ: c.hm[0],
    HM_VÉ: c.hm[1],
    CM: c.cm,
    képzettségek: c.kp.map(([név, szint]) => ({ név, szint })),
    fortélyok,
    fortélyok_speciális: {
      analfabéta: !!(c.fs?.analfabéta),
      apró_méretű_lény: !!(c.fs?.apró_méretű_lény),
      tartós_sérülés_fok: (c.fs?.tartós_sérülés_fok as number) || 0,
      vakság: !!(c.fs?.vakság),
      süketség: !!(c.fs?.süketség),
    },
    hátterek,
    fegyverek,
    távfegyverek: c.tf.map(alap => ({ alap })),
    páncél,
    pajzs: { méret: c.pj || '' },
    felszerelés: { nagy_tárgyak: c.fl?.nt?.map(([név, MGT]) => ({ név, MGT })) || [] },
  };
}

// ============================================================
// Public API
// ============================================================

const CURRENT_SCHEMA_VERSION = 2;

export function encodeKarakterUrl(karakter: Karakter): string {
  const compact = compactEncode(karakter);
  const json = JSON.stringify(compact);
  const compressed = deflate(new TextEncoder().encode(json), { level: 9 });
  const hash = toBase64Url(compressed);
  return `${window.location.origin}${window.location.pathname}#${hash}`;
}

export function decodeKarakterFromHash(hash: string): { karakter: Karakter } | { error: string } {
  try {
    const bytes = fromBase64Url(hash);
    const json = new TextDecoder().decode(inflate(bytes));
    const compact: CompactKarakter = JSON.parse(json);

    if (compact.sv !== CURRENT_SCHEMA_VERSION) {
      return { error: 'Elavult karakter link (inkompatibilis verzió).' };
    }

    const partial = compactDecode(compact);
    const karakter: Karakter = {
      ...partial,
      uid: '',  // caller generates
      id_leíró: '',
      mentés_dátum: '',
      jegyzetek: '',
      napló: [],
      session: { ...DEFAULT_SESSION },
    };
    return { karakter };
  } catch {
    return { error: 'Érvénytelen karakter link.' };
  }
}
