/**
 * Reactive rule engine — evaluates declarative formulas from rules.json
 * against a context of named values (scalars and arrays).
 */

export interface Rule {
  id: string;
  formula: string;
  inputs: string[];
}

export interface RulesFile {
  version: number;
  rules: Rule[];
}

export type Context = Map<string, number>;
export type StringContext = Map<string, string>;
export type ArrayContext = Map<string, Record<string, number | string>[]>;

/**
 * Evaluate all rules in topological order.
 */
export function evaluate(rules: Rule[], ctx: Context, arrays?: ArrayContext, stringCtx?: StringContext): Map<string, number> {
  const results = new Map<string, number>();
  const arrCtx = arrays ?? new Map();
  const strCtx = stringCtx ?? new Map();

  const pending = [...rules];
  const maxIterations = pending.length * 2;
  let iterations = 0;

  while (pending.length > 0 && iterations < maxIterations) {
    iterations++;
    const idx = pending.findIndex(r =>
      r.inputs.every(inp => ctx.has(inp) || results.has(inp) || arrCtx.has(inp) || strCtx.has(inp))
    );
    if (idx === -1) break;

    const rule = pending.splice(idx, 1)[0];
    const value = evalFormula(rule.formula, ctx, results, arrCtx, strCtx);
    results.set(rule.id, value);
    ctx.set(rule.id, value);
  }

  return results;
}

/**
 * Evaluate a formula string.
 * Supports: arithmetic, floor/ceil/min/max/abs, and aggregate functions:
 *   sum_lookup(arrayName, field, lookupTable, lookupKey, lookupValue)
 *   sum(arrayName, field)
 *   sum_where(arrayName, sumField, filterField, filterValue)
 *   count(arrayName)
 *   lookup(arrayName, keyField, keyValue, valueField)
 *   if(condition, thenValue, elseValue)
 */
function evalFormula(formula: string, ctx: Context, results: Map<string, number>, arrays: ArrayContext, stringCtx: StringContext): number {
  // Process aggregate functions first
  let processed = formula;

  // sum_lookup(arrayName, field, lookupTableName, lookupKeyField, lookupValueField)
  processed = processed.replace(
    /sum_lookup\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\)/g,
    (_match, arrayName, field, tableName, keyField, valueField) => {
      const arr = arrays.get(arrayName) ?? [];
      const table = arrays.get(tableName) ?? [];
      let sum = 0;
      for (const item of arr) {
        const key = item[field] ?? 0;
        const row = table.find(r => r[keyField] === key);
        sum += Number(row ? (row[valueField] ?? 0) : 0);
      }
      return String(sum);
    }
  );

  // sum_where(arrayName, sumField, filterField, filterValue)
  processed = processed.replace(
    /sum_where\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_0-9.]+)\)/g,
    (_match, arrayName, sumField, filterField, filterValue) => {
      const arr = arrays.get(arrayName) ?? [];
      const fv = Number(filterValue);
      const filtered = arr.filter(item => item[filterField] === fv);
      return String(filtered.reduce((s, item) => s + Number(item[sumField] ?? 0), 0));
    }
  );

  // sum(arrayName, field)
  processed = processed.replace(
    /sum\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\)/g,
    (_match, arrayName, field) => {
      const arr = arrays.get(arrayName) ?? [];
      return String(arr.reduce((s, item) => s + Number(item[field] ?? 0), 0));
    }
  );

  // count(arrayName)
  processed = processed.replace(
    /count\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\)/g,
    (_match, arrayName) => {
      return String((arrays.get(arrayName) ?? []).length);
    }
  );

  // lookup(arrayName, keyField, keyValue, valueField) — keyValue resolved from context
  processed = processed.replace(
    /lookup\(([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_0-9.]+),\s*([\wáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+)\)/g,
    (_match, arrayName, keyField, keyValue, valueField) => {
      const arr = arrays.get(arrayName) ?? [];
      // Resolve keyValue: check if it's a context variable name or a literal number
      let kv: number | string;
      const ctxVal = ctx.get(keyValue) ?? results.get(keyValue);
      if (ctxVal !== undefined) {
        kv = ctxVal; // numeric from context
      } else {
        kv = Number(keyValue) || 0;
      }
      // Check string context for string-keyed lookups
      const strCtxVal = stringCtx.get(keyValue);
      if (strCtxVal !== undefined) {
        const row = arr.find(r => r[keyField] === strCtxVal);
        return String(Number(row ? (row[valueField] ?? 0) : 0));
      }
      const row = arr.find(r => r[keyField] === kv);
      return String(Number(row ? (row[valueField] ?? 0) : 0));
    }
  );

  // Replace remaining identifiers with their values (before if() processing)
  const resolved = processed.replace(/[a-záéíóöőúüűA-ZÁÉÍÓÖŐÚÜŰ_][a-záéíóöőúüűA-ZÁÉÍÓÖŐÚÜŰ0-9_.]*/g, (match) => {
    if (match === 'floor' || match === 'ceil' || match === 'min' || match === 'max' || match === 'abs' || match === 'if') return match;
    const val = results.get(match) ?? ctx.get(match) ?? 0;
    return String(val);
  });

  try {
    // Support if(cond, then, else) as ternary
    const withIf = resolved.replace(
      /if\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
      '(($1) ? ($2) : ($3))'
    );
    const fn = new Function('floor', 'ceil', 'min', 'max', 'abs', `return (${withIf});`);
    return fn(Math.floor, Math.ceil, Math.min, Math.max, Math.abs);
  } catch {
    return 0;
  }
}

/**
 * Build a flat context map from the character state and konstansok.
 */
export function buildContext(
  tulajdonságok: Record<string, number> | object,
  tsz: number,
  konstansok: { harcérték_alap: Record<string, number>; kp: Record<string, number>; arányok: Record<string, number>; kp_bónusz?: Record<string, number> },
  extras?: Record<string, number>,
): Context {
  const ctx: Context = new Map();

  for (const [key, val] of Object.entries(tulajdonságok)) {
    ctx.set(`tulajdonságok.${key}`, val);
  }

  ctx.set('tsz', tsz);

  for (const [key, val] of Object.entries(konstansok.harcérték_alap)) {
    ctx.set(`konstansok.harcérték_alap.${key}`, val as number);
  }
  for (const [key, val] of Object.entries(konstansok.kp)) {
    ctx.set(`konstansok.kp.${key}`, val as number);
  }
  for (const [key, val] of Object.entries(konstansok.arányok)) {
    ctx.set(`konstansok.arányok.${key}`, val as number);
  }
  if (konstansok.kp_bónusz) {
    for (const [key, val] of Object.entries(konstansok.kp_bónusz)) {
      ctx.set(`konstansok.kp_bónusz.${key}`, val as number);
    }
  }

  if (extras) {
    for (const [key, val] of Object.entries(extras)) {
      ctx.set(key, val);
    }
  }

  return ctx;
}

/**
 * Build array context from character data (képzettségek, fortélyok, etc.)
 */
export function buildArrayContext(
  képzettségek: { név: string; szint: number }[],
  fortélyok: readonly { név: string; fok: number }[],
  kepzettsegKpTable: { szint: number; kp: number }[],
  fortelyKpMap?: Map<string, number>,
  harciFortelyNevek?: Set<string>,
  opts?: {
    tsz?: number;
    ingyenesFortelyok?: { név: string; ingyenes_perszint: number; kp_perfok: number }[];
    primerKepNevek?: Set<string>;
    primerFortNevek?: Set<string>;
    szabadFortelyNevek?: Set<string>;
  },
): ArrayContext {
  const arrays: ArrayContext = new Map();

  arrays.set('képzettségek', képzettségek.map(k => ({ szint: k.szint })));

  // Szabad fortélyok ingyenes kerete: TSz db összesen
  const szabadIngyenesDb = (opts?.szabadFortelyNevek && opts.tsz) ? opts.tsz : 0;
  let szabadCount = 0;

  // Only include fortélyok that cost KP (kp_perfok > 0), using base name lookup
  // Kiérdemelt fortélyok: soha nem kerülnek KP-ba
  // Szabad fortélyok: az első TSz db ingyenes (nem kerül be a KP összegbe)
  const kpFortélyok = fortélyok.filter(f => {
    if ((f as any).kiérdemelt) return false;
    if (!fortelyKpMap) return true;
    const perFok = fortelyKpMap.get(f.név) ?? 6;
    if (perFok <= 0) return false;
    if (opts?.szabadFortelyNevek?.has(f.név) && !(f as any).kiérdemelt && szabadCount < szabadIngyenesDb) {
      szabadCount++;
      return false;
    }
    return true;
  });
  arrays.set('fortélyok', kpFortélyok.map(f => ({ fok: f.fok })));

  // kp_bónusz_fortélyok: fortélyok with negative kp_perfok (they GIVE KP)
  if (fortelyKpMap) {
    const bónusz: Record<string, number | string>[] = [];
    for (const f of fortélyok) {
      const perFok = fortelyKpMap.get(f.név) ?? 6;
      if (perFok < 0) {
        bónusz.push({ bónusz_kp: f.fok * Math.abs(perFok) });
      }
    }
    arrays.set('kp_bónusz_fortélyok', bónusz);
  }

  arrays.set('kp_tábla', kepzettsegKpTable.map(e => ({ szint: e.szint, kp: e.kp })));

  // harci_fortélyok: for max_HM calculation
  if (harciFortelyNevek) {
    const harci = fortélyok.filter(f => harciFortelyNevek.has(f.név));
    arrays.set('harci_fortélyok', harci.map(f => ({ fok: f.fok, is_mesterfegyver: f.név === 'Mesterfegyver' ? 1 : 0 })));
  }

  // kiemelt_fortélyok: for kiemelt_kp calculation (ingyenes keret felettiek)
  if (opts?.ingyenesFortelyok && opts.tsz !== undefined) {
    const kiemelt: Record<string, number | string>[] = [];
    for (const d of opts.ingyenesFortelyok) {
      const ingyenesDb = Math.floor((opts.tsz + 1) / d.ingyenes_perszint);
      const felvettDb = fortélyok.filter(f => f.név === d.név && !(f as any).kiérdemelt).reduce((s, f) => s + f.fok, 0);
      const fizetősDb = Math.max(0, felvettDb - ingyenesDb);
      if (fizetősDb > 0) {
        kiemelt.push({ fizetős_kp: fizetősDb * d.kp_perfok });
      }
    }
    arrays.set('kiemelt_fortélyok', kiemelt);
  }

  // primer_képzettségek: for primer költés calculation
  if (opts?.primerKepNevek) {
    const primer = képzettségek.filter(k => opts.primerKepNevek!.has(k.név));
    arrays.set('primer_képzettségek', primer.map(k => ({ szint: k.szint })));
  }

  // primer_fortélyok: for primer költés calculation (fok * kp_perfok)
  if (opts?.primerFortNevek && fortelyKpMap) {
    const primerFort: Record<string, number | string>[] = [];
    for (const f of fortélyok) {
      if ((f as any).kiérdemelt) continue;
      if (opts.primerFortNevek.has(f.név)) {
        const perFok = fortelyKpMap.get(f.név) ?? 6;
        if (perFok > 0) primerFort.push({ kp: f.fok * perFok });
      }
    }
    arrays.set('primer_fortélyok', primerFort);
  }

  return arrays;
}
